import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UsuarioRepository from "../repositories/usuario.repository.js";

const usuarioRepository = new UsuarioRepository();

class UsuarioController {
  createUser = async (req, res, next) => {
    try {
      const user = await usuarioRepository.create(req.body);
      return res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const user = await usuarioRepository.findByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const accessToken = this._gerarAccessToken(user._id);
      const refreshToken = await usuarioRepository.criarRefreshToken(
        user._id,
        Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 7
      );

      const userData = user.toObject();
      delete userData.password;

      return res.json({ accessToken, refreshToken, user: userData });
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token é obrigatório." });
    }

    try {
      const tokenDoc = await usuarioRepository.buscarRefreshToken(refreshToken);

      if (!tokenDoc) {
        return res
          .status(401)
          .json({ message: "Refresh token inválido ou expirado." });
      }

      const accessToken = this._gerarAccessToken(tokenDoc.usuario);
      return res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    const { refreshToken } = req.body;

    try {
      if (refreshToken) {
        await usuarioRepository.revogarRefreshToken(refreshToken);
      } else {
        await usuarioRepository.revogarTodosTokens(req.userId);
      }

      return res.json({ message: "Logout realizado com sucesso." });
    } catch (err) {
      next(err);
    }
  };

  showMe = async (req, res, next) => {
    try {
      const user = await usuarioRepository.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      return res.json(user);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const user = await usuarioRepository.update(req.body, req.userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      return res.json(user);
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const user = await usuarioRepository.delete(req.userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      return res.json(user);
    } catch (err) {
      next(err);
    }
  };

  _gerarAccessToken(userId) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
    return jwt.sign({ id: userId }, secret, { expiresIn });
  }
}

export default UsuarioController;
