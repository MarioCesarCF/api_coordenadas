import XLSX from "xlsx";
import { processarArvore, classificarClasseDiametrica } from "./engine.service.js";

const COLUNAS_ESPERADAS = {
  parcela: ["parcela", "parc", "plot", "p"],
  nid: ["nid", "n", "numero", "id", "tree", "arvore", "árvore"],
  fuste: ["fuste", "stem", "f"],
  cap: ["cap", "circunferencia", "circunferência", "cbh", "circ"],
  altura: ["altura", "ht", "alt", "height", "h"],
  nome_comum: ["nome comum", "nome_comum", "nomecomum", "common name", "especie", "espécie"],
  nome_cientifico: ["nome científico", "nome_cientifico", "nomecientifico", "scientific name", "especie científica"],
  familia: ["família", "familia", "family", "fam"],
};

function normalizarChave(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function detectarColunas(headers) {
  const mapping = {};
  const normHeaders = headers.map((h) => normalizarChave(String(h)));

  for (const [campo, sinonimos] of Object.entries(COLUNAS_ESPERADAS)) {
    for (const sinonimo of sinonimos) {
      const idx = normHeaders.indexOf(normalizarChave(sinonimo));
      if (idx !== -1) {
        mapping[campo] = idx;
        break;
      }
    }
  }

  return mapping;
}

function parseNumero(valor) {
  if (valor === undefined || valor === null || valor === "") return NaN;
  if (typeof valor === "number") return valor;
  const str = String(valor).replace(",", ".").trim();
  const n = Number(str);
  return isNaN(n) ? NaN : n;
}

function isLinhaResumo(row) {
  if (!row || row.length === 0) return true;
  const vals = row.filter((v) => v !== undefined && v !== null && v !== "");
  return vals.length <= 2;
}

function tentarParseSheet(ws) {
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  const headerRow = rawData.findIndex((row) => {
    const joined = row.map((c) => String(c).toLowerCase()).join(" ");
    return joined.includes("cap") || joined.includes("dap") || joined.includes("parcela");
  });

  if (headerRow === -1) return null;

  const headers = rawData[headerRow];
  const mapping = detectarColunas(headers);

  if (mapping.parcela === undefined || mapping.cap === undefined || mapping.altura === undefined) return null;

  const arvores = [];

  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (isLinhaResumo(row)) continue;

    const parcela = String(row[mapping.parcela]).trim();
    if (!parcela || /^(total|subtotal|média|media)$/i.test(parcela)) continue;

    const cap = parseNumero(row[mapping.cap]);
    const altura = parseNumero(row[mapping.altura]);

    if (isNaN(cap) || cap <= 0) continue;
    if (isNaN(altura) || altura <= 0) continue;

    const nidRaw = mapping.nid !== undefined ? row[mapping.nid] : i;
    const nid = mapping.nid !== undefined ? parseInt(nidRaw) || i : i;
    const fuste = mapping.fuste !== undefined ? parseInt(row[mapping.fuste]) || 1 : 1;
    const nome_comum = mapping.nome_comum !== undefined ? String(row[mapping.nome_comum]).trim() : "";
    const nome_cientifico = mapping.nome_cientifico !== undefined ? String(row[mapping.nome_cientifico]).trim() : "";
    const familia = mapping.familia !== undefined ? String(row[mapping.familia]).trim() : "";

    const { dap, ab, volume } = processarArvore(cap, altura);
    const classe_diametrica = classificarClasseDiametrica(dap);

    arvores.push({
      parcela,
      nid,
      fuste,
      nome_comum,
      nome_cientifico,
      familia,
      cap: Number(cap.toFixed(2)),
      altura: Number(altura.toFixed(2)),
      dap: Number(dap.toFixed(4)),
      ab: Number(ab.toFixed(6)),
      volume: Number(volume.toFixed(6)),
      classe_diametrica,
    });
  }

  return { arvores, mapping };
}

export function parsePlanilhaCampo(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetNames = wb.SheetNames;

  const prioridade = sheetNames.filter((s) => {
    const lower = s.toLowerCase();
    return lower.includes("campo") || lower.includes("dados") || lower.includes("acs") || lower === "plan1";
  });

  const ordem = prioridade.length > 0 ? prioridade : sheetNames;

  for (const sheetName of ordem) {
    const ws = wb.Sheets[sheetName];
    const resultado = tentarParseSheet(ws);
    if (resultado) {
      return { sheetName, totalLinhas: resultado.arvores.length, ...resultado };
    }
  }

  throw new Error("Planilha não reconhecida. Verifique se contém colunas: Parcela, CAP, Altura.");
}