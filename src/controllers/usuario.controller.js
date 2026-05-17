import UsuarioRepository from "../repositories/usuario.repository.js";

const usuarioRepository = new UsuarioRepository();

class UsuarioController {
  createUser = async (req, res) => {
    const body = req.body;

    try {
      const user = await usuarioRepository.create(body);

      return res.status(201).send(user);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };

  findAllUsers = async (req, res) => {
    try {
      const users = await usuarioRepository.findAll();

      return res.send(users);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };

  findUserById = async (req, res) => {
    const { id: userId } = req.params;
    const userIdLogged = req.userId;

    try {
      const user = await usuarioRepository.findById(userId, userIdLogged);

      return res.send(user);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };

  updateUser = async (req, res) => {
    const body = req.body;
    const { id: userId } = req.params;

    try {
      const response = await usuarioRepository.update(body, userId);
      
      return res.send(response);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };

  deleteUser = async (req, res) => {
    const { id: userId } = req.params;
    try {
      const user = await usuarioRepository.delete(userId);

      return res.send(user);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };
}

export default UsuarioController;