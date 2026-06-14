import { Router } from "express";
import EmpresaController from "../controllers/empresa.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createEmpresaSchema,
  updateEmpresaSchema,
} from "../validations/empresa.validation.js";

const router = Router();
router.use(authMiddleware);

const empresaController = new EmpresaController();
 
router.get("/", empresaController.findAll);
router.get("/:id", empresaController.findById);
router.post("/", validate(createEmpresaSchema), empresaController.create);
router.patch("/:id", validate(updateEmpresaSchema), empresaController.update);
router.delete("/:id", empresaController.delete);

export default router;