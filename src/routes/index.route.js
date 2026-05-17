import { Router } from "express";
const router = Router();

import usuarioRoute from "./usuario.route.js";
import empresaRoute from "./empresa.route.js";

router.use("/usuario", usuarioRoute);
router.use("/empresa", empresaRoute);

export default router;