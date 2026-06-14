import EmpresaRepository from "../repositories/empresa.repository.js";

const empresaRepository = new EmpresaRepository();

class EmpresaController {
  create = async (req, res, next) => {
    try {
      const body = { ...req.body, usuario: req.userId };
      const company = await empresaRepository.create(body);

      return res.status(201).json(company);
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req, res, next) => {
    try {
      const { name, document, city } = req.query;
      const companies = await empresaRepository.showAllCompany(
        req.userId,
        name,
        document,
        city
      );

      return res.json(companies);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req, res, next) => {
    try {
      const company = await empresaRepository.findById(req.params.id);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      const ownerId =
        typeof company.usuario === "object"
          ? company.usuario?._id?.toString()
          : company.usuario?.toString();

      if (ownerId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado." });
      }

      return res.json(company);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const company = await empresaRepository.findById(req.params.id);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      const ownerId =
        typeof company.usuario === "object"
          ? company.usuario?._id?.toString()
          : company.usuario?.toString();

      if (ownerId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado." });
      }

      const updated = await empresaRepository.update(
        req.params.id,
        req.body
      );

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const company = await empresaRepository.findById(req.params.id);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      const ownerId =
        typeof company.usuario === "object"
          ? company.usuario?._id?.toString()
          : company.usuario?.toString();

      if (ownerId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado." });
      }

      const deleted = await empresaRepository.excludes(req.params.id);

      return res.json(deleted);
    } catch (err) {
      next(err);
    }
  };
}

export default EmpresaController;
