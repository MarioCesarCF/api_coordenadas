import { Router } from "express";
import UsuarioController from "../controllers/usuario.controller.js";

const route = Router();

const usuarioController = new UsuarioController();

route.get("/", usuarioController.findAllUsers);
route.get("/:id", usuarioController.findUserById);
route.post("/", usuarioController.createUser);
route.patch("/:id", usuarioController.updateUser);
route.delete("/:id", usuarioController.deleteUser);

export default route;