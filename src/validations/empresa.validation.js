import { z } from "zod";

export const createEmpresaSchema = z.object({
  nome: z.string({ required_error: "Nome é obrigatório." }).min(1, "Nome não pode ser vazio."),
  numero_documento: z
    .string({ required_error: "Número do documento é obrigatório." })
    .min(1, "Número do documento não pode ser vazio."),
  cidade: z.string({ required_error: "Cidade é obrigatória." }).min(1, "Cidade não pode ser vazia."),
  local_intervencao: z.string().optional(),
  modalidade: z.string().optional(),
  numero_processo: z.string().optional(),
  ano: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number().int("Ano deve ser um número inteiro."))
    .optional(),
  mes: z.string().optional(),
  decisao: z.string().optional(),
  bioma: z.string().optional(),
  area_autorizada: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Área autorizada deve ser um número."))
    .optional(),
  coordenada_x: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Coordenada X deve ser um número."))
    .optional(),
  longitude: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Longitude deve ser um número."))
    .optional(),
  coordenada_y: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Coordenada Y deve ser um número."))
    .optional(),
  latitude: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Latitude deve ser um número."))
    .optional(),
});

export const updateEmpresaSchema = z.object({
  nome: z.string().min(1, "Nome não pode ser vazio.").optional(),
  numero_documento: z.string().min(1, "Número do documento não pode ser vazio.").optional(),
  cidade: z.string().min(1, "Cidade não pode ser vazia.").optional(),
  local_intervencao: z.string().optional(),
  modalidade: z.string().optional(),
  numero_processo: z.string().optional(),
  ano: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number().int("Ano deve ser um número inteiro."))
    .optional(),
  mes: z.string().optional(),
  decisao: z.string().optional(),
  bioma: z.string().optional(),
  area_autorizada: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Área autorizada deve ser um número."))
    .optional(),
  coordenada_x: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Coordenada X deve ser um número."))
    .optional(),
  longitude: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Longitude deve ser um número."))
    .optional(),
  coordenada_y: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Coordenada Y deve ser um número."))
    .optional(),
  latitude: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number("Latitude deve ser um número."))
    .optional(),
});
