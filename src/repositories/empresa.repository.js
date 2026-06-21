import Empresa from "../models/Empresa.js";

class EmpresaRepository {
  create = (empresa) => Empresa.create(empresa);

  showAllCompany = (name, document, city, process) => {
    const query = {};
    if (name) query.nome = { $regex: name, $options: "i" };
    if (document) query.numero_documento = { $regex: document, $options: "i" };
    if (city) query.cidade = { $regex: city, $options: "i" };
    if (process) query.numero_processo = { $regex: process, $options: "i" };
    return Empresa.find(query).populate("usuario").sort({ criado_em: -1 });
  };

  findById = (id) => Empresa.findById(id);

  update = (id, body) =>
    Empresa.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { returnDocument: "after" }
    );

  excludes = (id) => Empresa.findByIdAndDelete(id);

  deleteAll = (userId) => Empresa.deleteMany({ usuario: userId });
}

export default EmpresaRepository;