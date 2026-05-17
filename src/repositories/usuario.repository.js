import Usuario from "../models/Usuario.js"

class UsuarioRepository {
  create = (body) => Usuario.create(body);
  findAll = () => Usuario.find();
  findById = (id) => Usuario.findById(id);
  update = (id, body) =>
    Usuario.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { returnNewDocument: true }
    );
  delete = (id) => Usuario.findByIdAndDelete(id);
}

export default UsuarioRepository;