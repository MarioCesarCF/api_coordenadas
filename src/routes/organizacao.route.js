import { Router } from "express";
import OrganizacaoController from "../controllers/organizacao.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const route = Router();
route.use(authMiddleware);

const organizacaoController = new OrganizacaoController();

route.post("/", organizacaoController.criar);
route.get("/me", organizacaoController.showMine);
route.patch("/me", organizacaoController.updateMine);
route.get("/membros", organizacaoController.listarMembros);
route.post("/membros", organizacaoController.convidarMembro);
route.delete("/membros/:id", organizacaoController.removerMembro);

export default route;
