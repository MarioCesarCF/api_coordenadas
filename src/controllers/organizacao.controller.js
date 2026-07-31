import jwt from "jsonwebtoken";
import Organizacao from "../models/Organizacao.js";
import Usuario from "../models/Usuario.js";
import Empresa from "../models/Empresa.js";
import { limitesPorPlano } from "../config/planos.js";

class OrganizacaoController {

  criar = async (req, res, next) => {
    try {
      const { nome, slug } = req.body;

      const existente = await Organizacao.findOne({ slug });
      if (existente) {
        return res.status(409).json({ message: "slug já está em uso." });
      }

      const org = await Organizacao.create({
        nome,
        slug,
        status: "trial",
        data_expiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        config_limites: limitesPorPlano("free"),
      });

      await Usuario.findByIdAndUpdate(req.userId, {
        organizacao: org._id,
        papel: "admin",
      });

      await Empresa.updateMany(
        { usuario: req.userId, $or: [{ organizacao: { $exists: false } }, { organizacao: null }] },
        { $set: { organizacao: org._id } }
      );

      const novoAccessToken = jwt.sign(
        { id: req.userId, organizacao: org._id, papel: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
      );

      return res.status(201).json({ organizacao: org, accessToken: novoAccessToken });
    } catch (err) {
      next(err);
    }
  };

  showMine = async (req, res, next) => {
    try {
      const user = await Usuario.findById(req.userId);
      if (!user || !user.organizacao) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      const org = await Organizacao.findById(user.organizacao);
      if (!org) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      return res.json(org);
    } catch (err) {
      next(err);
    }
  };

  updateMine = async (req, res, next) => {
    try {
      const user = await Usuario.findById(req.userId);
      if (!user || !user.organizacao) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      if (user.papel !== "admin") {
        return res.status(403).json({ message: "Apenas administradores podem alterar a organização." });
      }

      const allowed = ["nome", "dominio_personalizado", "plano"];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      if (req.body.plano) {
        updates.config_limites = limitesPorPlano(req.body.plano);
      }

      const org = await Organizacao.findByIdAndUpdate(
        user.organizacao,
        { $set: updates },
        { returnDocument: "after" }
      );

      return res.json(org);
    } catch (err) {
      next(err);
    }
  };

  listarMembros = async (req, res, next) => {
    try {
      const user = await Usuario.findById(req.userId);
      if (!user || !user.organizacao) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      const membros = await Usuario.find(
        { organizacao: user.organizacao },
        { password: 0 }
      ).sort({ criado_em: -1 });

      return res.json(membros);
    } catch (err) {
      next(err);
    }
  };

  convidarMembro = async (req, res, next) => {
    try {
      const user = await Usuario.findById(req.userId);
      if (!user || !user.organizacao) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      if (user.papel !== "admin") {
        return res.status(403).json({ message: "Apenas administradores podem convistar membros." });
      }

      const org = await Organizacao.findById(user.organizacao);
      const membrosCount = await Usuario.countDocuments({ organizacao: user.organizacao });
      if (membrosCount >= org.config_limites.max_usuarios) {
        return res.status(403).json({ message: "Limite de usuários atingido para o seu plano." });
      }

      const { email, nome, password, numero_documento } = req.body;

      const existente = await Usuario.findOne({ email });
      if (existente) {
        return res.status(409).json({ message: "Email já está em uso." });
      }

      const membro = await Usuario.create({
        nome,
        email,
        password,
        numero_documento,
        tipo_perfil: "user",
        organizacao: user.organizacao,
        papel: "membro",
      });

      const membroData = membro.toObject();
      delete membroData.password;

      return res.status(201).json(membroData);
    } catch (err) {
      next(err);
    }
  };

  removerMembro = async (req, res, next) => {
    try {
      const user = await Usuario.findById(req.userId);
      if (!user || !user.organizacao) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      if (user.papel !== "admin") {
        return res.status(403).json({ message: "Apenas administradores podem remover membros." });
      }

      const membroId = req.params.id;
      if (membroId === req.userId) {
        return res.status(400).json({ message: "Você não pode remover a si mesmo." });
      }

      const membro = await Usuario.findOneAndDelete({
        _id: membroId,
        organizacao: user.organizacao,
      });

      if (!membro) {
        return res.status(404).json({ message: "Membro não encontrado." });
      }

      return res.json({ message: "Membro removido com sucesso." });
    } catch (err) {
      next(err);
    }
  };
}

export default OrganizacaoController;
