import Organizacao from "../models/Organizacao.js";
import Empresa from "../models/Empresa.js";
import Documento from "../models/Documento.js";

const GB = 1024 * 1024 * 1024;

export async function carregarOrganizacao(req, res, next) {
  try {
    req.org = null;
    if (req.organizacaoId) {
      req.org = await Organizacao.findById(req.organizacaoId);
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireCalculos(req, res, next) {
  if (!req.org) return next();
  if (!req.org.config_limites?.calculos_habilitados) {
    return res.status(403).json({
      message: "Cálculos florestais estão disponíveis nos planos Profissional e Enterprise.",
    });
  }
  next();
}

export async function checkEmpresaLimit(req, res, next) {
  try {
    if (!req.org) return next();
    const limite = req.org.config_limites?.max_empresas ?? 5;
    if (limite === 99999) return next();

    const count = await Empresa.countDocuments({ organizacao: req.org._id });
    if (count >= limite) {
      return res.status(403).json({
        message: `Limite de empresas atingido para o seu plano (${limite}). Faça upgrade para cadastrar mais.`,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export async function checkStorage(req, res, next) {
  try {
    if (!req.org) return next();
    const limiteGb = req.org.config_limites?.storage_gb ?? 0;
    if (limiteGb <= 0) {
      return res.status(403).json({
        message: "Armazenamento de documentos não está incluído no seu plano atual.",
      });
    }

    const tamanhoArquivo = req.file?.size || 0;
    if (tamanhoArquivo === 0) return next();

    const [{ total } = { total: 0 }] = await Documento.aggregate([
      {
        $match: {
          organizacao: req.org._id,
          s3_key: { $exists: true, $ne: null },
          tamanho: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: null, total: { $sum: "$tamanho" } } },
    ]);

    if (total + tamanhoArquivo > limiteGb * GB) {
      return res.status(403).json({
        message: "Armazenamento do plano atingido. Exclua arquivos ou faça upgrade para continuar.",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export async function contarEmpresas(organizacaoId) {
  if (!organizacaoId) return 0;
  return Empresa.countDocuments({ organizacao: organizacaoId });
}
