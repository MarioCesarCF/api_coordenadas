import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  acao: {
    type: String,
    enum: ["create", "update", "delete", "import"],
    required: true,
  },
  entidade: {
    type: String,
    required: true,
  },
  entidade_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  dados: {
    type: mongoose.Schema.Types.Mixed,
  },
  criado_em: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
