import EmpresaRepository from "../repositories/empresa.repository.js";
import AuditLog from "../models/AuditLog.js";
import { parseFile, autoDetectMapping, importEmpresas } from "../services/import.service.js";

const empresaRepository = new EmpresaRepository();

class EmpresaController {
  create = async (req, res, next) => {
    try {
      const body = {
        ...req.body,
        usuario: req.userId,
        organizacao: req.organizacaoId,
      };
      const company = await empresaRepository.create(body);

      await AuditLog.create({
        acao: "create",
        entidade: "Empresa",
        entidade_id: company._id,
        usuario: req.userId,
        dados: { nome: body.nome, numero_documento: body.numero_documento },
      });

      return res.status(201).json(company);
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req, res, next) => {
    try {
      const { name, document, city, numero_processo } = req.query;
      const companies = await empresaRepository.showAllCompany(
        name,
        document,
        city,
        numero_processo,
        req.organizacaoId
      );

      return res.json(companies);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req, res, next) => {
    try {
      const company = await empresaRepository.findById(req.params.id, req.organizacaoId);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      return res.json(company);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const company = await empresaRepository.findById(req.params.id, req.organizacaoId);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      const updated = await empresaRepository.update(
        req.params.id,
        req.body,
        req.organizacaoId
      );

      await AuditLog.create({
        acao: "update",
        entidade: "Empresa",
        entidade_id: req.params.id,
        usuario: req.userId,
        dados: { antes: company.toObject(), depois: req.body },
      });

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  importFile = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      const { headers, rows } = await parseFile(req.file.buffer, req.file.originalname);

      let mapping = autoDetectMapping(headers);

      if (req.body.mapping) {
        let userMapping;
        try {
          userMapping = typeof req.body.mapping === "string"
            ? JSON.parse(req.body.mapping)
            : req.body.mapping;
        } catch {
          return res.status(400).json({ message: "Mapping inválido. Envie um JSON válido." });
        }
        mapping = { ...mapping, ...userMapping };
      }

      const result = await importEmpresas(rows, mapping, req.userId, req.organizacaoId);

      if (result.imported > 0) {
        await AuditLog.create({
          acao: "import",
          entidade: "Empresa",
          usuario: req.userId,
          dados: {
            total: result.total,
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors.length,
          },
        });
      }

      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteAll = async (req, res, next) => {
    try {
      const result = await empresaRepository.deleteAll(req.userId, req.organizacaoId);
      return res.json({ message: `${result.deletedCount} empresa(s) removida(s).` });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const company = await empresaRepository.findById(req.params.id, req.organizacaoId);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      const deleted = await empresaRepository.excludes(req.params.id, req.organizacaoId);

      await AuditLog.create({
        acao: "delete",
        entidade: "Empresa",
        entidade_id: req.params.id,
        usuario: req.userId,
        dados: { nome: company.nome, numero_documento: company.numero_documento },
      });

      return res.json(deleted);
    } catch (err) {
      next(err);
    }
  };
}

export default EmpresaController;