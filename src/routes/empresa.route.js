import { Router } from "express";
import EmpresaController from "../controllers/empresa.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createEmpresaSchema,
  updateEmpresaSchema,
} from "../validations/empresa.validation.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();
router.use(authMiddleware);

const empresaController = new EmpresaController();
 
router.get("/", empresaController.findAll);
router.delete("/all", empresaController.deleteAll);
router.get("/:id", empresaController.findById);
router.post("/", validate(createEmpresaSchema), empresaController.create);
router.post("/import", upload.single("file"), empresaController.importFile);
router.patch("/:id", validate(updateEmpresaSchema), empresaController.update);
router.delete("/:id", empresaController.delete);

export default router;