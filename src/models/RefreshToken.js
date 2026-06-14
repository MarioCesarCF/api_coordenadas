import mongoose from "mongoose";
import crypto from "crypto";

const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  expira_em: {
    type: Date,
    required: true,
  },
  revogado_em: {
    type: Date,
    default: null,
  },
});

RefreshTokenSchema.statics.hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

RefreshTokenSchema.statics.gerarToken = function () {
  return crypto.randomBytes(40).toString("hex");
};

RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ usuario: 1 });
RefreshTokenSchema.index({ expira_em: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
