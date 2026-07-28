import XLSX from "xlsx";
import { parseStringPromise } from "xml2js";
import Empresa from "../models/Empresa.js";

const MAPPING_DICT = {
  "município": "cidade",
  "municipio": "cidade",
  "cidade": "cidade",
  "responsável": "nome",
  "responsavel": "nome",
  "nome do responsável": "nome",
  "nome do responsavel": "nome",
  "nome": "nome",
  "cpf/cnpj": "numero_documento",
  "cpf": "numero_documento",
  "cnpj": "numero_documento",
  "documento": "numero_documento",
  "nº do documento": "numero_documento",
  "numero_documento": "numero_documento",
  "local da intervenção": "local_intervencao",
  "local da intervencao": "local_intervencao",
  "local_intervencao": "local_intervencao",
  "local": "local_intervencao",
  "modalidade principal": "modalidade",
  "modalidade": "modalidade",
  "nº do processo": "numero_processo",
  "numero_processo": "numero_processo",
  "processo": "numero_processo",
  "ano": "ano",
  "mês": "mes",
  "mes": "mes",
  "decisão": "decisao",
  "decisao": "decisao",
  "bioma": "bioma",
  "área autorizada (ha)": "area_autorizada",
  "área autorizada": "area_autorizada",
  "area autorizada (ha)": "area_autorizada",
  "area autorizada": "area_autorizada",
  "area_autorizada": "area_autorizada",
  "longitude (x)": "longitude",
  "longitude": "longitude",
  "coordenada_x": "coordenada_x",
  "latitude (y)": "latitude",
  "latitude": "latitude",
  "coordenada_y": "coordenada_y",
  "fuso": "fuso",
};

const FIELDS_TO_COMPARE = [
  "nome", "numero_documento", "cidade", "local_intervencao",
  "modalidade", "numero_processo", "ano", "mes", "decisao",
  "bioma", "area_autorizada", "coordenada_x", "longitude",
  "coordenada_y", "latitude", "fuso",
];

export async function parseFile(buffer, originalName) {
  const ext = originalName.toLowerCase().slice(originalName.lastIndexOf("."));

  if (ext === ".xlsx" || ext === ".xls") {
    return parseXlsx(buffer);
  }

  if (ext === ".csv") {
    return parseCsv(buffer);
  }

  if (ext === ".xml") {
    return parseXml(buffer);
  }

  throw Object.assign(new Error("Formato de arquivo não suportado."), { status: 400 });
}

function parseXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (data.length < 2) {
    throw Object.assign(new Error("Arquivo sem dados ou com apenas cabeçalho."), { status: 400 });
  }

  const headers = data[0].map((h) => String(h).trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j] !== undefined ? data[i][j] : "";
    }
    if (Object.values(row).some((v) => v !== "")) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseCsv(buffer) {
  const content = buffer.toString("utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    throw Object.assign(new Error("Arquivo CSV sem dados ou com apenas cabeçalho."), { status: 400 });
  }

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] !== undefined ? values[j] : "";
    }
    if (Object.values(row).some((v) => v !== "")) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

async function parseXml(buffer) {
  let parsed;
  try {
    const content = buffer.toString("utf-8");
    parsed = await parseStringPromise(content, { explicitArray: false, mergeAttrs: true });
  } catch {
    throw Object.assign(new Error("Erro ao processar arquivo XML. Verifique se o formato é válido."), { status: 400 });
  }
  const root = Object.values(parsed)[0];
  const rowsKey = Object.keys(root).find((k) => Array.isArray(root[k]));
  const items = rowsKey ? root[rowsKey] : [];

  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error("Nenhum registro encontrado no XML."), { status: 400 });
  }

  const headers = Object.keys(items[0]);
  const rows = items.map((item) => {
    const row = {};
    for (const key of headers) {
      row[key] = item[key] !== undefined ? String(item[key]) : "";
    }
    return row;
  });

  return { headers, rows };
}

export function autoDetectMapping(headers) {
  const mapping = {};
  for (const header of headers) {
    const key = header.toLowerCase().trim();
    const field = MAPPING_DICT[key];
    if (field) {
      mapping[header] = field;
    }
  }
  return mapping;
}

function normalizeValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") return val;
  const str = String(val).trim();
  const num = Number(str.replace(",", "."));
  if (!isNaN(num) && str !== "") return num;
  return str;
}

function compareRowWithExisting(row, existing) {
  for (const field of FIELDS_TO_COMPARE) {
    const a = normalizeValue(row[field]);
    const b = normalizeValue(existing[field]);
    if (a !== b) return false;
  }
  return true;
}

const IGNORE_ON_ERROR = new Set(["fuso", "area_autorizada"]);

export async function importEmpresas(rows, mapping, userId, organizacaoId = null) {
  const result = {
    total: rows.length,
    imported: 0,
    skipped: 0,
    errors: [],
    companies: [],
  };

  const filter = organizacaoId ? { organizacao: organizacaoId } : { usuario: userId };
  const existingAll = await Empresa.find(filter).lean();
  const existingByDoc = new Map();
  for (const emp of existingAll) {
    const key = emp.numero_documento;
    if (!existingByDoc.has(key)) existingByDoc.set(key, []);
    existingByDoc.get(key).push(emp);
  }

  const coercions = {
    local_intervencao: (v) => String(v),
    modalidade: (v) => String(v),
    ano: (v) => { const n = Number(String(v).replace(",", ".")); if (isNaN(n)) throw new Error(); return n; },
    mes: (v) => String(v),
    decisao: (v) => String(v),
    bioma: (v) => String(v),
    area_autorizada: (v) => { const n = Number(String(v).replace(",", ".")); if (isNaN(n)) throw new Error(); return n; },
    coordenada_x: (v) => { const n = Number(String(v).replace(",", ".")); if (isNaN(n)) throw new Error(); return n; },
    longitude: (v) => { const n = Number(String(v).replace(",", ".")); if (isNaN(n)) throw new Error(); return n; },
    coordenada_y: (v) => { const n = Number(String(v).replace(",", ".")); if (isNaN(n)) throw new Error(); return n; },
    latitude: (v) => { const n = Number(String(v).replace(",", ".")); if (isNaN(n)) throw new Error(); return n; },
    fuso: (v) => String(v),
  };

  const importedInBatch = [];

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i];
    const mapped = { usuario: userId };
    if (organizacaoId) mapped.organizacao = organizacaoId;

    for (const [header, field] of Object.entries(mapping)) {
      const val = rawRow[header];
      if (val !== undefined && val !== null && val !== "") {
        mapped[field] = val;
      }
    }

    const nome = mapped.nome, numero_documento = mapped.numero_documento, cidade = mapped.cidade;

    if (!nome || String(nome).trim() === "") {
      result.errors.push({ row: i + 2, message: "Responsável (nome) é obrigatório." });
      continue;
    }
    if (!numero_documento || String(numero_documento).trim() === "") {
      result.errors.push({ row: i + 2, message: "CPF/CNPJ é obrigatório." });
      continue;
    }
    if (!cidade || String(cidade).trim() === "") {
      result.errors.push({ row: i + 2, message: "Município (cidade) é obrigatório." });
      continue;
    }

    const data = {
      usuario: userId,
      nome: String(nome).trim(),
      numero_documento: String(numero_documento).trim(),
      cidade: String(cidade).trim(),
    };
    if (organizacaoId) data.organizacao = organizacaoId;

    const np = mapped.numero_processo;
    if (np !== undefined && np !== null && String(np).trim() !== "") {
      data.numero_processo = String(np).trim();
    }

    let rowError = null;

    for (const [field, coerce] of Object.entries(coercions)) {
      const val = mapped[field];
      if (val !== undefined && val !== null && val !== "") {
        try {
          data[field] = coerce(val);
        } catch {
          if (!IGNORE_ON_ERROR.has(field)) {
            rowError = `'${field}' com valor inválido`;
            break;
          }
        }
      }
    }

    if (rowError) {
      result.errors.push({ row: i + 2, message: rowError });
      continue;
    }

    const existingSameDoc = existingByDoc.get(data.numero_documento) || [];
    const matchExisting = existingSameDoc.find((e) => compareRowWithExisting(data, e));
    const matchBatch = importedInBatch.find((e) => compareRowWithExisting(data, e));

    if (matchExisting || matchBatch) {
      result.skipped++;
      continue;
    }

    let company;
    try {
      company = await Empresa.create(data);
    } catch (err) {
      result.errors.push({ row: i + 2, message: err.message });
      continue;
    }

    importedInBatch.push(data);
    result.imported++;
    result.companies.push(company);
  }

  return result;
}
