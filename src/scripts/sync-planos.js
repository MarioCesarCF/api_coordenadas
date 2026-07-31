import "dotenv/config";
import mongoose from "mongoose";
import Organizacao from "../models/Organizacao.js";
import conectarBanco from "../config/dbConfig.js";
import { limitesPorPlano, PLANO_LABELS } from "../config/planos.js";

async function sincronizar() {
  try {
    await conectarBanco();
    console.log("Conectado ao banco.");

    const orgs = await Organizacao.find({});
    let atualizadas = 0;

    for (const org of orgs) {
      const limites = limitesPorPlano(org.plano);
      const atuais = org.config_limites || {};

      const precisaAtualizar = ["max_empresas", "max_usuarios", "storage_gb", "calculos_habilitados", "dominio_personalizado_habilitado"]
        .some((key) => atuais[key] !== limites[key]);

      if (precisaAtualizar) {
        org.config_limites = limites;
        await org.save();
        atualizadas++;
        console.log(`  ✓ ${org.slug} (${PLANO_LABELS[org.plano] || org.plano}) → limites sincronizados`);
      }
    }

    console.log(`\nOrganizações verificadas: ${orgs.length}`);
    console.log(`Organizações atualizadas: ${atualizadas}`);

    await mongoose.disconnect();
    console.log("Sincronização concluída com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na sincronização:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

sincronizar();
