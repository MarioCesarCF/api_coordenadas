import Usuario from "../models/Usuario.js";

let counter = 0;

export const createUser = async (overrides = {}) => {
  counter++;
  const suffix = `_test${counter}`;
  const data = {
    nome: "Usuário Teste",
    email: `teste${suffix}@email.com`,
    password: "Teste1234",
    numero_documento: `123456789${counter}`,
    tipo_perfil: "admin",
    ...overrides,
  };

  const user = await Usuario.create(data);
  return { ...user.toObject(), plainPassword: data.password };
};
