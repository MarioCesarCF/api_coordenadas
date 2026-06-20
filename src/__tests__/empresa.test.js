import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import XLSX from "xlsx";
import app from "../app.js";
import { createUser } from "./helpers.js";

const request = supertest(app);

let accessToken;
let user2AccessToken;

beforeAll(async () => {
  const user1 = await createUser();
  const res1 = await request
    .post("/usuario/login")
    .send({ email: user1.email, password: user1.plainPassword });
  accessToken = res1.body.accessToken;

  const user2 = await createUser();
  const res2 = await request
    .post("/usuario/login")
    .send({ email: user2.email, password: user2.plainPassword });
  user2AccessToken = res2.body.accessToken;
});

describe("POST /empresa", () => {
  it("deve criar empresa vinculada ao usuário logado", async () => {
    const res = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nome: "Empresa Teste",
        numero_documento: "123456",
        cidade: "Ecoporanga",
      });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Empresa Teste");
    expect(res.body.usuario).toBeTruthy();
  });

  it("deve falhar sem nome", async () => {
    const res = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ numero_documento: "654321", cidade: "Vitória" });

    expect(res.status).toBe(400);
  });

  it("deve falhar sem token", async () => {
    const res = await request
      .post("/empresa")
      .send({ nome: "Sem Token", numero_documento: "000", cidade: "X" });

    expect(res.status).toBe(401);
  });
});

describe("GET /empresa", () => {
  it("deve listar apenas empresas do próprio usuário", async () => {
    const res = await request
      .get("/empresa")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /empresa/:id", () => {
  it("deve retornar empresa do próprio usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Minha Empresa", numero_documento: "111", cidade: "A" });

    const res = await request
      .get(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Minha Empresa");
  });

  it("deve permitir acesso a empresa criada por outro usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Visível Para Todos", numero_documento: "222", cidade: "B" });

    const res = await request
      .get(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${user2AccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Visível Para Todos");
  });
});

describe("PATCH /empresa/:id", () => {
  it("deve atualizar empresa do próprio usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Antigo Nome", numero_documento: "333", cidade: "C" });

    const res = await request
      .patch(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Novo Nome" });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Novo Nome");
  });

  it("deve permitir atualização de empresa criada por outro usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Editável", numero_documento: "444", cidade: "D" });

    const res = await request
      .patch(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${user2AccessToken}`)
      .send({ nome: "EditadoPorOutro" });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("EditadoPorOutro");
  });
});

describe("DELETE /empresa/:id", () => {
  it("deve deletar empresa do próprio usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Vai Deletar", numero_documento: "555", cidade: "E" });

    const res = await request
      .delete(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });

  it("deve permitir deleção de empresa criada por outro usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Deletável", numero_documento: "666", cidade: "F" });

    const res = await request
      .delete(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${user2AccessToken}`);

    expect(res.status).toBe(200);
  });
});

function createXlsxBuffer(headers, rows) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createCsvBuffer(headers, rows) {
  const escape = (v) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return Buffer.from(lines.join("\n"), "utf-8");
}

function createXmlBuffer(rootName, itemName, rows) {
  const headers = Object.keys(rows[0]);
  const items = rows.map((r) => {
    const fields = headers.map((h) => `    <${h}>${String(r[h]).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</${h}>`).join("\n");
    return `  <${itemName}>\n${fields}\n  </${itemName}>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${items}\n</${rootName}>`;
  return Buffer.from(xml, "utf-8");
}

describe("POST /empresa/import", () => {
  it("deve importar empresas de arquivo xlsx", async () => {
    const headers = ["Município", "Responsável", "CPF/CNPJ", "Local da intervenção", "Modalidade principal", "Nº do processo", "Ano", "Mês", "Decisão", "Bioma", "Área Autorizada (ha)", "Longitude (X)", "Latitude (Y)", "Fuso"];
    const rows = [
      ["Ferros", "João Silva", "084.123.456-13", "Fazenda Borba", "Supressão vegetal", "2100.01.0013450/2026-15", "2026", "Março", "Deferido", "mata atlântica", "0,34", "684214", "7827504", "23"],
      ["Itabira", "Maria Souza", "113.789.456-55", "Sítio Esperança", "Corte de árvores", "2100.01.0036022/2025-25", "2025", "Janeiro", "Em análise", "mata atlântica", "1,5", "685000", "7828000", "23"],
    ];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "teste.xlsx");

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(2);
    expect(res.body.imported).toBe(2);
    expect(res.body.errors).toHaveLength(0);
    expect(res.body.companies).toHaveLength(2);
    expect(res.body.companies[0].nome).toBe("João Silva");
    expect(res.body.companies[0].cidade).toBe("Ferros");
    expect(res.body.companies[0].fuso).toBe("23");
  });

  it("deve importar empresas de arquivo csv", async () => {
    const headers = ["Município", "Responsável", "CPF/CNPJ", "Decisão"];
    const rows = [
      ["Belo Horizonte", "Empresa ABC", "11.222.333/0001-44", "Deferido"],
      ["Contagem", "Empresa XYZ", "55.666.777/0001-88", "Em análise"],
    ];
    const buffer = createCsvBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "teste.csv");

    expect(res.status).toBe(201);
    expect(res.body.imported).toBe(2);
    expect(res.body.companies[0].cidade).toBe("Belo Horizonte");
  });

  it("deve importar empresas de arquivo xml", async () => {
    const rows = [
      { Municipio: "Nova Lima", Responsavel: "Mineradora X", Documento: "12.345.678/0001-90", Decisao: "Deferido" },
      { Municipio: "Ouro Preto", Responsavel: "Mineradora Y", Documento: "98.765.432/0001-10", Decisao: "Em análise" },
    ];
    const buffer = createXmlBuffer("root", "row", rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "teste.xml");

    expect(res.status).toBe(201);
    expect(res.body.imported).toBe(2);
  });

  it("deve pular duplicata exata e reportar skipped", async () => {
    await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Empresa Dup", numero_documento: "DUPLICATA", cidade: "Teste" });

    const headers = ["Responsável", "CPF/CNPJ", "Cidade"];
    const rows = [["Empresa Dup", "DUPLICATA", "Teste"]];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "dup.xlsx");

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(1);
    expect(res.body.skipped).toBe(1);
    expect(res.body.imported).toBe(0);
  });

  it("deve inserir novo registro quando campos diferem", async () => {
    await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Empresa Original", numero_documento: "DIFERENTE", cidade: "Cidade A" });

    const headers = ["Responsável", "CPF/CNPJ", "Cidade"];
    const rows = [["Empresa Original", "DIFERENTE", "Cidade B"]];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "diff.xlsx");

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(1);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(0);
  });

  it("deve falhar sem token", async () => {
    const headers = ["Responsável", "CPF/CNPJ", "Cidade"];
    const rows = [["Empresa", "123", "Cidade"]];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .attach("file", buffer, "teste.xlsx");

    expect(res.status).toBe(401);
  });

  it("deve falhar sem arquivo", async () => {
    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Nenhum arquivo enviado.");
  });

  it("deve aceitar mapping explícito via body", async () => {
    const headers = ["NomeEmpresa", "Doc", "Cid"];
    const rows = [["Foo Ltda", "99.999/0001-99", "Ipatinga"]];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("mapping", JSON.stringify({ NomeEmpresa: "nome", Doc: "numero_documento", Cid: "cidade" }))
      .attach("file", buffer, "mapping.xlsx");

    expect(res.status).toBe(201);
    expect(res.body.imported).toBe(1);
    expect(res.body.companies[0].nome).toBe("Foo Ltda");
  });

  it("deve reportar erros de validação por linha", async () => {
    const headers = ["Responsável", "Observação"];
    const rows = [["", "apenas preencher"]];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "invalid.xlsx");

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(1);
    expect(res.body.imported).toBe(0);
    expect(res.body.errors).toHaveLength(1);
  });
});
