import mongoose from 'mongoose';
import Usuario from './Usuario.js';

const EmpresaDataSchema = new mongoose.Schema({
  criado_em: {
    type: Date,
    default: Date.now(),
  },
  atualizado_em: {
    type: Date,
    default: Date.now(),
  },
  nome: {
    type: String,
    required: true,
  },
  numero_documento: {
    type: String,
    required: true,
  },
  cidade: {
    type: String,
    required: true,
  },
  local_intervencao: {
    type: String,
    required: false,
  },
  modalidade: {
    type: String,
    required: false,
  },
  numero_processo: {
    type: String,
    required: false,
  },
  ano: {
    type: Number,
    required: false,
  },
  mes: {
    type: String,
    required: false,
  },
  decisao: {
    type: String,
    required: false,
  },
  bioma: {
    type: String,
    required: false,
  },
  area_autorizada: {
    type: Number,
    required: false,
  },
  coordenada_x: {
    type: Number,
    required: false,
  },
  longitude: {
    type: Number,
    required: false,
  },
  coordenada_y: {
    type: Number,
    required: false,
  },  
  latitude: {
    type: Number,
    required: false,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: false,
  },
});

const Empresa = mongoose.model("Empresas", EmpresaDataSchema);

export default Empresa;