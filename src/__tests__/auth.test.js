import { describe, it, expect } from "vitest";
import supertest from "supertest";
import app from "../app.js";
import { createUser } from "./helpers.js";

const request = supertest(app);

describe("POST /usuario/login", () => {
  it("deve logar com credenciais válidas", async () => {
    const user = await createUser();

    const res = await request
      .post("/usuario/login")
      .send({ email: user.email, password: user.plainPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("deve falhar com email inválido", async () => {
    const res = await request
      .post("/usuario/login")
      .send({ email: "invalido", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Dados inválidos.");
    expect(res.body.errors).toBeDefined();
  });

  it("deve falhar com credenciais erradas", async () => {
    const user = await createUser();

    const res = await request
      .post("/usuario/login")
      .send({ email: user.email, password: "senha_errada" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Credenciais inválidas.");
  });

  it("deve falhar sem email", async () => {
    const res = await request
      .post("/usuario/login")
      .send({ password: "123" });

    expect(res.status).toBe(400);
  });

  it("deve falhar sem senha", async () => {
    const res = await request
      .post("/usuario/login")
      .send({ email: "teste@email.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /usuario/refresh", () => {
  it("deve renovar accessToken com refreshToken válido", async () => {
    const user = await createUser();
    const loginRes = await request
      .post("/usuario/login")
      .send({ email: user.email, password: user.plainPassword });
    const res = await request
      .post("/usuario/refresh")
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("deve falhar sem refreshToken", async () => {
    const res = await request.post("/usuario/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("deve falhar com refreshToken inválido", async () => {
    const res = await request
      .post("/usuario/refresh")
      .send({ refreshToken: "token_invalido" });

    expect(res.status).toBe(401);
  });
});

describe("POST /usuario/logout", () => {
  it("deve revogar refreshToken no logout", async () => {
    const user = await createUser();
    const loginRes = await request
      .post("/usuario/login")
      .send({ email: user.email, password: user.plainPassword });
    const accessToken = loginRes.body.accessToken;
    const refreshToken = loginRes.body.refreshToken;

    const logoutRes = await request
      .post("/usuario/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    const refreshRes = await request
      .post("/usuario/refresh")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});
