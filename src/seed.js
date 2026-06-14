import "dotenv/config";
import mongoose from "mongoose";
import Usuario from "./models/Usuario.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@apicoordenadas.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";

async function seed() {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    console.error("DATABASE_URL não definida no .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Conectado ao MongoDB.");

  const existing = await Usuario.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    console.log(`Admin já existe: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await Usuario.create({
    nome: "Administrador",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    numero_documento: "00000000000",
    tipo_perfil: "admin",
  });

  console.log(`Admin criado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
