import mongoose from "mongoose";

const ArvoreSchema = new mongoose.Schema({
  projeto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProjetoCalculo",
    required: true,
  },
  parcela: {
    type: String,
    required: true,
  },
  nid: {
    type: Number,
    required: true,
  },
  fuste: {
    type: Number,
    default: 1,
  },
  nome_comum: {
    type: String,
    default: "",
  },
  nome_cientifico: {
    type: String,
    default: "",
  },
  familia: {
    type: String,
    default: "",
  },
  cap: {
    type: Number,
    required: true,
  },
  altura: {
    type: Number,
    required: true,
  },
  dap: {
    type: Number,
    default: 0,
  },
  ab: {
    type: Number,
    default: 0,
  },
  volume: {
    type: Number,
    default: 0,
  },
  classe_diametrica: {
    type: String,
    default: "",
  },
  subproduto: {
    type: String,
    default: "",
  },
});

ArvoreSchema.index({ projeto: 1, parcela: 1, nid: 1, fuste: 1 }, { unique: true });

const Arvore = mongoose.model("Arvore", ArvoreSchema);

export default Arvore;