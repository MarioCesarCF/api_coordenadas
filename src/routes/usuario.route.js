import { Router } from "express";
import UsuarioController from "../controllers/usuario.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
} from "../validations/usuario.validation.js";

const route = Router();

const usuarioController = new UsuarioController();

route.post("/login", validate(loginSchema), usuarioController.loginUser);
route.post("/refresh", usuarioController.refreshToken);
route.post("/esqueci-senha", usuarioController.esqueciSenha);
route.post("/redefinir-senha", usuarioController.redefinirSenha);
route.use(authMiddleware);
route.get("/me", usuarioController.showMe);
route.post("/", validate(createUserSchema), usuarioController.createUser);
route.patch("/me", validate(updateUserSchema), usuarioController.updateUser);
route.delete("/me", usuarioController.deleteUser);
route.post("/logout", usuarioController.logout);

export default route;
