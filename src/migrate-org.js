import "dotenv/config";
import mongoose from "mongoose";
import Organizacao from "./models/Organizacao.js";
import Usuario from "./models/Usuario.js";
import Empresa from "./models/Empresa.js";
import { conectarBanco } from "./config/dbConfig.js";

async function migrar() {
  try {
    await conectarBanco();
    console.log("Conectado ao banco.");

    const usuariosSemOrg = await Usuario.find({
      $or: [
        { organizacao: { $exists: false } },
        { organizacao: null },
      ],
    });

    console.log(`Usuários sem organização: ${usuariosSemOrg.length}`);

    for (const user of usuariosSemOrg) {
      const slugBase = user.email.split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      let slug = slugBase;
      let contador = 1;
      while (await Organizacao.findOne({ slug })) {
        slug = `${slugBase}-${contador}`;
        contador++;
      }

      const org = await Organizacao.create({
        slug,
        nome: `${user.nome} (Organização)`,
        status: "ativo",
        config_limites: {
          max_empresas: 99999,
          max_usuarios: 5,
          storage_gb: 1,
          calculos_habilitados: true,
          dominio_personalizado_habilitado: false,
        },
      });

      await Usuario.findByIdAndUpdate(user._id, {
        organizacao: org._id,
        papel: "admin",
      });

      const empresasCount = await Empresa.countDocuments({ usuario: user._id });
      if (empresasCount > 0) {
        await Empresa.updateMany(
          { usuario: user._id },
          { $set: { organizacao: org._id } }
        );
      }

      console.log(`  ✓ ${user.email} → org "${slug}" (${empresasCount} empresas vinculadas)`);
    }

    const usuariosComOrg = await Usuario.countDocuments({
      organizacao: { $exists: true, $ne: null },
    });
    const totalOrgs = await Organizacao.countDocuments();
    const empresasComOrg = await Empresa.countDocuments({
      organizacao: { $exists: true, $ne: null },
    });

    console.log("\nResumo da migração:");
    console.log(`  Organizações criadas: ${totalOrgs}`);
    console.log(`  Usuários com organização: ${usuariosComOrg}`);
    console.log(`  Empresas com organização: ${empresasComOrg}`);

    await mongoose.disconnect();
    console.log("\nMigração concluída com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na migração:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrar();
