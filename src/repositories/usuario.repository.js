import Usuario from "../models/Usuario.js";
import RefreshToken from "../models/RefreshToken.js";

class UsuarioRepository {
  create = (body) => Usuario.create(body);
  findAll = () => Usuario.find();
  findById = (id) => Usuario.findById(id);
  findByEmail = (email) => Usuario.findOne({ email }).select("+password");
  update = (body, id) =>
    Usuario.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { returnDocument: "after" }
    );
  delete = (id) => Usuario.findByIdAndDelete(id);

  criarRefreshToken = async (usuarioId, diasValidade = 7) => {
    const rawToken = RefreshToken.gerarToken();
    const hashed = RefreshToken.hashToken(rawToken);

    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + diasValidade);

    await RefreshToken.create({
      token: hashed,
      usuario: usuarioId,
      expira_em: expiraEm,
    });

    return rawToken;
  };

  buscarRefreshToken = async (rawToken) => {
    const hashed = RefreshToken.hashToken(rawToken);
    return RefreshToken.findOne({
      token: hashed,
      revogado_em: null,
      expira_em: { $gt: new Date() },
    });
  };

  revogarRefreshToken = async (rawToken) => {
    const hashed = RefreshToken.hashToken(rawToken);
    return RefreshToken.findOneAndUpdate(
      { token: hashed },
      { revogado_em: new Date() },
      { returnDocument: "after" }
    );
  };

  revogarTodosTokens = async (usuarioId) => {
    return RefreshToken.updateMany(
      { usuario: usuarioId, revogado_em: null },
      { revogado_em: new Date() }
    );
  };
}

export default UsuarioRepository;
