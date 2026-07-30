import mongoose from "mongoose";

const ProjetoCalculoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  metodo: {
    type: String,
    enum: ["parcela_fixa", "censo"],
    default: "parcela_fixa",
  },
  erro_admissivel: {
    type: Number,
    default: 10,
  },
  area_parcela: {
    type: Number,
    required: false,
  },
  area_total: {
    type: Number,
    required: false,
  },
  bioma: {
    type: String,
    default: "Mata Atlântica",
  },
  estado: {
    type: String,
    default: "ES",
  },
  formula_coeficientes: {
    valor1: { type: Number, default: -9.821818496 },
    valor2: { type: Number, default: 2.1551551721 },
    valor3: { type: Number, default: 0.790768692 },
  },
  status: {
    type: String,
    enum: ["rascunho", "importado", "processado"],
    default: "rascunho",
  },
  organizacao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizacao",
    required: false,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: false,
  },
  criado_em: {
    type: Date,
    default: Date.now,
  },
  atualizado_em: {
    type: Date,
    default: Date.now,
  },
});

ProjetoCalculoSchema.pre("save", function () {
  this.atualizado_em = new Date();
});

const ProjetoCalculo = mongoose.model("ProjetoCalculo", ProjetoCalculoSchema);

export default ProjetoCalculo;