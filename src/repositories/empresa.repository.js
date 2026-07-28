import Empresa from "../models/Empresa.js";

class EmpresaRepository {
  create = (empresa) => Empresa.create(empresa);

  showAllCompany = (name, document, city, process, organizacaoId = null) => {
    const query = {};
    if (organizacaoId) query.organizacao = organizacaoId;
    if (name) query.nome = { $regex: name, $options: "i" };
    if (document) query.numero_documento = { $regex: document, $options: "i" };
    if (city) query.cidade = { $regex: city, $options: "i" };
    if (process) query.numero_processo = { $regex: process, $options: "i" };
    return Empresa.find(query).populate("usuario organizacao").sort({ criado_em: -1 });
  };

  findById = (id, organizacaoId = null) => {
    const query = { _id: id };
    if (organizacaoId) query.organizacao = organizacaoId;
    return Empresa.findOne(query);
  };

  update = (id, body, organizacaoId = null) => {
    const query = { _id: id };
    if (organizacaoId) query.organizacao = organizacaoId;
    return Empresa.findOneAndUpdate(
      query,
      { $set: body },
      { returnDocument: "after" }
    );
  };

  excludes = (id, organizacaoId = null) => {
    const query = { _id: id };
    if (organizacaoId) query.organizacao = organizacaoId;
    return Empresa.findOneAndDelete(query);
  };

  deleteAll = (userId, organizacaoId = null) => {
    const query = {};
    if (organizacaoId) query.organizacao = organizacaoId;
    else query.usuario = userId;
    return Empresa.deleteMany(query);
  };

  findByDocument = (numero_documento, organizacaoId = null) => {
    const query = { numero_documento };
    if (organizacaoId) query.organizacao = organizacaoId;
    return Empresa.find(query).lean();
  };
}

export default EmpresaRepository;