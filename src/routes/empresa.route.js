import { Router } from "express";
import EmpresaController from "../controllers/empresa.controller.js";

const router = Router();

const empresaController = new EmpresaController();
 
router.get("/", empresaController.findAll);
router.get("/:id", empresaController.findById);
router.post("/", empresaController.create);
router.patch("/:id", empresaController.update);
router.delete("/:id", empresaController.delete);

export default router;