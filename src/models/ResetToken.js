import mongoose from "mongoose";

const ResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true },
  expira_em: { type: Date, required: true },
  utilizado_em: { type: Date, default: null },
  criado_em: { type: Date, default: Date.now },
});

ResetTokenSchema.index({ token: 1 });
ResetTokenSchema.index({ email: 1, criado_em: -1 });
ResetTokenSchema.index({ expira_em: 1 }, { expireAfterSeconds: 0 });

const ResetToken = mongoose.model("ResetToken", ResetTokenSchema);
export default ResetToken;
