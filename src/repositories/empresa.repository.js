import Empresa from "../models/Empresa.js";

class EmpresaRepository {
  create = (empresa) => Empresa.create(empresa);

  showAllCompany = (userId, name, document, city) => {
    const query = { usuario: userId };
    if (name) query.nome = { $regex: name, $options: "i" };
    if (document) query.numero_documento = { $regex: document, $options: "i" };
    if (city) query.cidade = { $regex: city, $options: "i" };
    return Empresa.find(query).populate("usuario");
  };

  findById = (id) => Empresa.findById(id);

  update = (id, body) =>
    Empresa.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { returnDocument: "after" }
    );

  excludes = (id) => Empresa.findByIdAndDelete(id);
}

export default EmpresaRepository;