import EmpresaRepository from "../repositories/empresa.repository.js";
import UsuarioRepository from "../repositories/usuario.repository.js";

const empresaRepository = new EmpresaRepository();
const usuarioRepository = new UsuarioRepository();

class EmpresaController {
  create = async (req, res) => {
    const body = req.body;
    body.usuario = await usuarioRepository.findById(body.userId);

    try {
      const company = await empresaRepository.create(body);

      return res.status(201).send(company);
    } catch (err) {
      if (err.status && err.message) {
        return res.status(err.status).send({ message: err.message });
      } else {
        return res.status(500).send({ message: 'Erro interno do servidor.' });
      }
    }
  };

  findAll = async (req, res) => {
    try {
      const { name, document, city } = req.query;
      const companies = await empresaRepository.showAllCompany(name, document, city);

      return res.status(200).send(companies);
    } catch (err) {
      if (err.status && err.message) {
        return res.status(err.status).send({ message: err.message });
      } else {
        return res.status(500).send({ message: 'Erro interno do servidor.' });
      }
    }
  };

  findById = async (req, res) => {
    const { id: companyId } = req.params;
    
    try {
      const company = await empresaRepository.findById(companyId);

      return res.status(200).send(company);
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  };
  
  update = async (req, res) => {
    const body = req.body;
    const { id: companyId } = req.params;

    try {
      const response = await empresaRepository.update(body, companyId);

      return res.send(response);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };

  delete = async (req, res) => {
    const companyId = req.params.id;

    try {
      const company = await empresaRepository.excludes(companyId);

      return res.send(company);
    } catch (err) {
      return res.status(500).send({ message: err.message });
    }
  };
}

export default EmpresaController;