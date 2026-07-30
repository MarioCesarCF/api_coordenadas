import ProjetoCalculo from "../models/ProjetoCalculo.js";
import Arvore from "../models/Arvore.js";
import AuditLog from "../models/AuditLog.js";
import { parsePlanilhaCampo } from "../services/calculo/import.service.js";
import {
  processarArvore,
  processarParcelas,
  classificarClasseDiametrica,
  calcularFitossociologia,
  calcularDistribuicaoDiametrica,
  calcularSuficiencia,
} from "../services/calculo/engine.service.js";

class CalculoController {
  criarProjeto = async (req, res, next) => {
    try {
      const body = {
        ...req.body,
        usuario: req.userId,
        organizacao: req.organizacaoId,
      };

      const projeto = await ProjetoCalculo.create(body);

      await AuditLog.create({
        acao: "create",
        entidade: "ProjetoCalculo",
        entidade_id: projeto._id,
        usuario: req.userId,
        dados: { nome: projeto.nome, metodo: projeto.metodo },
      });

      return res.status(201).json(projeto);
    } catch (err) {
      next(err);
    }
  };

  listarProjetos = async (req, res, next) => {
    try {
      const filter = {};
      if (req.organizacaoId) filter.organizacao = req.organizacaoId;
      const projetos = await ProjetoCalculo.find(filter)
        .sort({ criado_em: -1 });
      return res.json(projetos);
    } catch (err) {
      next(err);
    }
  };

  buscarProjeto = async (req, res, next) => {
    try {
      const filter = { _id: req.params.id };
      if (req.organizacaoId) filter.organizacao = req.organizacaoId;

      const projeto = await ProjetoCalculo.findOne(filter);
      if (!projeto) {
        return res.status(404).json({ message: "Projeto não encontrado." });
      }

      return res.json(projeto);
    } catch (err) {
      next(err);
    }
  };

  deletarProjeto = async (req, res, next) => {
    try {
      const filter = { _id: req.params.id };
      if (req.organizacaoId) filter.organizacao = req.organizacaoId;

      const projeto = await ProjetoCalculo.findOneAndDelete(filter);
      if (!projeto) {
        return res.status(404).json({ message: "Projeto não encontrado." });
      }

      await Arvore.deleteMany({ projeto: req.params.id });

      return res.json({ message: "Projeto removido com sucesso." });
    } catch (err) {
      next(err);
    }
  };

  importarDados = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      const filter = { _id: req.params.id };
      if (req.organizacaoId) filter.organizacao = req.organizacaoId;

      const projeto = await ProjetoCalculo.findOne(filter);
      if (!projeto) {
        return res.status(404).json({ message: "Projeto não encontrado." });
      }

      const resultado = parsePlanilhaCampo(req.file.buffer);

      await Arvore.deleteMany({ projeto: req.params.id });

      const docs = resultado.arvores.map((a) => ({
        ...a,
        projeto: req.params.id,
      }));

      await Arvore.insertMany(docs);

      projeto.status = "importado";
      if (projeto.metodo === "parcela_fixa" && !projeto.area_parcela) {
        projeto.area_parcela = 400;
      }
      if (!projeto.area_total) {
        projeto.area_total = 5.1122;
      }
      await projeto.save();

      await AuditLog.create({
        acao: "import",
        entidade: "ProjetoCalculo",
        entidade_id: req.params.id,
        usuario: req.userId,
        dados: { total: resultado.totalLinhas },
      });

      return res.json({
        message: `${resultado.totalLinhas} árvores importadas com sucesso.`,
        total: resultado.totalLinhas,
        sheetName: resultado.sheetName,
      });
    } catch (err) {
      next(err);
    }
  };

  processar = async (req, res, next) => {
    try {
      const filter = { _id: req.params.id };
      if (req.organizacaoId) filter.organizacao = req.organizacaoId;

      const projeto = await ProjetoCalculo.findOne(filter);
      if (!projeto) {
        return res.status(404).json({ message: "Projeto não encontrado." });
      }

      const arvores = await Arvore.find({ projeto: req.params.id }).lean();

      if (arvores.length === 0) {
        return res.status(400).json({ message: "Nenhuma árvore encontrada. Importe os dados primeiro." });
      }

      const coefs = projeto.formula_coeficientes || {};

      const atualizadas = arvores.map((a) => {
        const { dap, ab, volume } = processarArvore(a.cap, a.altura, coefs);
        return {
          ...a,
          dap: Number(dap.toFixed(4)),
          ab: Number(ab.toFixed(6)),
          volume: Number(volume.toFixed(6)),
          classe_diametrica: classificarClasseDiametrica(dap),
        };
      });

      for (const a of atualizadas) {
        await Arvore.updateOne(
          { _id: a._id },
          {
            $set: {
              dap: a.dap,
              ab: a.ab,
              volume: a.volume,
              classe_diametrica: a.classe_diametrica,
            },
          }
        );
      }

      const areaParcela = projeto.area_parcela || 400;
      const areaTotal = projeto.area_total || 0;
      const parcelasResult = processarParcelas(atualizadas, areaParcela, areaTotal, coefs);

      const areaAmostradaHa = (parcelasResult.numeroParcelas * areaParcela) / 10000;

      let suficiencia = null;
      if (parcelasResult.estatisticas) {
        suficiencia = calcularSuficiencia(
          parcelasResult.estatisticas.media,
          parcelasResult.estatisticas.variancia,
          parcelasResult.estatisticas.n,
          projeto.erro_admissivel || 10
        );
      }

      const fitossociologia = calcularFitossociologia(
        atualizadas,
        areaTotal,
        areaAmostradaHa
      );

      const distribuicao = calcularDistribuicaoDiametrica(atualizadas);

      const resultado = {
        dendrometria: {
          totalArvores: atualizadas.length,
          totalFustes: atualizadas.reduce((s, a) => s + a.fuste, 0),
          dapMedio: Number(
            (atualizadas.reduce((s, a) => s + a.dap, 0) / atualizadas.length).toFixed(4)
          ),
          alturaMedia: Number(
            (atualizadas.reduce((s, a) => s + a.altura, 0) / atualizadas.length).toFixed(4)
          ),
          abMedia: Number(
            (atualizadas.reduce((s, a) => s + a.ab, 0) / atualizadas.length).toFixed(6)
          ),
          volumeTotal: parcelasResult.totalGeral,
        },
        parcelas: parcelasResult,
        suficiencia,
        fitossociologia,
        distribuicaoDiametrica: distribuicao,
      };

      projeto.status = "processado";
      await projeto.save();

      await AuditLog.create({
        acao: "update",
        entidade: "ProjetoCalculo",
        entidade_id: req.params.id,
        usuario: req.userId,
        dados: { status: "processado" },
      });

      return res.json(resultado);
    } catch (err) {
      next(err);
    }
  };

  obterResultados = async (req, res, next) => {
    try {
      const filter = { _id: req.params.id };
      if (req.organizacaoId) filter.organizacao = req.organizacaoId;

      const projeto = await ProjetoCalculo.findOne(filter);
      if (!projeto) {
        return res.status(404).json({ message: "Projeto não encontrado." });
      }

      const arvores = await Arvore.find({ projeto: req.params.id }).lean();

      if (arvores.length === 0) {
        return res.json({ projeto, message: "Nenhuma árvore cadastrada." });
      }

      const coefs = projeto.formula_coeficientes || {};
      const areaParcela = projeto.area_parcela || 400;
      const areaTotal = projeto.area_total || 0;
      const parcelasResult = processarParcelas(arvores, areaParcela, areaTotal, coefs);
      const areaAmostradaHa = (parcelasResult.numeroParcelas * areaParcela) / 10000;

      let suficiencia = null;
      if (parcelasResult.estatisticas) {
        suficiencia = calcularSuficiencia(
          parcelasResult.estatisticas.media,
          parcelasResult.estatisticas.variancia,
          parcelasResult.estatisticas.n,
          projeto.erro_admissivel || 10
        );
      }

      const fitossociologia = calcularFitossociologia(arvores, areaTotal, areaAmostradaHa);
      const distribuicao = calcularDistribuicaoDiametrica(arvores);

      return res.json({
        projeto,
        dendrometria: {
          totalArvores: arvores.length,
          totalFustes: arvores.reduce((s, a) => s + a.fuste, 0),
          dapMedio: Number((arvores.reduce((s, a) => s + a.dap, 0) / arvores.length).toFixed(4)),
          alturaMedia: Number((arvores.reduce((s, a) => s + a.altura, 0) / arvores.length).toFixed(4)),
          volumeTotal: parcelasResult.totalGeral,
        },
        parcelas: parcelasResult,
        suficiencia,
        fitossociologia,
        distribuicaoDiametrica: distribuicao,
        arvores,
      });
    } catch (err) {
      next(err);
    }
  };
}

export default CalculoController;