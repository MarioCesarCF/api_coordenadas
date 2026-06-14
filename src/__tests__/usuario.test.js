import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../app.js";
import { createUser } from "./helpers.js";

const request = supertest(app);

let accessToken;

beforeAll(async () => {
  const user = await createUser();
  const res = await request
    .post("/usuario/login")
    .send({ email: user.email, password: user.plainPassword });
  accessToken = res.body.accessToken;
});

describe("POST /usuario (criar)", () => {
  it("deve criar usuário autenticado", async () => {
    const res = await request
      .post("/usuario")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nome: "Novo Usuário",
        email: "novo@email.com",
        password: "456",
        numero_documento: "0987654321",
        tipo_perfil: "user",
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("novo@email.com");
  });

  it("deve falhar sem nome para criar", async () => {
    const res = await request
      .post("/usuario")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "sem_nome@email.com",
        password: "456",
        numero_documento: "111111",
        tipo_perfil: "user",
      });

    expect(res.status).toBe(400);
  });

  it("deve falhar sem autenticação para criar", async () => {
    const res = await request.post("/usuario").send({
      nome: "Sem Token",
      email: "semtoken@email.com",
      password: "456",
      numero_documento: "222222",
      tipo_perfil: "user",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /usuario/me", () => {
  it("deve retornar dados do próprio usuário", async () => {
    const res = await request
      .get("/usuario/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email");
    expect(res.body).not.toHaveProperty("password");
  });

  it("deve falhar sem token", async () => {
    const res = await request.get("/usuario/me");
    expect(res.status).toBe(401);
  });
});

describe("PATCH /usuario/me", () => {
  it("deve atualizar próprio usuário", async () => {
    const res = await request
      .patch("/usuario/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nome: "Nome Atualizado" });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Nome Atualizado");
  });
});

describe("DELETE /usuario/me", () => {
  it("deve deletar próprio usuário", async () => {
    const user2 = await createUser();
    const loginRes = await request
      .post("/usuario/login")
      .send({ email: user2.email, password: user2.plainPassword });
    const token2 = loginRes.body.accessToken;

    const res = await request
      .delete("/usuario/me")
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(200);

    const checkRes = await request
      .get("/usuario/me")
      .set("Authorization", `Bearer ${token2}`);

    expect(checkRes.status).toBe(404);
  });
});
