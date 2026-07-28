import { z } from "zod";

export const createDocumentoSchema = z.object({
  empresa: z.string({ required_error: "Empresa é obrigatória." }).min(1, "Empresa não pode ser vazia."),
  nome: z.string({ required_error: "Nome é obrigatório." }).min(1, "Nome não pode ser vazio."),
  data_vencimento: z.string().optional(),
  observacoes: z.string().optional(),
});

export const updateDocumentoSchema = z.object({
  nome: z.string().min(1, "Nome não pode ser vazio.").optional(),
  data_vencimento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});
