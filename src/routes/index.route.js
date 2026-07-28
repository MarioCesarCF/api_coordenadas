import { Router } from "express";
const router = Router();

import usuarioRoute from "./usuario.route.js";
import empresaRoute from "./empresa.route.js";
import organizacaoRoute from "./organizacao.route.js";
import documentoRoute from "./documento.route.js";

router.use("/usuario", usuarioRoute);
router.use("/empresa", empresaRoute);
router.use("/organizacao", organizacaoRoute);
router.use("/documento", documentoRoute);

export default router;