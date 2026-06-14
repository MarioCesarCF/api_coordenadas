import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UsuarioSchema = new mongoose.Schema({
  criado_em: {
    type: Date,
    default: Date.now(),
  },
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  numero_documento: {
    type: String,
    required: true,
  },
  tipo_perfil: {
    type: String,
    required: true,
  },
  telefone_contato: {
    type: String,
    required: false,
  }
});

UsuarioSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 10);
});

const Usuario = mongoose.model("Usuario", UsuarioSchema);

export default Usuario;