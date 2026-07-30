import mongoose from "mongoose";

const DocumentoStatusSchema = new mongoose.Schema({
  tipo_notificacao: {
    type: String,
    enum: ["30_dias", "15_dias", "7_dias", "1_dia", "vencido"],
  },
  enviado_em: {
    type: Date,
    default: Date.now,
  },
});

const DocumentoSchema = new mongoose.Schema({
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Empresas",
    required: true,
  },
  organizacao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizacao",
    required: true,
  },
  nome: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    required: false,
  },
  s3_key: {
    type: String,
    required: false,
  },
  url: {
    type: String,
    required: false,
  },
  tamanho: {
    type: Number,
    required: false,
  },
  tipo_arquivo: {
    type: String,
    required: false,
  },
  data_vencimento: {
    type: Date,
    required: false,
  },
  observacoes: {
    type: String,
    required: false,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  notificacoes_enviadas: [DocumentoStatusSchema],
  criado_em: {
    type: Date,
    default: Date.now,
  },
  atualizado_em: {
    type: Date,
    default: Date.now,
  },
});

DocumentoSchema.pre("save", function () {
  this.atualizado_em = new Date();
});

DocumentoSchema.index({ empresa: 1 });
DocumentoSchema.index({ organizacao: 1 });
DocumentoSchema.index({ data_vencimento: 1 });
DocumentoSchema.index({ organizacao: 1, data_vencimento: 1 });

const Documento = mongoose.model("Documento", DocumentoSchema);

export default Documento;
