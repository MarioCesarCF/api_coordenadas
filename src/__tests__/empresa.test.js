import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
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

  it("deve negar acesso a empresa de outro usuário", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Só Minha", numero_documento: "222", cidade: "B" });

    const res = await request
      .get(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${user2AccessToken}`);

    expect(res.status).toBe(403);
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

  it("deve negar atualização de empresa de outro", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Não Toca", numero_documento: "444", cidade: "D" });

    const res = await request
      .patch(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${user2AccessToken}`)
      .send({ nome: "Tentativa" });

    expect(res.status).toBe(403);
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

  it("deve negar deleção de empresa de outro", async () => {
    const createRes = await request
      .post("/empresa")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Não Deleta", numero_documento: "666", cidade: "F" });

    const res = await request
      .delete(`/empresa/${createRes.body._id}`)
      .set("Authorization", `Bearer ${user2AccessToken}`);

    expect(res.status).toBe(403);
  });
});
