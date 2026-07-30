import { z } from "zod";

const passwordSchema = z
  .string({ required_error: "Senha é obrigatória." })
  .min(8, "Senha deve ter no mínimo 8 caracteres.")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número.");

export const createUserSchema = z.object({
  nome: z.string({ required_error: "Nome é obrigatório." }).min(1, "Nome não pode ser vazio."),
  email: z.string({ required_error: "Email é obrigatório." }).email("Email inválido."),
  password: passwordSchema,
  numero_documento: z
    .string({ required_error: "Número do documento é obrigatório." })
    .min(1, "Número do documento não pode ser vazio."),
  tipo_perfil: z
    .string({ required_error: "Tipo de perfil é obrigatório." })
    .min(1, "Tipo de perfil não pode ser vazio."),
  telefone_contato: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string({ required_error: "Email é obrigatório." }).email("Email inválido."),
  password: z.string({ required_error: "Senha é obrigatória." }).min(1, "Senha não pode ser vazia."),
});

export const updateUserSchema = z.object({
  nome: z.string().min(1, "Nome não pode ser vazio.").optional(),
  email: z.string().email("Email inválido.").optional(),
  password: passwordSchema.optional(),
  numero_documento: z.string().min(1, "Número do documento não pode ser vazio.").optional(),
  tipo_perfil: z.string().min(1, "Tipo de perfil não pode ser vazio.").optional(),
  telefone_contato: z.string().optional(),
});
