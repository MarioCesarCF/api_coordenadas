import mongoose from "mongoose";

const OrganizacaoSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  nome: {
    type: String,
    required: true,
  },
  cnpj: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  plano: {
    type: String,
    enum: ["free", "essential", "profissional", "enterprise"],
    default: "free",
  },
  status: {
    type: String,
    enum: ["trial", "ativo", "cancelado", "expirado"],
    default: "trial",
  },
  data_expiracao: {
    type: Date,
    required: false,
  },
  dominio_personalizado: {
    type: String,
    required: false,
  },
  dados_asaas: {
    customer_id: String,
    subscription_id: String,
    ultima_cobranca: Date,
  },
  config_limites: {
    max_empresas: { type: Number, default: 5 },
    max_usuarios: { type: Number, default: 1 },
    storage_gb: { type: Number, default: 0 },
    calculos_habilitados: { type: Boolean, default: false },
    dominio_personalizado_habilitado: { type: Boolean, default: false },
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

OrganizacaoSchema.pre("save", function () {
  this.atualizado_em = new Date();
});

const Organizacao = mongoose.model("Organizacao", OrganizacaoSchema);

export default Organizacao;
