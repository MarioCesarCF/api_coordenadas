import DocumentoRepository from "../repositories/documento.repository.js";
import NotificacaoService from "../services/notificacao.service.js";
import { salvarArquivo, removerArquivo, obterUrlArquivo } from "../services/storage.service.js";
import AuditLog from "../models/AuditLog.js";

const documentoRepository = new DocumentoRepository();
const notificacaoService = new NotificacaoService();

class DocumentoController {
  create = async (req, res, next) => {
    try {
      const { empresa, nome, data_vencimento, observacoes } = req.body;
      let s3_key = null;
      let url = null;
      let tamanho = null;
      let tipo_arquivo = null;

      if (req.file) {
        const result = await salvarArquivo(req.file.buffer, req.file.originalname, req.file.mimetype);
        s3_key = result.key;
        url = result.url;
        tamanho = req.file.size;
        tipo_arquivo = req.file.mimetype;
      }

      const doc = await documentoRepository.create({
        empresa,
        organizacao: req.organizacaoId,
        nome,
        tipo_arquivo,
        s3_key,
        url,
        tamanho,
        data_vencimento: data_vencimento || null,
        observacoes: observacoes || null,
        usuario: req.userId,
      });

      await AuditLog.create({
        acao: "create",
        entidade: "Documento",
        entidade_id: doc._id,
        usuario: req.userId,
        dados: { nome, empresa, data_vencimento },
      });

      return res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req, res, next) => {
    try {
      const { empresa, nome, vencimento_ate, data_vencimento_gte } = req.query;
      const docs = await documentoRepository.findAll({
        organizacaoId: req.organizacaoId,
        empresa,
        nome,
        vencimento_ate,
        data_vencimento_gte,
      });

      return res.json(docs);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req, res, next) => {
    try {
      const doc = await documentoRepository.findById(req.params.id, req.organizacaoId);
      if (!doc) {
        return res.status(404).json({ message: "Documento não encontrado." });
      }
      return res.json(doc);
    } catch (err) {
      next(err);
    }
  };

  download = async (req, res, next) => {
    try {
      const doc = await documentoRepository.findById(req.params.id, req.organizacaoId);
      if (!doc) {
        return res.status(404).json({ message: "Documento não encontrado." });
      }

      if (!doc.s3_key) {
        return res.status(404).json({ message: "Documento sem arquivo associado." });
      }

      const fileUrl = await obterUrlArquivo(doc.s3_key);
      if (!fileUrl) {
        return res.status(404).json({ message: "Arquivo não encontrado no storage." });
      }

      return res.redirect(fileUrl);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const { nome, data_vencimento, observacoes } = req.body;
      const updateData = {};
      if (nome !== undefined) updateData.nome = nome;
      if (data_vencimento !== undefined) updateData.data_vencimento = data_vencimento;
      if (observacoes !== undefined) updateData.observacoes = observacoes;

      const doc = await documentoRepository.update(req.params.id, updateData, req.organizacaoId);
      if (!doc) {
        return res.status(404).json({ message: "Documento não encontrado." });
      }

      await AuditLog.create({
        acao: "update",
        entidade: "Documento",
        entidade_id: doc._id,
        usuario: req.userId,
        dados: updateData,
      });

      return res.json(doc);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const doc = await documentoRepository.delete(req.params.id, req.organizacaoId);
      if (!doc) {
        return res.status(404).json({ message: "Documento não encontrado." });
      }

      if (doc.s3_key) {
        await removerArquivo(doc.s3_key);
      }

      await AuditLog.create({
        acao: "delete",
        entidade: "Documento",
        entidade_id: doc._id,
        usuario: req.userId,
        dados: { nome: doc.nome },
      });

      return res.json({ message: "Documento removido com sucesso." });
    } catch (err) {
      next(err);
    }
  };

  verificarVencimentos = async (req, res, next) => {
    try {
      const resultado = await notificacaoService.verificarVencimentos(req.organizacaoId);
      return res.json(resultado);
    } catch (err) {
      next(err);
    }
  };
}

export default DocumentoController;
