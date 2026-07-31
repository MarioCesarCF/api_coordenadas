import { Router } from "express";
import EmpresaController from "../controllers/empresa.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createEmpresaSchema,
  updateEmpresaSchema,
} from "../validations/empresa.validation.js";
import upload from "../middlewares/upload.middleware.js";
import { carregarOrganizacao, checkEmpresaLimit } from "../middlewares/planLimit.middleware.js";

const router = Router();
router.use(authMiddleware);
router.use(carregarOrganizacao);

const empresaController = new EmpresaController();
 
router.get("/", empresaController.findAll);
router.post("/import", upload.single("file"), empresaController.importFile);
router.post("/", validate(createEmpresaSchema), checkEmpresaLimit, empresaController.create);
router.delete("/all", empresaController.deleteAll);
router.get("/:id", empresaController.findById);
router.patch("/:id", validate(updateEmpresaSchema), empresaController.update);
router.delete("/:id", empresaController.delete);

export default router;