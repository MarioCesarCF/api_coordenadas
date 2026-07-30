export function calcularDAP(cap) {
  return cap / Math.PI;
}

export function calcularAB(dap) {
  return (Math.PI * dap * dap) / 40000;
}

export function calcularVolume(dap, altura, coefs = {}) {
  const v1 = coefs.valor1 ?? -9.821818496;
  const v2 = coefs.valor2 ?? 2.1551551721;
  const v3 = coefs.valor3 ?? 0.790768692;
  const expo = v1 + v2 * Math.log(dap) + v3 * Math.log(altura);
  return Math.exp(expo);
}

export function processarArvore(cap, altura, coefs) {
  const dap = calcularDAP(cap);
  const ab = calcularAB(dap);
  const volume = calcularVolume(dap, altura, coefs);
  return { dap, ab, volume };
}

export function classificarClasseDiametrica(dap) {
  if (dap <= 0) return "";
  const limite = Math.ceil(dap / 5) * 5;
  const inferior = Math.max(0, limite - 5);
  return `${inferior} |- ${limite}`;
}

export function calcularFatorExpansao(areaParcela) {
  if (!areaParcela || areaParcela <= 0) return 1;
  return 10000 / areaParcela;
}

export function calcularEstatisticas(valores) {
  const n = valores.length;
  if (n < 2) {
    return {
      n,
      media: valores[0] || 0,
      variancia: 0,
      desvioPadrao: 0,
      erroPadrao: 0,
      IC: 0,
      erroAmostral: 0,
      cv: 0,
    };
  }

  const media = valores.reduce((s, v) => s + v, 0) / n;
  const variancia = valores.reduce((s, v) => s + (v - media) ** 2, 0) / (n - 1);
  const desvioPadrao = Math.sqrt(variancia);
  const erroPadrao = desvioPadrao / Math.sqrt(n);

  const t = n <= 30 ? 2.042 : 1.96;
  const IC = t * erroPadrao;
  const erroAmostral = media !== 0 ? (IC / media) * 100 : 0;
  const cv = media !== 0 ? (desvioPadrao / media) * 100 : 0;

  return {
    n,
    media,
    variancia,
    desvioPadrao,
    erroPadrao,
    IC,
    erroAmostral: Math.abs(erroAmostral),
    cv: Math.abs(cv),
  };
}

export function calcularSuficiencia(media, variancia, n, erroAdmissivel, t = 1.96) {
  if (!media || !variancia || !erroAdmissivel || media === 0) {
    return { nOtimo: 0, parcelasAdicionais: 0 };
  }
  const cv = Math.sqrt(variancia) / media;
  const nOtimo = Math.ceil((t * t * cv * cv) / ((erroAdmissivel / 100) * (erroAdmissivel / 100)));
  const parcelasAdicionais = Math.max(0, nOtimo - n);
  return { nOtimo, parcelasAdicionais };
}

export function calcularFitossociologia(arvores, areaTotalHa, areaAmostradaHa) {
  const especies = {};
  const parcelas = {};

  for (const a of arvores) {
    const chave = a.nome_cientifico || a.nome_comum || "Desconhecida";

    if (!especies[chave]) {
      especies[chave] = {
        nome_cientifico: a.nome_cientifico,
        nome_comum: a.nome_comum,
        familia: a.familia,
        nid: 0,
        ab_total: 0,
        parcelas: new Set(),
      };
    }

    especies[chave].nid += 1;
    especies[chave].ab_total += a.ab || 0;
    especies[chave].parcelas.add(a.parcela);
  }

  const totalIndividuos = Object.values(especies).reduce((s, e) => s + e.nid, 0);
  const totalAB = Object.values(especies).reduce((s, e) => s + e.ab_total, 0);
  const totalParcelas = arvores.reduce((s, a) => s.add(a.parcela), new Set()).size;

  let areaEfetiva = areaAmostradaHa;
  if (!areaEfetiva && areaTotalHa) {
    areaEfetiva = areaTotalHa;
  }

  const resultados = Object.entries(especies).map(([chave, e]) => {
    const DA = areaEfetiva ? e.nid / areaEfetiva : 0;
    const DR = totalIndividuos ? (e.nid / totalIndividuos) * 100 : 0;
    const FA = totalParcelas ? (e.parcelas.size / totalParcelas) * 100 : 0;
    const FR = totalParcelas ? (e.parcelas.size / totalParcelas) * 100 : 0;
    const DoA = areaEfetiva ? e.ab_total / areaEfetiva : 0;
    const DoR = totalAB ? (e.ab_total / totalAB) * 100 : 0;

    return {
      nome_cientifico: e.nome_cientifico,
      nome_comum: e.nome_comum,
      familia: e.familia,
      nid: e.nid,
      ab_total: Number(e.ab_total.toFixed(4)),
      DA: Number(DA.toFixed(4)),
      DR: Number(DR.toFixed(4)),
      FA: Number(FA.toFixed(4)),
      FR: Number(FR.toFixed(4)),
      DoA: Number(DoA.toFixed(4)),
      DoR: Number(DoR.toFixed(4)),
      IVI: Number((DR + FR + DoR).toFixed(4)),
      IVC: Number((DR + DoR).toFixed(4)),
    };
  });

  resultados.sort((a, b) => b.IVI - a.IVI);

  return resultados;
}

export function calcularDistribuicaoDiametrica(arvores) {
  const classes = {};

  for (const a of arvores) {
    const cd = a.classe_diametrica || classificarClasseDiametrica(a.dap);
    if (!classes[cd]) {
      classes[cd] = { classe: cd, nf: 0, ab_total: 0 };
    }
    classes[cd].nf += 1;
    classes[cd].ab_total += a.ab || 0;
  }

  return Object.values(classes).sort((a, b) => {
    const va = parseInt(a.classe);
    const vb = parseInt(b.classe);
    return va - vb;
  });
}

export function processarParcelas(arvores, areaParcela, areaTotal, coefs) {
  const parcelasMap = {};
  for (const a of arvores) {
    if (!parcelasMap[a.parcela]) {
      parcelasMap[a.parcela] = { parcela: a.parcela, arvores: [], totalAB: 0, totalVol: 0 };
    }
    parcelasMap[a.parcela].arvores.push(a);
    parcelasMap[a.parcela].totalAB += a.ab || 0;
    parcelasMap[a.parcela].totalVol += a.volume || 0;
  }

  const parcelas = Object.values(parcelasMap);
  const F = calcularFatorExpansao(areaParcela);
  const numeroParcelas = parcelas.length;
  const vhaValues = parcelas.map((p) => p.totalVol * F);
  const ghaValues = parcelas.map((p) => p.totalAB * F);

  const totalGeral = arvores.reduce((s, a) => s + (a.volume || 0), 0);
  const totalGeralHa = vhaValues.reduce((s, v) => s + v, 0);
  const areaTotalHa = areaTotal || (numeroParcelas * areaParcela) / 10000;
  const areaAmostradaHa = (numeroParcelas * areaParcela) / 10000;

  let estatisticas = null;
  if (numeroParcelas >= 2) {
    estatisticas = calcularEstatisticas(vhaValues);
  }

  return {
    parcelas,
    numeroParcelas,
    F,
    vhaValues,
    ghaValues,
    totalGeral: Number(totalGeral.toFixed(4)),
    totalGeralHa: Number(totalGeralHa.toFixed(4)),
    mediaVha: vhaValues.length ? Number((vhaValues.reduce((s, v) => s + v, 0) / vhaValues.length).toFixed(4)) : 0,
    mediaGha: ghaValues.length ? Number((ghaValues.reduce((s, v) => s + v, 0) / ghaValues.length).toFixed(4)) : 0,
    areaAmostradaHa: Number(areaAmostradaHa.toFixed(4)),
    areaTotalHa: Number(areaTotalHa.toFixed(4)),
    estatisticas,
  };
}