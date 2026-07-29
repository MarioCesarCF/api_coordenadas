import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import UsuarioRepository from "../repositories/usuario.repository.js";
import ResetToken from "../models/ResetToken.js";
import { enviarEmail } from "../services/email.service.js";
import { templateRedefinirSenha } from "../views/emails/redefinir-senha.js";

const usuarioRepository = new UsuarioRepository();

class UsuarioController {
  createUser = async (req, res, next) => {
    try {
      const userData = { ...req.body };
      if (req.organizacaoId) {
        userData.organizacao = req.organizacaoId;
        userData.papel = "membro";
      }
      const user = await usuarioRepository.create(userData);
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

      const accessToken = this._gerarAccessToken(user._id, user.organizacao, user.papel);
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

      const user = await usuarioRepository.findById(tokenDoc.usuario);
      const accessToken = this._gerarAccessToken(
        tokenDoc.usuario,
        user?.organizacao || null,
        user?.papel || "membro"
      );
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

  esqueciSenha = async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório." });
      }

      const user = await usuarioRepository.findByEmail(email);
      if (!user) {
        return res.status(200).json({ message: "Se o email existir, enviaremos um link de redefinição." });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      await ResetToken.create({
        email: user.email,
        token: hashedToken,
        expira_em: new Date(Date.now() + 15 * 60 * 1000),
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const link = `${frontendUrl}/redefinir-senha/${rawToken}`;

      await enviarEmail({
        para: user.email,
        assunto: "Sylven — Redefina sua senha",
        html: templateRedefinirSenha(user.nome, link),
      });

      return res.json({ message: "Se o email existir, enviaremos um link de redefinição." });
    } catch (err) {
      next(err);
    }
  };

  redefinirSenha = async (req, res, next) => {
    try {
      const { token, novaSenha } = req.body;
      if (!token || !novaSenha) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios." });
      }

      if (novaSenha.length < 3) {
        return res.status(400).json({ message: "Senha deve ter no mínimo 3 caracteres." });
      }

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      const resetToken = await ResetToken.findOne({
        token: hashedToken,
        utilizado_em: null,
        expira_em: { $gt: new Date() },
      });

      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido ou expirado." });
      }

      const user = await usuarioRepository.findByEmail(resetToken.email);
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado." });
      }

      user.password = novaSenha;
      await user.save();

      resetToken.utilizado_em = new Date();
      await resetToken.save();

      return res.json({ message: "Senha redefinida com sucesso." });
    } catch (err) {
      next(err);
    }
  };

  _gerarAccessToken(userId, organizacaoId = null, papel = "membro") {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
    return jwt.sign({ id: userId, organizacao: organizacaoId, papel }, secret, { expiresIn });
  }
}

export default UsuarioController;
