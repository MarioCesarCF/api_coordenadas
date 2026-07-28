import { Router } from "express";
import DocumentoController from "../controllers/documento.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createDocumentoSchema, updateDocumentoSchema } from "../validations/documento.validation.js";
import uploadDocumento from "../middlewares/uploadDocumento.middleware.js";

const router = Router();
const documentoController = new DocumentoController();

router.use(authMiddleware);

router.get("/verificar-vencimentos", documentoController.verificarVencimentos);
router.get("/", documentoController.findAll);
router.get("/:id", documentoController.findById);
router.get("/:id/download", documentoController.download);
router.post("/", uploadDocumento.single("arquivo"), validate(createDocumentoSchema), documentoController.create);
router.patch("/:id", validate(updateDocumentoSchema), documentoController.update);
router.delete("/:id", documentoController.delete);

export default router;
