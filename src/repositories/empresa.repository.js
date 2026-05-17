import Empresa from "../models/Empresa.js";

class EmpresaRepository {
  create = (empresa) => Empresa.create(empresa);

  getAll = (query) =>{
    for (let key in query) {
      if (typeof query[key] === 'string') {
          query[key] = { $regex: query[key], $options: 'i' };
      }
    }
  return Empresa.find(query).populate("usuario");
  }
  
  getById = (id) => Empresa.findById(id);

  update = (id, body) =>
    Empresa.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { returnNewDocument: true }
    );

  delete = (id) => Empresa.findByIdAndDelete(id);
}

export default EmpresaRepository;