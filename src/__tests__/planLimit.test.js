import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import XLSX from "xlsx";
import app from "../app.js";
import Organizacao from "../models/Organizacao.js";
import Usuario from "../models/Usuario.js";
import { createUser } from "./helpers.js";
import { limitesPorPlano } from "../config/planos.js";

const request = supertest(app);

let accessToken;

async function criarUsuarioComOrg(plano = "free") {
  const user = await createUser();
  const org = await Organizacao.create({
    nome: `Org Teste ${plano}`,
    slug: `org-teste-${plano}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "ativo",
    config_limites: limitesPorPlano(plano),
  });
  await Usuario.findByIdAndUpdate(user._id, {
    organizacao: org._id,
    papel: "admin",
  });
  return { user, org };
}

function createXlsxBuffer(headers, rows) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

describe("Enforcement de limites de plano", () => {
  beforeAll(async () => {
    const { user } = await criarUsuarioComOrg("free");
    const res = await request
      .post("/usuario/login")
      .send({ email: user.email, password: user.plainPassword });
    accessToken = res.body.accessToken;
  });

  it("bloqueia criação de projeto de cálculo no plano free", async () => {
    const res = await request
      .post("/calculo/projeto")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Projeto Free", area_total: 10 });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Cálculos florestais");
  });

  it("permite visualizar a lista de projetos de cálculo no plano free", async () => {
    const res = await request
      .get("/calculo/projeto")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("permite até 5 empresas e bloqueia a 6ª no plano free", async () => {
    for (let i = 1; i <= 5; i++) {
      const ok = await request
        .post("/empresa")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ nome: `Empresa ${i}`, numero_documento: `00000${i}`, cidade: "Ecoporanga" });
      expect(ok.status).toBe(201);
    }

    const blocked = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Empresa Extra", numero_documento: "999999", cidade: "Vitória" });

    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toContain("Limite de empresas");
  });

  it("bloqueia importação que exceda o limite de empresas", async () => {
    const headers = ["Responsável", "CPF/CNPJ", "Cidade"];
    const rows = [
      ["João", "111.111/0001-11", "Ferros"],
      ["Maria", "222.222/0001-22", "Itabira"],
    ];
    const buffer = createXlsxBuffer(headers, rows);

    const res = await request
      .post("/empresa/import")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", buffer, "excesso.xlsx");

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("excede o limite de empresas");
  });

  it("bloqueia upload de documento no plano free (sem armazenamento)", async () => {
    const buffer = createXlsxBuffer(["Nome"], [["Doc"]]);

    const res = await request
      .post("/documento")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("empresa", "qualquer")
      .field("nome", "Documento Free")
      .attach("arquivo", buffer, "doc.xlsx");

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Armazenamento");
  });

  it("bloqueia novo membro quando o limite de usuários é atingido", async () => {
    const res = await request
      .post("/organizacao/membros")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nome: "Membro Extra",
        email: `extra-${Date.now()}@email.com`,
        password: "Teste1234",
        numero_documento: "12312312312",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Limite de usuários");
  });
});

describe("Upgrade de plano libera os recursos", () => {
  beforeAll(async () => {
    const res = await request
      .patch("/organizacao/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ plano: "profissional" });

    expect(res.status).toBe(200);
    expect(res.body.config_limites.calculos_habilitados).toBe(true);
    expect(res.body.config_limites.storage_gb).toBe(10);
    expect(res.body.config_limites.max_empresas).toBe(1000);
  });

  it("permite criar projeto de cálculo após o upgrade", async () => {
    const res = await request
      .post("/calculo/projeto")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Projeto Profissional", area_total: 10 });

    expect(res.status).toBe(201);
  });

  it("permite criar a 6ª empresa após o upgrade", async () => {
    const res = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Empresa Extra OK", numero_documento: "999991", cidade: "Vitória" });

    expect(res.status).toBe(201);
  });

  it("permite upload de documento após o upgrade", async () => {
    const empresa = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Empresa Doc", numero_documento: "1234567", cidade: "Serra" });

    const buffer = createXlsxBuffer(["Nome"], [["Doc"]]);

    const res = await request
      .post("/documento")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("empresa", empresa.body._id)
      .field("nome", "Documento Upgrade")
      .attach("arquivo", buffer, "doc.xlsx");

    expect(res.status).toBe(201);
  });

  it("permite convidar membro após o upgrade", async () => {
    const res = await request
      .post("/organizacao/membros")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nome: "Membro Profissional",
        email: `prof-${Date.now()}@email.com`,
        password: "Teste1234",
        numero_documento: "32132132132",
      });

    expect(res.status).toBe(201);
  });
});
