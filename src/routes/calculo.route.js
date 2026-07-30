import { Router } from "express";
import CalculoController from "../controllers/calculo.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  criarProjetoSchema,
  atualizarProjetoSchema,
} from "../validations/calculo.validation.js";
import upload from "../middlewares/upload.middleware.js";

const route = Router();
const calculoController = new CalculoController();

route.use(authMiddleware);

route.post("/projeto", validate(criarProjetoSchema), calculoController.criarProjeto);
route.get("/projeto", calculoController.listarProjetos);
route.get("/projeto/:id", calculoController.buscarProjeto);
route.delete("/projeto/:id", calculoController.deletarProjeto);

route.post(
  "/projeto/:id/importar",
  upload.single("file"),
  calculoController.importarDados
);

route.post("/projeto/:id/processar", calculoController.processar);
route.get("/projeto/:id/resultados", calculoController.obterResultados);

export default route;