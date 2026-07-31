import { Router } from "express";
import CalculoController from "../controllers/calculo.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  criarProjetoSchema,
  atualizarProjetoSchema,
} from "../validations/calculo.validation.js";
import upload from "../middlewares/upload.middleware.js";
import { carregarOrganizacao, requireCalculos } from "../middlewares/planLimit.middleware.js";

const route = Router();
const calculoController = new CalculoController();

route.use(authMiddleware);
route.use(carregarOrganizacao);

route.post("/projeto", validate(criarProjetoSchema), requireCalculos, calculoController.criarProjeto);
route.get("/projeto", calculoController.listarProjetos);
route.get("/projeto/:id", calculoController.buscarProjeto);
route.delete("/projeto/:id", requireCalculos, calculoController.deletarProjeto);

route.post(
  "/projeto/:id/importar",
  upload.single("file"),
  requireCalculos,
  calculoController.importarDados
);

route.post("/projeto/:id/processar", requireCalculos, calculoController.processar);
route.get("/projeto/:id/resultados", calculoController.obterResultados);

export default route;