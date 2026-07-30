import { z } from "zod";

export const criarProjetoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  metodo: z.enum(["parcela_fixa", "censo"]).optional(),
  erro_admissivel: z.coerce.number().min(0.1).max(100).optional(),
  area_parcela: z.coerce.number().positive("Área da parcela deve ser positiva").optional(),
  area_total: z.coerce.number().positive("Área total deve ser positiva").optional(),
  estado: z.string().optional(),
  bioma: z.string().optional(),
});

export const atualizarProjetoSchema = z.object({
  nome: z.string().min(1).optional(),
  metodo: z.enum(["parcela_fixa", "censo"]).optional(),
  erro_admissivel: z.coerce.number().min(0.1).max(100).optional(),
  area_parcela: z.coerce.number().positive().optional(),
  area_total: z.coerce.number().positive().optional(),
});