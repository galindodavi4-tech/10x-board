/* ==================================================================
 *  REGRAS DE NUTRIÇÃO — CFGA (Lucas Orsatti)
 *  Base de dados do Gerador de Plano Alimentar do 10X Board.
 *
 *  ⚠️ TODOS os números, fórmulas, faixas e recomendações vêm do arquivo
 *  REGRAS_NUTRICAO_CFGA (curso do Lucas Orsatti). Nada aqui é fórmula
 *  genérica de internet. Onde uma decisão de implementação não estava
 *  100% explícita no material, está marcada com "// REVISAR CFGA".
 *
 *  Etapa 1 usa: OBJETIVOS, CENARIOS, MET, AJUSTE_KCAL, MACROS, HIDRATACAO
 *  e o motor de cálculo (GEB Tisley → VET → meta → macros).
 *  As demais seções (timing, refeições, alimentos, suplementos, alertas)
 *  ficam prontas aqui para as etapas 2–5.
 * ================================================================== */

/* ---- Objetivos e cenários (perfis alternáveis) -------------------- */
export const OBJETIVOS = [
  { key: "massa", label: "Ganho de massa", short: "Massa" },
  { key: "perda_gordura", label: "Perda de gordura", short: "Gordura" },
  { key: "performance", label: "Performance / manutenção", short: "Performance" },
];
export const objetivoInfo = (k) => OBJETIVOS.find((o) => o.key === k) || OBJETIVOS[2];

export const CENARIOS = [
  { key: "rotina", label: "Rotina normal / temporada" },
  { key: "pre_temporada", label: "Pré-temporada" },
  { key: "lesao", label: "Lesão" },
  { key: "alojamento", label: "Alojamento" },
];
export const cenarioInfo = (k) => CENARIOS.find((c) => c.key === k) || CENARIOS[0];

/* Contexto de jogo (§4.3 / §4.4). "nenhum" = dia comum. */
export const JOGO_CONTEXTO = [
  { key: "nenhum", label: "Sem jogo" },
  { key: "vespera_24h", label: "24h antes do jogo", avancado: true },
  { key: "dia_jogo", label: "Dia do jogo" },
];

/* ---- §1.2 Sistema MET --------------------------------------------- */
/* Gasto_atividade = MET × peso_kg × duração_horas                    */
export const MET = {
  futebol: 10, // futebol intenso (campo/jogo)
  musculacao: 5.25, // média da faixa 4,5–6 do curso
};
export const TIPOS_TREINO = [
  { key: "musculacao", label: "Musculação", met: MET.musculacao },
  { key: "futebol", label: "Futebol", met: MET.futebol },
];

/* ---- §1.4 Ajuste calórico por objetivo (valores do código §12.4) -- */
export const AJUSTE_KCAL = {
  massa: 750, // faixa oficial +500 a +1000
  perda_gordura: -750, // faixa oficial −500 a −1000 (alternativa: 25 kcal/kg/dia)
  performance: 0, // manutenção
};
/* Alternativa prática do curso p/ perda de gordura (§1.4 / §2.2). */
export const PERDA_GORDURA_KCAL_POR_KG = 25;

/* ---- §12.4 Macros por objetivo/cenário (g/kg/dia) ----------------- */
/* Faixas [min, max]. A chave usada depende de objetivo + cenário +   */
/* contexto de jogo (ver macroKeyFor).                                */
export const MACROS = {
  massa: { cho: [4, 7], ptn: [1.6, 2.2], lip: [0.5, 1.0] },
  perda_gordura: { cho: [4, 6], ptn: [1.6, 2.5], lip: [0.5, 1.0] },
  performance: { cho: [5, 8], ptn: [1.2, 1.6], lip: [0.5, 1.0] },
  lesao: { cho: [3, 5], ptn: [2.0, 3.0], lip: [0.8, 1.2] },
  pre_jogo_24h: { cho: [6, 8], ptn: [1.6, 2.0], lip: [0.5, 0.8] },
  pos_jogo_24h: { cho: [6, 8], ptn: [1.6, 2.0], lip: [0.5, 1.0] },
  off_season: { cho: [5, 8], ptn: [1.6, 2.2], lip: [0.5, 1.0] }, // §2.4 (PTN); CHO/LIP herdados de performance/massa. REVISAR CFGA
};

/* §2.5 Proteína por refeição: 0,25–0,3 g/kg, teto de síntese 30–40g. */
export const PTN_POR_REFEICAO_G_KG = 0.3; // usa 0,3 (topo da faixa 0,25–0,3)
export const PTN_TETO_REFEICAO_G = 35; // teto de síntese proteica (platô 30–40g)

/* ---- §6 Hidratação ------------------------------------------------ */
export const HIDRATACAO = {
  diariaMlPorKg: [35, 50], // faixa oficial no app
  preTreinoMlPorKg: [5, 10], // 5–10 ml/kg nas 2–4h antes (recovery); dia de jogo 5–7
  intraMlPorHora: [400, 800], // 0,4–0,8 L/h
  posReposicaoPct: 150, // repor 150% do peso perdido
  sudoreseSodioLh: 1.2, // > 1,2 L/h → sódio importantíssimo
  diluicaoCarboPct: [6, 12], // solução CHO+eletrólitos p/ não causar prejuízo GI
};

/* ---- §3 Timing de carboidrato (Aula 18) --------------------------- */
export const TIMING_CHO = {
  antes: [
    { janela: "3-4 horas antes", tipo: "abs", quantidade: [200, 300], unidade: "g" },
    { janela: "1-2 horas antes", tipo: "gkg", quantidade: [1, 2], unidade: "g/kg" },
    { janela: "30-15 min antes", tipo: "abs", quantidade: [30, 60], unidade: "g" },
  ],
  /* §3.3 intra — REGRA DE OURO: só recomendar se sessão > 60 min */
  intra: [
    { maxMin: 60, quantidade: null, nota: "Sem necessidade (pode sugerir bochecho de CHO)" },
    { maxMin: 150, quantidade: [30, 60], nota: "30–60 g de CHO" },
    { maxMin: Infinity, quantidade: [null, 90], nota: "Até 90 g de CHO" },
  ],
  /* §3.4 pós: até 60 min, 1 g/kg de CHO por hora */
  posGkgPorHora: 1,
  posJanelaMin: 60,
  /* §3.5 duas sessões/dia com pouco intervalo — protocolo acelerado */
  aceleradoChoGkg: [1, 1.2],
  aceleradoPtnG: [20, 30],
  aceleradoJanelaMin: [30, 60],
};

/* ---- §5 Estrutura de horários (clube profissional, referência) ---- */
export const JANELAS_REFEICAO = [
  { key: "cafe", label: "Café da manhã", janela: "08:00–10:00" },
  { key: "almoco", label: "Almoço", janela: "11:30–14:00" },
  { key: "pre_treino", label: "Pré-treino", janela: "15:00–15:30" },
  { key: "intra_treino", label: "Intra-treino", janela: "no campo" },
  { key: "pos_treino", label: "Pós-treino", janela: "no vestiário" },
  { key: "jantar", label: "Jantar", janela: "18:30–20:00" },
  { key: "ceia", label: "Ceia / pré-sono", janela: "21:45–22:30" },
];

/* ---- §12.2 Categorias BASE / COMPLEMENTO / ACESSÓRIO -------------- */
export const CATEGORIAS_REFEICAO = {
  base: { label: "BASE", color: "#FF1B7A", obrigatorio: true }, // fonte principal de CHO e/ou PTN
  complemento: { label: "COMPLEMENTO", color: "#22C55E", obrigatorio: true }, // micronutrientes — NÃO descartável (§12.2)
  acessorio: { label: "ACESSÓRIO", color: "#F5A524", obrigatorio: false }, // gorduras boas, temperos, extras
};

/* ---- §12.5 Tabela nutricional base (por 100g) --------------------- */
/* cat: carbo | proteina | gordura | legume | fruta | suplemento      */
/* tags p/ filtro por cenário (etapa 4):                              */
/*   barato (§8.4), antiInflam (§4.6), proInflam (evitar na lesão),   */
/*   preJogo (§4.4 fácil digestão)                                    */
export const ALIMENTOS = [
  // Carboidratos
  { key: "arroz", label: "Arroz branco cozido", cat: "carbo", cho: 28, ptn: 2.5, lip: 0.2, kcal: 128, barato: true },
  { key: "macarrao", label: "Macarrão cozido", cat: "carbo", cho: 30, ptn: 5.0, lip: 0.9, kcal: 158, barato: true },
  { key: "batata_doce", label: "Batata doce cozida", cat: "carbo", cho: 20, ptn: 1.6, lip: 0.1, kcal: 86, barato: true },
  { key: "batata_inglesa", label: "Batata inglesa cozida", cat: "carbo", cho: 20, ptn: 1.9, lip: 0.1, kcal: 87, barato: true },
  { key: "mandioca", label: "Mandioca cozida", cat: "carbo", cho: 30, ptn: 1.4, lip: 0.3, kcal: 125 },
  { key: "inhame", label: "Inhame cozido", cat: "carbo", cho: 27, ptn: 1.5, lip: 0.2, kcal: 116 },
  { key: "pao_frances", label: "Pão francês", cat: "carbo", cho: 58, ptn: 8.0, lip: 3.1, kcal: 300, barato: true, preJogo: true },
  { key: "aveia", label: "Aveia (crua)", cat: "carbo", cho: 67, ptn: 14, lip: 7.0, kcal: 389, barato: true },
  { key: "tapioca", label: "Tapioca (goma)", cat: "carbo", cho: 62, ptn: 0.3, lip: 0.1, kcal: 250, barato: true, preJogo: true },
  { key: "cuscuz", label: "Cuscuz de milho cozido", cat: "carbo", cho: 25, ptn: 2.2, lip: 0.6, kcal: 113, barato: true, preJogo: true },
  { key: "banana", label: "Banana", cat: "fruta", cho: 23, ptn: 1.1, lip: 0.3, kcal: 89, barato: true, preJogo: true },
  { key: "feijao", label: "Feijão cozido", cat: "carbo", cho: 14, ptn: 5.0, lip: 0.5, kcal: 76, barato: true },
  { key: "maltodextrina", label: "Maltodextrina", cat: "suplemento", cho: 95, ptn: 0, lip: 0, kcal: 380, preJogo: true },
  // Proteínas (animal)
  { key: "frango", label: "Peito de frango grelhado", cat: "proteina", cho: 0, ptn: 32, lip: 3.6, kcal: 165, barato: true, antiInflam: false },
  { key: "carne_bovina", label: "Carne bovina magra", cat: "proteina", cho: 0, ptn: 26, lip: 8.0, kcal: 180 },
  { key: "carne_suina", label: "Carne suína magra", cat: "proteina", cho: 0, ptn: 27, lip: 7.0, kcal: 175, barato: true },
  { key: "atum", label: "Atum (lata, água)", cat: "proteina", cho: 0, ptn: 26, lip: 1.0, kcal: 116, antiInflam: true },
  { key: "sardinha", label: "Sardinha (lata)", cat: "proteina", cho: 0, ptn: 25, lip: 11, kcal: 200, antiInflam: true },
  { key: "ovo", label: "Ovo (1 un ≈ 50g)", cat: "proteina", cho: 0.6, ptn: 6.3, lip: 5.3, kcal: 72, barato: true },
  { key: "leite_integral", label: "Leite integral", cat: "proteina", cho: 4.8, ptn: 3.2, lip: 3.3, kcal: 61, barato: true },
  { key: "leite_po", label: "Leite em pó", cat: "proteina", cho: 38, ptn: 26, lip: 26, kcal: 496 },
  { key: "iogurte", label: "Iogurte natural", cat: "proteina", cho: 4.7, ptn: 3.5, lip: 3.3, kcal: 61 },
  { key: "mucarela", label: "Muçarela", cat: "proteina", cho: 2.2, ptn: 22, lip: 22, kcal: 300 },
  { key: "whey", label: "Whey protein (pó)", cat: "suplemento", cho: 8.0, ptn: 75, lip: 5.0, kcal: 380 },
  // Gorduras boas (anti-inflamatórias §4.6)
  { key: "azeite", label: "Azeite extra virgem", cat: "gordura", cho: 0, ptn: 0, lip: 100, kcal: 884, antiInflam: true },
  { key: "abacate", label: "Abacate", cat: "gordura", cho: 9, ptn: 2.0, lip: 15, kcal: 160, antiInflam: true },
  { key: "castanha_para", label: "Castanha do Pará", cat: "gordura", cho: 12, ptn: 14, lip: 66, kcal: 656, antiInflam: true },
  { key: "amendoim", label: "Amendoim", cat: "gordura", cho: 16, ptn: 26, lip: 49, kcal: 567, antiInflam: true },
  { key: "pasta_amendoim", label: "Pasta de amendoim", cat: "gordura", cho: 20, ptn: 25, lip: 50, kcal: 588, antiInflam: true },
  // Legumes/verduras (COMPLEMENTO — micronutrientes obrigatórios §12.2)
  { key: "brocolis", label: "Brócolis cozido", cat: "legume", cho: 7.0, ptn: 2.4, lip: 0.4, kcal: 35, barato: true, antiInflam: true },
  { key: "cenoura", label: "Cenoura", cat: "legume", cho: 10, ptn: 0.9, lip: 0.2, kcal: 41, barato: true, antiInflam: true },
  { key: "beterraba", label: "Beterraba", cat: "legume", cho: 10, ptn: 1.6, lip: 0.2, kcal: 43, barato: true, antiInflam: true },
  { key: "tomate", label: "Tomate", cat: "legume", cho: 3.9, ptn: 0.9, lip: 0.2, kcal: 18, barato: true, antiInflam: true },
  // Frutas
  { key: "laranja", label: "Laranja", cat: "fruta", cho: 12, ptn: 0.9, lip: 0.1, kcal: 47, barato: true, antiInflam: true },
  { key: "maca", label: "Maçã", cat: "fruta", cho: 14, ptn: 0.3, lip: 0.2, kcal: 52, barato: true, antiInflam: true },
];
export const alimentoInfo = (k) => ALIMENTOS.find((a) => a.key === k);

/* §8.5 Alimentos a evitar (pró-inflamatórios / baixo valor). */
export const ALIMENTOS_EVITAR = [
  "Miojo", "Salsicha", "Mortadela", "Achocolatados", "Salgadinhos",
  "Batata frita", "Álcool", "Refrigerantes", "Fast food", "Embutidos",
  "Ultraprocessados", "Frituras", "Manteiga",
];

/* ---- §7 Suplementos (doses e timing exatos) ----------------------- */
export const SUPLEMENTOS = {
  creatina: { nome: "Creatina", dose: "3–5 g/dia", timing: "Preferencialmente no pós-treino (mas qualquer horário serve)", nota: "Efeito crônico; melhor com carboidratos." },
  cafeina: { nome: "Cafeína", doseMgPorKg: [3, 6], timing: "45–60 min antes do exercício", nota: "Uso crônico gera tolerância; pode causar taquicardia/insônia." },
  whey: { nome: "Whey protein", dose: "Conforme necessidade proteica", timing: "Pós-treino ou quando não bate a meta só com comida", nota: "Não é obrigatório. NÃO usar no pré-treino. No pré-sono, usar com LEITE (caseína), não com água." },
  maltodextrina: { nome: "Maltodextrina", dose: "Conforme intra/pós", timing: "Intra-treino longo / pós-treino", nota: "Carboidrato em pó, bom e barato." },
  beta_alanina: { nome: "Beta-alanina", dose: "—", timing: "—", nota: "Controle de acidez muscular; promissor." },
  omega3: { nome: "Ômega 3", dose: "—", timing: "—", nota: "Anti-inflamatório; usar com cuidado. Não aumenta performance direta." },
  isotonico: { nome: "Isotônico", dose: "Conforme hidratação", timing: "Intra/pós", nota: "Eletrólitos + carbo de rápida absorção." },
  suco_beterraba: { nome: "Suco de beterraba", dose: "—", timing: "—", nota: "Recuperação." },
};
/* §7.9 Suplementos por objetivo/cenário. */
export const SUPLEMENTOS_POR_PERFIL = {
  massa: ["whey", "creatina"], // + hipercalórico (não é suplemento simples na tabela)
  perda_gordura: [], // ⚠ NÃO EXISTE suplemento para perda de gordura corporal
  performance: ["cafeina", "maltodextrina", "isotonico", "creatina", "beta_alanina"],
  lesao: ["whey", "creatina", "omega3", "suco_beterraba"],
  alojamento: ["creatina", "whey"], // orçamento limitado — apenas 2 essenciais
};

/* ---- §12.3 Validações e alertas ----------------------------------- */
export const ALERTAS = {
  ptnRefeicaoAlta: "Acima de 30–40g por refeição não aumenta a síntese proteica. Redistribua ao longo do dia.",
  intraDesnecessario: "Treinos de até 60 min não precisam de intra-treino.",
  supPerdaGordura: "Não existe suplemento para perda de gordura corporal.",
  wheyPreSonoAgua: "No pré-sono, use whey com LEITE (caseína = absorção lenta), não com água.",
  wheyPreTreino: "Whey no pré-treino não é interessante.",
  lesaoCortaCalorias: "Cortar calorias na lesão pode ser um tiro no pé. O alimento é combustível para reparar tecidos.",
  cargaCho24h: "Estratégia avançada — deve ser testada antes e idealmente acompanhada por nutricionista.",
  sudoreseSodio: "Reposição de sódio é importantíssima.",
  aguaNaoBatida: "Faixa alvo: 35–50 ml/kg.",
  diaJogoNaoInventar: "NÃO INVENTAR — no pré-jogo só use o que já foi testado.",
};

/* ---- Avisos fixos de segurança ------------------------------------ */
export const AVISO_RODAPE =
  "Este plano é educacional e baseado nos métodos do CFGA. Não substitui acompanhamento de nutricionista. Consulte um profissional antes de seguir à risca, especialmente quanto a suplementos.";
export const AVISO_AVANCADO =
  "Estratégia avançada — deve ser testada com antecedência e idealmente acompanhada por um nutricionista. Nunca aplique pela primeira vez antes de um jogo importante.";

/* ================================================================== */
/*  MOTOR DE CÁLCULO (§1 Equação de Tisley + §12.4)                    */
/* ================================================================== */
const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? 0 : Number(v));
const round = (n) => Math.round(n);
const round1 = (n) => Math.round(n * 10) / 10;

/* §1.1 GEB (Tisley). Usa MLG se houver % de gordura ou MLG informada. */
export function calcGEB(perfil) {
  const p = num(perfil.pesoKg);
  let mlg = null;
  if (num(perfil.massaLivreGordura) > 0) mlg = num(perfil.massaLivreGordura);
  else if (num(perfil.percentualGordura) > 0) mlg = p * (1 - num(perfil.percentualGordura) / 100);
  if (mlg != null && mlg > 0) return { geb: round(25.9 * mlg + 284), usouMLG: true, mlg: round1(mlg) };
  return { geb: round(24.8 * p + 10), usouMLG: false, mlg: null };
}

export const metPorTipo = (tipo) => (tipo === "futebol" ? MET.futebol : MET.musculacao);

/* §1.2 Gasto por atividade de cada treino do dia. */
export function calcGastosTreinos(perfil, treinos) {
  const p = num(perfil.pesoKg);
  return (treinos || [])
    .filter((t) => num(t.duracaoMin) > 0)
    .map((t) => {
      const met = metPorTipo(t.tipo);
      const horas = num(t.duracaoMin) / 60;
      return { ...t, met, horas: round1(horas), kcal: round(met * p * horas) };
    });
}

/* Qual conjunto de macros usar (objetivo + cenário + contexto de jogo). */
export function macroKeyFor(perfil) {
  if (perfil.cenario === "lesao") return "lesao"; // §4.6 sobrepõe objetivo
  if (perfil.jogo === "vespera_24h") return "pre_jogo_24h"; // §4.3 carga de carbo
  // REVISAR CFGA: o material não define macro g/kg próprio para "dia de jogo".
  // Conservador: manter a faixa alta de véspera (glicogênio) no dia do jogo.
  if (perfil.jogo === "dia_jogo") return "pre_jogo_24h";
  return perfil.objetivo; // massa | perda_gordura | performance
}

/* Motor completo → números diários. `treinos` são os do dia calculado. */
export function calcularMetas(perfil, treinos) {
  const p = num(perfil.pesoKg);
  const { geb, usouMLG, mlg } = calcGEB(perfil);
  const gastos = calcGastosTreinos(perfil, treinos);
  const somaGastos = gastos.reduce((a, g) => a + g.kcal, 0);
  const vet = geb + somaGastos;

  const macroKey = macroKeyFor(perfil);
  const m = MACROS[macroKey] || MACROS.performance;

  let ajuste = AJUSTE_KCAL[perfil.objetivo] ?? 0;
  // §4.6: na lesão o curso é explícito — NÃO cortar calorias.
  const ajusteBloqueado = perfil.cenario === "lesao" && ajuste < 0;
  if (ajusteBloqueado) ajuste = 0;
  const meta = vet + ajuste;

  const cho = [round(m.cho[0] * p), round(m.cho[1] * p)];
  const ptn = [round(m.ptn[0] * p), round(m.ptn[1] * p)];
  const lip = [round(m.lip[0] * p), round(m.lip[1] * p)];
  const agua = [round(HIDRATACAO.diariaMlPorKg[0] * p), round(HIDRATACAO.diariaMlPorKg[1] * p)];
  const ptnPorRefeicao = round(Math.min(p * PTN_POR_REFEICAO_G_KG, PTN_TETO_REFEICAO_G));
  const cafeina = [round(SUPLEMENTOS.cafeina.doseMgPorKg[0] * p), round(SUPLEMENTOS.cafeina.doseMgPorKg[1] * p)];

  return {
    peso: p, geb, usouMLG, mlg, gastos, somaGastos, vet,
    macroKey, faixas: m, ajuste, ajusteBloqueado, meta,
    cho, ptn, lip, agua, ptnPorRefeicao, cafeina,
  };
}

/* §12.4 equivalência: gramas do alimento p/ bater uma meta de macro. */
export function gramasAlimento(macroAlvoG, macroPor100g) {
  if (!macroPor100g) return null;
  return round((macroAlvoG / macroPor100g) * 100);
}
