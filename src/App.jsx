import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import {
  Plus, X, ChevronLeft, ChevronRight, Trophy, Flame, Target,
  Clock, Check, Trash2, Pencil, Sun, Moon, MonitorSmartphone, Sparkles,
  CheckCircle2, Zap, Activity, Brain, Smile, Gauge, BarChart3, Calendar as CalendarIcon,
  Repeat, TrendingUp, Award, AlertTriangle, Shield, Droplets, Scale,
  CalendarDays, Apple, Quote, ListChecks, Home, Droplet
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, ReferenceLine, ReferenceArea
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                        */
/* ------------------------------------------------------------------ */
/* Tema único (inspirado no design base, Geração de Atletas):            */
/* fundo cinza escuro, caixas de conteúdo MAIS escuras que o fundo,       */
/* e elementos "elevados" (células de dia, inputs, chips) um pouco claros.*/
const THEME = {
  bg: "#1A1A1D",        // fundo da página — cinza escuro
  surface: "#101012",   // cards de conteúdo — mais escuros que o fundo
  surface2: "#28282E",  // elevados: célula de dia, input, chip, botão 2º
  line: "#33333A",      // bordas
  pink: "#FF1B7A",
  pinkDark: "#C4125A",
  pinkSoft: "rgba(255,27,122,0.14)",
  text: "#F5F5F7",
  muted: "#8C8C97",
  blue: "#4F8FF7",
  blueSoft: "rgba(79,143,247,0.14)",
};
const DARK = THEME;
const LIGHT = THEME;
const AMBER = "#F5A524";

const ColorContext = createContext(DARK);
const useC = () => useContext(ColorContext);

function isNightNow() {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
}

const TYPES = [
  { key: "forca", label: "FORÇA", fill: true },
  { key: "cardio", label: "CARDIO", fill: false },
  { key: "campo", label: "CAMPO", fill: false },
  { key: "tecnico", label: "TÉCNICO", fill: false },
  { key: "jogo", label: "JOGO", fill: false },
];
const typeInfo = (k) => TYPES.find((t) => t.key === k) || TYPES[0];

const RESULT_OPTIONS = [
  { key: "vitoria", label: "Vitória", letter: "V", color: "#22C55E" },
  { key: "empate", label: "Empate", letter: "E", color: "#9A9AA3" },
  { key: "derrota", label: "Derrota", letter: "D", color: "#E5484D" },
];
const resultInfo = (k) => RESULT_OPTIONS.find((r) => r.key === k);

const WEEKDAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const WEEKDAY_FULL = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const MONTH_LABELS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
/* Frases de motivação exibidas na página principal. Fáceis de ampliar. */
const QUOTES = [
  { text: "No que diz respeito ao empenho, ao compromisso, ao esforço, à dedicação, não existe meio termo. Ou você faz uma coisa bem feita ou não faz.", author: "Ayrton Senna" },
];
function quoteOfTheDay() {
  const d = fromISO(toISO(new Date()));
  const idx = Math.floor(d.getTime() / 86400000) % QUOTES.length;
  return QUOTES[idx];
}

/* Frases curtas (futebol / disciplina / performance) da aba Hoje.       */
/* Escolhida de forma determinística pela data — muda à meia-noite.       */
const PHRASES = [
  "Disciplina vence talento quando o talento não treina.",
  "Cada treino é um degrau. Sobe.",
  "O jogo se ganha no treino.",
  "Constância vira craque.",
  "Não conte os dias — faça os dias contarem.",
  "Quem quer chegar longe cuida dos detalhes.",
  "Sua única concorrência é quem você foi ontem.",
  "Treina como se estivesse atrás, joga como líder.",
  "Talento abre a porta, atitude te mantém dentro.",
  "1% melhor por dia vira 10x no fim do ano.",
  "Cansaço é temporário. Desistência é pra sempre.",
  "O suor de hoje é o troféu de amanhã.",
  "Foco no processo — o resultado vem.",
  "Não existe atalho pra lugar que vale a pena.",
  "Corre mais um. Sempre mais um.",
  "Grandes jogadores fazem o simples muito bem.",
  "A bola não mente: o trabalho aparece.",
  "Recuperar também é treinar.",
  "Mentalidade de titular, fome de reserva.",
  "Vença a preguiça antes de vencer o adversário.",
  "Hidrate, durma, treine, repita.",
  "Pequenos hábitos, grandes resultados.",
  "Você é o que repete todo dia.",
  "O campo respeita quem treina de verdade.",
  "Feito é melhor que perfeito. Começa.",
];
function phraseOfDay() {
  const d = fromISO(toISO(new Date()));
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return PHRASES[dayOfYear % PHRASES.length];
}

const CANSACO_LEVELS = [
  { v: 1, label: "Leve" },
  { v: 2, label: "Ok" },
  { v: 3, label: "Cansado" },
  { v: 4, label: "Muito cansado" },
  { v: 5, label: "Exausto" },
];

/* Subjective wellness scale (5 levels) — same pattern as reference image */
const SCALE_5 = [
  { v: 1, label: "Péssimo", color: "#E5484D" },
  { v: 2, label: "Ruim", color: "#F5A524" },
  { v: 3, label: "Normal", color: "#9A9AA3" },
  { v: 4, label: "Boa", color: "#3B82F6" },
  { v: 5, label: "Ótima", color: "#22C55E" },
];
const RECOVERY_METRICS = [
  { key: "sono", label: "Qualidade da sua noite de sono", icon: Moon },
  { key: "disposicao", label: "Sua disposição hoje", icon: Zap },
  { key: "dor", label: "Sua dor muscular hoje", icon: Activity },
  { key: "stress", label: "Seu nível de stress hoje", icon: Brain },
  { key: "humor", label: "Seu humor hoje", icon: Smile },
];
function recoveryColor(v) {
  if (v <= 2) return "#E5484D";
  if (v <= 4) return "#F5A524";
  if (v === 5) return "#E8C13B";
  if (v <= 7) return "#8FD14F";
  return "#22C55E";
}

/* ------------------------------------------------------------------ */
/*  Hydration — water content per beverage (scientifically referenced) */
/*  Fontes: USDA FoodData Central + Beverage Hydration Index           */
/*  (Maughan et al., Am J Clin Nutr 2016). Valores = % de água.        */
/* ------------------------------------------------------------------ */
const BEVERAGES = [
  { key: "agua",      label: "Água",         waterPct: 100, color: "#38BDF8" },
  { key: "cafe",      label: "Café",         waterPct: 99,  color: "#8B5E3C" },
  { key: "cha",       label: "Chá",          waterPct: 99,  color: "#7BB661" },
  { key: "coco",      label: "Água de coco", waterPct: 95,  color: "#A3D948" },
  { key: "isotonico", label: "Isotônico",    waterPct: 93,  color: "#22C55E" },
  { key: "refri",     label: "Refrigerante", waterPct: 89,  color: "#9A9AA3" },
  { key: "suco",      label: "Suco natural", waterPct: 88,  color: "#F5A524" },
  { key: "leite",     label: "Leite",        waterPct: 87,  color: "#D9CBA3" },
];
const bevInfo = (k) => BEVERAGES.find((b) => b.key === k) || BEVERAGES[0];
/* água efetiva de uma dose = volume × (% de água / 100) */
const effectiveWater = (entry) => Math.round((entry.amount * bevInfo(entry.type).waterPct) / 100);
/* zona ótima de ingestão: 35–50 ml de água por kg de peso corporal */
const WATER_ML_PER_KG_MIN = 35;
const WATER_ML_PER_KG_MAX = 50;
const WATER_BLUE = "#38BDF8";
const AMOUNT_PRESETS = [200, 300, 500];

/* ================================================================== */
/*  MEAL PLAN GENERATOR — data & configuration                         */
/*  ⚠️ Fórmulas de nutrição esportiva padrão (Mifflin-St Jeor, g/kg).   */
/*  Fáceis de refinar depois com os PDFs do curso CFGA. Todos os        */
/*  números aqui são pontos de ajuste explícitos.                       */
/* ================================================================== */

const NUTRI_GOALS = [
  { key: "massa",       label: "Ganho de massa", short: "Massa" },
  { key: "gordura",     label: "Perda de gordura", short: "Gordura" },
  { key: "performance", label: "Performance",     short: "Performance" },
];
const nutriGoalInfo = (k) => NUTRI_GOALS.find((g) => g.key === k) || NUTRI_GOALS[0];

/* Distribuição de macros por objetivo (g por kg de peso corporal).     */
/* carb/prot são alvos por kg; a gordura é o restante das calorias.     */
/* Ajuste de energia (kcalAdj) sobre o gasto total (TDEE).              */
const GOAL_MACROS = {
  massa:       { carb: 6.0, prot: 2.0, kcalAdj: 1.10 }, // superávit ~10%
  gordura:     { carb: 3.5, prot: 2.2, kcalAdj: 0.80 }, // déficit ~20%
  performance: { carb: 7.0, prot: 1.8, kcalAdj: 1.00 }, // manutenção
};
const FAT_FLOOR_PER_KG = 0.8; // piso de gordura pra saúde hormonal

/* Fator de atividade a partir das sessões de treino/semana (do app).   */
/* Conservador: na dúvida, fica no fator mais baixo.                    */
function activityFactorFromSessions(sessionsPerWeek) {
  if (sessionsPerWeek <= 1) return 1.375;
  if (sessionsPerWeek <= 3) return 1.55;
  if (sessionsPerWeek <= 5) return 1.725;
  return 1.9;
}

/* Categorias visuais dos itens de cada refeição.                       */
const MEAL_TIERS = {
  base:        { label: "BASE",        color: "#FF1B7A" }, // essencial (rosa marca)
  complemento: { label: "COMPLEMENTO", color: "#4F8FF7" }, // azul
  acessorio:   { label: "ACESSÓRIO",   color: "#8C8C97" }, // cinza (opcional)
};

/* Tabela de alimentos — valores por 100g (carb, prot, fat, kcal).      */
/* Fontes: TACO/USDA (aprox.). "cooked" = cozido/grelhado quando aplicável. */
const FOODS = {
  carb: [
    { key: "arroz",     label: "Arroz cozido",        per100: { carb: 28, prot: 2.5, fat: 0.2, kcal: 130 } },
    { key: "macarrao",  label: "Macarrão cozido",     per100: { carb: 31, prot: 5.0, fat: 1.1, kcal: 158 } },
    { key: "batatadoce",label: "Batata doce cozida",  per100: { carb: 20, prot: 1.6, fat: 0.1, kcal: 86 } },
    { key: "batata",    label: "Batata inglesa cozida", per100: { carb: 20, prot: 2.0, fat: 0.1, kcal: 87 } },
    { key: "aveia",     label: "Aveia (crua)",        per100: { carb: 66, prot: 13, fat: 7, kcal: 389 } },
    { key: "pao",       label: "Pão francês",         per100: { carb: 58, prot: 8, fat: 3, kcal: 300 } },
    { key: "tapioca",   label: "Tapioca (goma)",      per100: { carb: 88, prot: 0, fat: 0, kcal: 358 } },
    { key: "banana",    label: "Banana",              per100: { carb: 23, prot: 1.1, fat: 0.3, kcal: 96 } },
  ],
  prot: [
    { key: "frango",  label: "Peito de frango grelhado", per100: { carb: 0, prot: 31, fat: 3.6, kcal: 165 } },
    { key: "patinho", label: "Carne bovina magra (patinho)", per100: { carb: 0, prot: 30, fat: 7, kcal: 190 } },
    { key: "ovo",     label: "Ovo inteiro",              per100: { carb: 1.1, prot: 13, fat: 11, kcal: 155 } },
    { key: "whey",    label: "Whey protein (pó)",        per100: { carb: 8, prot: 80, fat: 6, kcal: 400 } },
    { key: "tilapia", label: "Tilápia grelhada",         per100: { carb: 0, prot: 26, fat: 2.7, kcal: 128 } },
    { key: "atum",    label: "Atum (lata, em água)",     per100: { carb: 0, prot: 26, fat: 1, kcal: 116 } },
  ],
  fat: [
    { key: "azeite",   label: "Azeite de oliva",       per100: { carb: 0, prot: 0, fat: 100, kcal: 884 } },
    { key: "abacate",  label: "Abacate",               per100: { carb: 9, prot: 2, fat: 15, kcal: 160 } },
    { key: "castanha", label: "Castanhas (mix)",       per100: { carb: 12, prot: 14, fat: 66, kcal: 656 } },
    { key: "pastaamendoim", label: "Pasta de amendoim", per100: { carb: 20, prot: 25, fat: 50, kcal: 588 } },
  ],
};
/* gramas do alimento p/ bater um alvo de macro = (alvo / macro por 100g) × 100 */
function gramsForMacro(food, macroKey, targetGrams) {
  const per = food.per100[macroKey];
  if (!per) return null;
  return Math.round((targetGrams / per) * 100);
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */
function toISO(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}
function startOfWeek(d) {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function isInRange(dateISO, startISO, endISO) {
  const e = endISO || startISO;
  return dateISO >= startISO && dateISO <= e;
}
function fmtDM(iso) {
  const d = fromISO(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function daysUntil(iso) {
  const today = fromISO(toISO(new Date()));
  const target = fromISO(iso);
  return Math.round((target - today) / 86400000);
}
function getPeriodRange(period) {
  const now = new Date();
  if (period === "semana") {
    const s = startOfWeek(now);
    return [toISO(s), toISO(addDays(s, 6))];
  }
  if (period === "ano") {
    return [`${now.getFullYear()}-01-01`, `${now.getFullYear()}-12-31`];
  }
  const s = startOfMonth(now);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [toISO(s), toISO(e)];
}
function dowOf(iso) {
  // Monday = 0 ... Sunday = 6, matching WEEKDAY_LABELS order
  return (fromISO(iso).getDay() + 6) % 7;
}

/* ------------------------------------------------------------------ */
/*  Occurrence engine (handles recurring + single/block cards)          */
/* ------------------------------------------------------------------ */
function getOccurrencesForDate(cards, completions, iso) {
  const dow = dowOf(iso);
  const out = [];
  for (const c of cards) {
    const hasRecurrence = c.recurrence && c.recurrence.days && c.recurrence.days.length > 0;
    if (hasRecurrence) {
      const withinStart = iso >= c.date;
      const withinUntil = !c.recurrence.until || iso <= c.recurrence.until;
      if (c.recurrence.days.includes(dow) && withinStart && withinUntil) {
        const comp = completions.find((x) => x.cardId === c.id && x.date === iso);
        out.push({
          occId: `${c.id}__${iso}`,
          cardId: c.id,
          date: iso,
          cardDate: c.date,
          time: c.time,
          title: c.title,
          type: c.type,
          endDate: c.endDate || "",
          recurrence: c.recurrence,
          isRecurring: true,
          status: comp ? comp.status : "pendente",
          feedback: comp ? comp.feedback : null,
        });
      }
    } else {
      if (isInRange(iso, c.date, c.endDate)) {
        out.push({
          occId: `${c.id}__${iso}`,
          cardId: c.id,
          date: iso,
          cardDate: c.date,
          time: c.time,
          title: c.title,
          type: c.type,
          endDate: c.endDate || "",
          recurrence: null,
          isRecurring: false,
          status: c.status,
          feedback: c.feedback,
        });
      }
    }
  }
  return out.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}
function occurrencesInRange(cards, completions, startISO, endISO) {
  const out = [];
  let d = fromISO(startISO);
  while (toISO(d) <= endISO) {
    out.push(...getOccurrencesForDate(cards, completions, toISO(d)));
    d = addDays(d, 1);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Streak engine — the "10X" of the board: daily compounding           */
/* ------------------------------------------------------------------ */
function getActiveDatesSet(cards, completions, checkins) {
  const set = new Set();
  cards.forEach((c) => {
    if (!(c.recurrence && c.recurrence.days?.length) && c.status === "concluido") set.add(c.date);
  });
  completions.forEach((comp) => { if (comp.status === "concluido") set.add(comp.date); });
  checkins.forEach((ci) => set.add(ci.date));
  return set;
}
function computeStreaks(activeSet) {
  const dates = Array.from(activeSet).sort();
  let best = 0, run = 0, prev = null;
  for (const iso of dates) {
    if (prev && toISO(addDays(fromISO(prev), 1)) === iso) run++; else run = 1;
    best = Math.max(best, run);
    prev = iso;
  }
  let cursor = toISO(new Date());
  if (!activeSet.has(cursor)) cursor = toISO(addDays(new Date(), -1));
  let current = 0;
  while (activeSet.has(cursor)) {
    current++;
    cursor = toISO(addDays(fromISO(cursor), -1));
  }
  return { current, best };
}

/* ------------------------------------------------------------------ */
/*  Insight engine — simple correlations to flag before injury          */
/* ------------------------------------------------------------------ */
function generateInsights(cards, completions, checkins, jumps) {
  const insights = [];

  const sortedCk = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  if (sortedCk.length >= 3) {
    const last3 = sortedCk.slice(-3);
    const consecutive =
      toISO(addDays(fromISO(last3[0].date), 1)) === last3[1].date &&
      toISO(addDays(fromISO(last3[1].date), 1)) === last3[2].date;
    if (consecutive && last3[0].recovery > last3[1].recovery && last3[1].recovery > last3[2].recovery) {
      insights.push({
        level: "warning",
        text: `Sua recuperação caiu 3 dias seguidos (${last3[0].recovery} → ${last3[1].recovery} → ${last3[2].recovery}). Talvez valha um dia mais leve ou uma noite de sono melhor.`,
      });
    }
  }

  const sortedJ = [...jumps].sort((a, b) => a.date.localeCompare(b.date));
  if (sortedJ.length >= 3) {
    const last = sortedJ[sortedJ.length - 1];
    const prevOnes = sortedJ.slice(-4, -1);
    if (prevOnes.length) {
      const avgPrev = prevOnes.reduce((a, j) => a + j.height, 0) / prevOnes.length;
      if (avgPrev > 0 && last.height < avgPrev * 0.93) {
        insights.push({
          level: "warning",
          text: `Seu salto vertical caiu (${last.height}cm vs média recente de ${avgPrev.toFixed(1)}cm). Pode ser fadiga acumulada — fica de olho na recuperação nos próximos dias.`,
        });
      }
    }
  }

  const [ws, we] = getPeriodRange("semana");
  const occs = occurrencesInRange(cards, completions, ws, we);
  const today = toISO(new Date());
  const pastOccs = occs.filter((o) => o.date <= today);
  if (pastOccs.length >= 3) {
    const pct = Math.round((pastOccs.filter((o) => o.status === "concluido").length / pastOccs.length) * 100);
    if (pct < 50) {
      insights.push({
        level: "info",
        text: `${pct}% dos treinos concluídos essa semana até agora. Ainda dá tempo de recuperar.`,
      });
    }
  }

  return insights;
}

/* ------------------------------------------------------------------ */
/*  Storage                                                             */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "tenx-board-data";
async function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { cards: [], goals: [], checkins: [], completions: [], jumps: [], hydration: [], weight: null, nutrition: null, tasks: [], theme: "auto" };
}
async function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar:", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Small UI atoms                                                      */
/* ------------------------------------------------------------------ */
function Pill({ active, children, onClick, small }) {
  const C = useC();
  return (
    <button
      onClick={onClick}
      className={`transition-colors shrink-0 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} rounded-full font-bold uppercase tracking-wide`}
      style={{
        background: active ? C.pink : "transparent",
        color: active ? "#fff" : C.muted,
        border: `1.5px solid ${active ? C.pink : C.line}`,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </button>
  );
}

function TypeBadge({ type }) {
  const t = typeInfo(type);
  return (
    <span
      className="px-3 py-1 rounded-full text-[11px] font-bold uppercase inline-block"
      style={{
        background: t.fill ? "#FF1B7A" : "rgba(255,255,255,0.06)",
        color: "#fff",
        letterSpacing: "0.06em",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}
    >
      {t.label}
    </span>
  );
}

function Modal({ onClose, children, title }) {
  const C = useC();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] overflow-y-auto"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-2xl font-black uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}
          >
            {title}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: C.surface2 }}>
            <X size={18} color={C.muted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  const C = useC();
  return (
    <div className="mb-4">
      <label
        className="block text-xs font-bold uppercase mb-1.5"
        style={{ color: C.muted, letterSpacing: "0.05em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                  */
/* ------------------------------------------------------------------ */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [goals, setGoals] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [jumps, setJumps] = useState([]);
  const [hydration, setHydration] = useState([]);
  const [weight, setWeight] = useState(null);
  const [nutrition, setNutrition] = useState(null); // perfil do gerador de plano alimentar
  const [tasks, setTasks] = useState([]);
  const [themePref, setThemePref] = useState("auto");
  const [tab, setTab] = useState("hoje");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [monthCursor, setMonthCursor] = useState(startOfMonth(new Date()));
  const [burst, setBurst] = useState(false);

  const [showAddCard, setShowAddCard] = useState(false);
  const [activeCard, setActiveCard] = useState(null); // occurrence object (or new-card draft)
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await loadData();
      setCards(data.cards || []);
      setGoals(data.goals || []);
      setCheckins(data.checkins || []);
      setCompletions(data.completions || []);
      setJumps(data.jumps || []);
      setHydration(data.hydration || []);
      setWeight(data.weight ?? null);
      setNutrition(data.nutrition ?? null);
      setTasks(data.tasks || []);
      setThemePref(data.theme || "auto");
      setLoading(false);
    })();
  }, []);

  const C = THEME;

  // Sincroniza o fundo do body/html e a cor da barra de status com o tema.
  useEffect(() => {
    document.body.style.background = C.bg;
    document.documentElement.style.background = C.bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", C.bg);
  }, [C.bg]);

  const persist = useCallback((partial) => {
    saveData({
      cards: partial.cards !== undefined ? partial.cards : cards,
      goals: partial.goals !== undefined ? partial.goals : goals,
      checkins: partial.checkins !== undefined ? partial.checkins : checkins,
      completions: partial.completions !== undefined ? partial.completions : completions,
      jumps: partial.jumps !== undefined ? partial.jumps : jumps,
      hydration: partial.hydration !== undefined ? partial.hydration : hydration,
      weight: partial.weight !== undefined ? partial.weight : weight,
      nutrition: partial.nutrition !== undefined ? partial.nutrition : nutrition,
      tasks: partial.tasks !== undefined ? partial.tasks : tasks,
      theme: partial.theme !== undefined ? partial.theme : themePref,
    });
  }, [cards, goals, checkins, completions, jumps, hydration, weight, nutrition, tasks, themePref]);

  function updateTasks(updater) {
    setTasks((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ tasks: next });
      return next;
    });
  }
  function updateCards(updater) {
    setCards((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ cards: next });
      return next;
    });
  }
  function updateGoals(updater) {
    setGoals((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ goals: next });
      return next;
    });
  }
  function updateCheckins(updater) {
    setCheckins((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ checkins: next });
      return next;
    });
  }
  function updateCompletions(updater) {
    setCompletions((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ completions: next });
      return next;
    });
  }
  function updateJumps(updater) {
    setJumps((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ jumps: next });
      return next;
    });
  }
  function updateHydration(updater) {
    setHydration((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist({ hydration: next });
      return next;
    });
  }
  function updateWeight(next) {
    setWeight(next);
    persist({ weight: next });
  }
  function updateNutrition(next) {
    setNutrition(next);
    persist({ nutrition: next });
  }
  function updateTheme(next) {
    setThemePref(next);
    persist({ theme: next });
  }

  function triggerBurst() {
    setBurst(true);
    setTimeout(() => setBurst(false), 950);
  }

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toISO(addDays(weekStart, i))),
    [weekStart]
  );
  const cardsForDate = useCallback(
    (iso) => getOccurrencesForDate(cards, completions, iso),
    [cards, completions]
  );

  const recentVictories = useMemo(() => {
    const nonRec = cards
      .filter((c) => !(c.recurrence && c.recurrence.days?.length) && c.status === "concluido" && c.feedback?.vitoria)
      .map((c) => ({ key: `${c.id}_v`, date: c.date, title: c.title, feedback: c.feedback }));
    const rec = completions
      .filter((comp) => comp.status === "concluido" && comp.feedback?.vitoria)
      .map((comp) => {
        const card = cards.find((c) => c.id === comp.cardId);
        return card ? { key: `${comp.cardId}_${comp.date}`, date: comp.date, title: card.title, feedback: comp.feedback } : null;
      })
      .filter(Boolean);
    return [...nonRec, ...rec].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [cards, completions]);

  const activeSet = useMemo(() => getActiveDatesSet(cards, completions, checkins), [cards, completions, checkins]);
  const streaks = useMemo(() => computeStreaks(activeSet), [activeSet]);
  const insights = useMemo(() => generateInsights(cards, completions, checkins, jumps), [cards, completions, checkins, jumps]);

  function openNewCard(dateISO) {
    setActiveCard({
      __new: true, date: dateISO, time: "16:00", title: "", type: "forca", endDate: "",
      recurrence: { type: "none", days: [], until: "" },
    });
    setShowAddCard(true);
  }
  function openEditCard(occ) {
    setActiveCard({
      id: occ.cardId,
      date: occ.cardDate,
      time: occ.time,
      title: occ.title,
      type: occ.type,
      endDate: occ.endDate,
      recurrence: occ.recurrence || { type: "none", days: [], until: "" },
    });
    setShowAddCard(true);
  }
  function saveCard(draft) {
    const recurrence = draft.recurrence && draft.recurrence.type !== "none"
      ? { type: draft.recurrence.type, days: draft.recurrence.days || [], until: draft.recurrence.until || "" }
      : null;
    if (draft.__new) {
      const newCard = {
        id: `c_${Date.now()}`, title: draft.title, type: draft.type, time: draft.time,
        date: draft.date, endDate: recurrence ? "" : (draft.endDate || ""),
        recurrence, status: "pendente", feedback: null,
      };
      updateCards((prev) => [...prev, newCard]);
    } else {
      updateCards((prev) => prev.map((c) => (c.id === draft.id
        ? { ...c, title: draft.title, type: draft.type, time: draft.time, date: draft.date, endDate: recurrence ? "" : (draft.endDate || ""), recurrence }
        : c)));
    }
    setShowAddCard(false);
    setActiveCard(null);
  }
  function deleteCard(cardId) {
    updateCards((prev) => prev.filter((c) => c.id !== cardId));
    updateCompletions((prev) => prev.filter((c) => c.cardId !== cardId));
    setActiveCard(null);
  }
  function saveFeedbackOccurrence(occ, feedback) {
    let wasFirstTime = false;
    if (occ.isRecurring) {
      updateCompletions((prev) => {
        const exists = prev.find((c) => c.cardId === occ.cardId && c.date === occ.date);
        if (!exists || exists.status !== "concluido") wasFirstTime = true;
        const entry = { cardId: occ.cardId, date: occ.date, status: "concluido", feedback };
        if (exists) return prev.map((c) => (c === exists ? entry : c));
        return [...prev, entry];
      });
    } else {
      updateCards((prev) => prev.map((c) => {
        if (c.id !== occ.cardId) return c;
        if (c.status !== "concluido") wasFirstTime = true;
        return { ...c, status: "concluido", feedback };
      }));
    }
    if (wasFirstTime) triggerBurst();
    setShowFeedback(false);
    setActiveCard(null);
  }
  function quickToggleOccurrence(occ) {
    if (occ.isRecurring) {
      if (occ.status === "concluido") {
        updateCompletions((prev) => prev.filter((c) => !(c.cardId === occ.cardId && c.date === occ.date)));
      } else {
        updateCompletions((prev) => {
          const exists = prev.find((c) => c.cardId === occ.cardId && c.date === occ.date);
          const entry = { cardId: occ.cardId, date: occ.date, status: "concluido", feedback: occ.feedback || { cansaco: null, bem: "", ruim: "", melhorar: "", vitoria: "" } };
          if (exists) return prev.map((c) => (c === exists ? entry : c));
          return [...prev, entry];
        });
        triggerBurst();
      }
    } else {
      if (occ.status === "concluido") {
        updateCards((prev) => prev.map((c) => (c.id === occ.cardId ? { ...c, status: "pendente" } : c)));
      } else {
        updateCards((prev) => prev.map((c) => (c.id === occ.cardId
          ? { ...c, status: "concluido", feedback: c.feedback || { cansaco: null, bem: "", ruim: "", melhorar: "", vitoria: "" } }
          : c)));
        triggerBurst();
      }
    }
  }

  function saveGoal(goalDraft) {
    if (goalDraft.__new) {
      const { __new, ...rest } = goalDraft;
      const newGoal = { ...rest, id: `g_${Date.now()}`, current: 0, done: false, note: "" };
      updateGoals((prev) => [...prev, newGoal]);
    } else {
      updateGoals((prev) => prev.map((g) => (g.id === goalDraft.id ? goalDraft : g)));
    }
    setShowAddGoal(false);
    setActiveGoal(null);
  }
  function deleteGoal(id) {
    updateGoals((prev) => prev.filter((g) => g.id !== id));
    setActiveGoal(null);
  }
  function saveCheckin(entry) {
    updateCheckins((prev) => {
      const exists = prev.find((c) => c.date === entry.date);
      if (exists) return prev.map((c) => (c.date === entry.date ? entry : c));
      return [...prev, entry];
    });
  }
  function saveJump(entry) {
    updateJumps((prev) => {
      const exists = prev.find((j) => j.date === entry.date);
      if (exists) return prev.map((j) => (j.date === entry.date ? entry : j));
      return [...prev, entry];
    });
  }
  function addHydration(entry) {
    updateHydration((prev) => [...prev, { id: `h_${Date.now()}`, ...entry }]);
  }
  function deleteHydration(id) {
    updateHydration((prev) => prev.filter((h) => h.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: DARK.bg }}>
        <p style={{ color: DARK.muted }} className="font-bold">Carregando…</p>
      </div>
    );
  }

  return (
    <ColorContext.Provider value={C}>
      <div
        className="min-h-screen w-full pb-28 transition-colors relative"
        style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { display: none; }
          @keyframes burstRing {
            0% { transform: scale(0.2); opacity: 0; }
            35% { transform: scale(1.08); opacity: 1; }
            60% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
          }
          @keyframes burstCheck {
            0% { transform: scale(0) rotate(-20deg); opacity: 0; }
            45% { transform: scale(1.25) rotate(4deg); opacity: 1; }
            65% { transform: scale(1) rotate(0deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 0; }
          }
          @keyframes burstText {
            0% { opacity: 0; transform: translateY(6px); }
            30% { opacity: 1; transform: translateY(0); }
            75% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes flamePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.12); }
          }
          .burst-ring { animation: burstRing 950ms ease-out forwards; }
          .burst-check { animation: burstCheck 950ms ease-out forwards; }
          .burst-text { animation: burstText 950ms ease-out forwards; }
          .flame-pulse { animation: flamePulse 1.6s ease-in-out infinite; }
        `}</style>

        {burst && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center">
              <div
                className="burst-ring w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: C.pink, boxShadow: `0 0 60px ${C.pink}` }}
              >
                <CheckCircle2 className="burst-check" size={56} color="#fff" strokeWidth={2.2} />
              </div>
              <span
                className="burst-text mt-3 font-black text-lg uppercase px-4 py-1.5 rounded-full"
                style={{ background: C.surface, color: C.pink, fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Treino concluído!
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: C.pink }} />
              <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.15em" }}>
                Diário de treino
              </span>
            </div>
            <h1
              className="text-4xl font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}
            >
              10X BOARD<span style={{ color: C.pink }}>.</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StreakBadge current={streaks.current} />
          </div>
        </div>

        {tab === "hoje" && (
          <HojeView
            cards={cards} completions={completions}
            hydration={hydration} weight={weight} onAddHydration={addHydration}
            onOpenCard={(occ) => setActiveCard(occ)}
            onAddToday={() => openNewCard(toISO(new Date()))}
            goToDay={(iso) => { setSelectedDate(iso); setWeekStart(startOfWeek(fromISO(iso))); setTab("semana"); }}
          />
        )}

        {tab === "semana" && (
          <WeekView
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            weekDays={weekDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            cardsForDate={cardsForDate}
            recentVictories={recentVictories}
            streaks={streaks}
            onOpenCard={(occ) => setActiveCard(occ)}
            onAddCard={() => openNewCard(selectedDate)}
            onQuickToggle={quickToggleOccurrence}
          />
        )}

        {tab === "mes" && (
          <MonthView
            monthCursor={monthCursor}
            setMonthCursor={setMonthCursor}
            cards={cards}
            completions={completions}
            selectedDate={selectedDate}
            setSelectedDate={(iso) => {
              setSelectedDate(iso);
              setTab("semana");
              setWeekStart(startOfWeek(fromISO(iso)));
            }}
          />
        )}

        {tab === "painel" && (
          <PainelView
            cards={cards} completions={completions}
            checkins={checkins} onSaveCheckin={saveCheckin}
            jumps={jumps} onSaveJump={saveJump}
            insights={insights}
          />
        )}

        {tab === "nutricao" && (
          <NutricaoView
            hydration={hydration} weight={weight}
            onAddHydration={addHydration} onDeleteHydration={deleteHydration}
            onSaveWeight={updateWeight}
            nutrition={nutrition} onSaveNutrition={updateNutrition}
            cards={cards} completions={completions}
          />
        )}

        {tab === "metas" && (
          <GoalsView
            goals={goals}
            onOpen={(g) => setActiveGoal(g)}
            onQuickAdd={(id, delta) =>
              updateGoals((prev) =>
                prev.map((g) =>
                  g.id === id
                    ? { ...g, current: Math.max(0, Math.min((g.target || Infinity), (g.current || 0) + delta)) }
                    : g
                )
              )
            }
          />
        )}

        {tab === "tarefas" && (
          <TarefasView tasks={tasks} onUpdate={updateTasks} />
        )}

        {(tab === "semana" || tab === "metas") && (
          <button
            onClick={() => (tab === "semana" ? openNewCard(selectedDate) : setShowAddGoal(true))}
            className="fixed right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
            style={{ bottom: "88px", background: C.pink, boxShadow: `0 8px 24px ${C.pinkSoft}` }}
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </button>
        )}

        <BottomNav tab={tab} setTab={setTab} />

        {activeCard && !showAddCard && !showFeedback && (
          <CardDetailModal
            card={activeCard}
            onClose={() => setActiveCard(null)}
            onEdit={() => openEditCard(activeCard)}
            onDelete={() => deleteCard(activeCard.cardId)}
            onStartFeedback={() => setShowFeedback(true)}
          />
        )}

        {showAddCard && activeCard && (
          <CardFormModal
            card={activeCard}
            onClose={() => {
              setShowAddCard(false);
              setActiveCard(null);
            }}
            onSave={saveCard}
          />
        )}

        {showFeedback && activeCard && (
          <FeedbackModal
            card={activeCard}
            onClose={() => setShowFeedback(false)}
            onSave={(fb) => saveFeedbackOccurrence(activeCard, fb)}
          />
        )}

        {showAddGoal && (
          <GoalFormModal
            goal={{ __new: true, title: "", target: "", unit: "", deadline: toISO(new Date()) }}
            onClose={() => setShowAddGoal(false)}
            onSave={saveGoal}
          />
        )}

        {activeGoal && !showAddGoal && (
          <GoalDetailModal
            goal={activeGoal}
            onClose={() => setActiveGoal(null)}
            onDelete={() => deleteGoal(activeGoal.id)}
            onSave={(g) => {
              updateGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)));
              setActiveGoal(null);
            }}
          />
        )}
      </div>
    </ColorContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Theme switch                                                        */
/* ------------------------------------------------------------------ */
function ThemeSwitch({ value, onChange }) {
  const C = useC();
  const opts = [
    { key: "light", icon: Sun },
    { key: "auto", icon: MonitorSmartphone },
    { key: "dark", icon: Moon },
  ];
  return (
    <div className="flex rounded-full p-1 gap-0.5" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
      {opts.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: value === key ? C.pink : "transparent" }}
        >
          <Icon size={14} color={value === key ? "#fff" : C.muted} />
        </button>
      ))}
    </div>
  );
}

function StreakBadge({ current }) {
  const C = useC();
  const active = current > 0;
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full"
      style={{ background: active ? C.pinkSoft : C.surface2, border: `1px solid ${active ? C.pinkDark : C.line}` }}
    >
      <Flame size={13} color={active ? C.pink : C.muted} className={active ? "flame-pulse" : ""} />
      <span className="text-xs font-black" style={{ color: active ? C.pink : C.muted, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {current}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared building blocks (design base: GDA)                           */
/* ------------------------------------------------------------------ */
function SectionHeader({ eyebrow, title }) {
  const C = useC();
  return (
    <div className="pt-1 pb-4">
      <p className="text-[11px] font-bold uppercase mb-0.5" style={{ color: C.pink, letterSpacing: "0.14em" }}>
        {eyebrow}
      </p>
      <h2 className="text-4xl font-black leading-none uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
        {title}
      </h2>
    </div>
  );
}

/* Caixa de destaque em azul — usada com parcimônia (dicas / observações) */
function InfoNote({ children, title }) {
  const C = useC();
  return (
    <div className="rounded-3xl p-4 mb-5" style={{ background: C.blueSoft, borderLeft: `3px solid ${C.blue}` }}>
      {title && (
        <p className="text-[11px] font-bold uppercase mb-1" style={{ color: C.blue, letterSpacing: "0.08em" }}>
          {title}
        </p>
      )}
      <p className="text-sm leading-snug" style={{ color: C.blue }}>{children}</p>
    </div>
  );
}

/* Citação de mentalidade — borda rosa à esquerda, itálico maiúsculo */
function QuoteBlock() {
  const C = useC();
  const q = quoteOfTheDay();
  return (
    <div className="mb-5" style={{ borderLeft: `3px solid ${C.pink}`, paddingLeft: 14 }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Quote size={12} color={C.pink} />
        <span className="text-[10px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.14em" }}>
          Mentalidade
        </span>
      </div>
      <p className="text-sm leading-snug" style={{ color: C.text, fontStyle: "italic", textTransform: "uppercase" }}>
        “{q.text}”
      </p>
      <p className="text-xs font-black uppercase mt-2" style={{ color: C.pink, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
        {q.author}
      </p>
    </div>
  );
}

/* Barra de navegação inferior (posicionamento em CSS inline p/ robustez) */
function BottomNav({ tab, setTab }) {
  const C = useC();
  const items = [
    { key: "hoje", label: "Hoje", icon: Home },
    { key: "semana", label: "Semana", icon: CalendarIcon },
    { key: "mes", label: "Mês", icon: CalendarDays },
    { key: "painel", label: "Painel", icon: BarChart3 },
    { key: "nutricao", label: "Nutrição", icon: Apple },
    { key: "metas", label: "Metas", icon: Target },
    { key: "tarefas", label: "Tarefas", icon: ListChecks },
  ];
  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, display: "flex",
        background: C.surface, borderTop: `1px solid ${C.line}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, padding: "9px 0 10px", background: "transparent", minWidth: 0,
            }}
          >
            <Icon size={19} color={active ? C.pink : C.muted} strokeWidth={active ? 2.5 : 2} />
            <span
              className="uppercase"
              style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: "0.02em",
                color: active ? C.pink : C.muted, fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tarefas View — lista simples estilo Notion                          */
/* ------------------------------------------------------------------ */
function TarefasView({ tasks, onUpdate }) {
  const C = useC();
  const [text, setText] = useState("");
  const [showDone, setShowDone] = useState(false);
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };

  function add() {
    const v = text.trim();
    if (!v) return;
    onUpdate((prev) => [{ id: `t_${Date.now()}`, text: v, done: false }, ...prev]);
    setText("");
  }
  const toggle = (id) => onUpdate((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => onUpdate((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="px-5">
      <SectionHeader eyebrow="Organização" title="TAREFAS" />

      <div className="flex gap-2 mb-5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Adicionar tarefa…"
          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
          style={inputStyle}
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          className="w-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: text.trim() ? C.pink : C.line }}
          aria-label="Adicionar tarefa"
        >
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      {active.length === 0 && done.length === 0 && (
        <div className="rounded-3xl p-6 text-center" style={{ background: C.surface, border: `1px dashed ${C.line}` }}>
          <p className="text-sm" style={{ color: C.muted }}>Nenhuma tarefa ainda. Escreve a primeira aí em cima.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {active.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={() => toggle(t.id)} onDelete={() => remove(t.id)} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowDone((s) => !s)} className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
              Concluídas · {done.length}
            </span>
            <ChevronRight size={16} color={C.muted} style={{ transform: showDone ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showDone && (
            <div className="flex flex-col gap-2">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={() => toggle(t.id)} onDelete={() => remove(t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const C = useC();
  const done = task.done;
  return (
    <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <button
        onClick={onToggle}
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{ background: done ? C.pink : "transparent", border: `2px solid ${done ? C.pink : C.line}` }}
        aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
      >
        {done && <Check size={15} color="#fff" strokeWidth={3} />}
      </button>
      <span className="flex-1 text-sm min-w-0 break-words" style={{ color: done ? C.muted : C.text, textDecoration: done ? "line-through" : "none" }}>
        {task.text}
      </span>
      <button onClick={onDelete} className="shrink-0 p-1.5 rounded-lg" aria-label="Excluir tarefa">
        <Trash2 size={15} color={C.muted} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hoje View — dashboard do dia (frase, treino, água, semana, próximos) */
/* ------------------------------------------------------------------ */
function HojeView({ cards, completions, hydration, weight, onAddHydration, onOpenCard, onAddToday, goToDay }) {
  const C = useC();
  const now = new Date();
  const today = toISO(now);
  const phrase = phraseOfDay();

  const todays = getOccurrencesForDate(cards, completions, today);
  // Treino principal: o primeiro pendente; se todos concluídos, o primeiro.
  const mainTraining = todays.find((o) => o.status !== "concluido") || todays[0] || null;

  // Próximos 2 eventos futuros (a partir de amanhã, varrendo até 3 semanas).
  const upcoming = [];
  for (let i = 1; i <= 21 && upcoming.length < 2; i++) {
    const iso = toISO(addDays(now, i));
    for (const o of getOccurrencesForDate(cards, completions, iso)) {
      if (upcoming.length < 2) upcoming.push(o);
    }
  }

  // Tira semanal (semana atual).
  const wkStart = startOfWeek(now);
  const week = Array.from({ length: 7 }, (_, i) => {
    const iso = toISO(addDays(wkStart, i));
    const occ = getOccurrencesForDate(cards, completions, iso);
    const anyDone = occ.some((o) => o.status === "concluido");
    return { iso, i, has: occ.length > 0, anyDone, isToday: iso === today };
  });

  // Hidratação de hoje (reusa o mesmo store de hidratação da aba Nutrição).
  const goal = weight > 0 ? Math.round(weight * 35) : 2500;
  const drank = hydration.filter((h) => h.date === today).reduce((a, h) => a + effectiveWater(h), 0);
  const pct = Math.min(100, Math.round((drank / goal) * 100));
  const hour = now.getHours();
  // Aviso sutil quando está atrás do esperado pra hora do dia.
  const behind = (hour >= 12 && pct < 30) || (hour >= 18 && pct < 70);
  const weekdayFull = now.toLocaleDateString("pt-BR", { weekday: "long" });

  return (
    <div className="px-5">
      {/* a) Frase do dia */}
      <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.pink}` }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={12} color={C.pink} />
          <span className="text-[10px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.14em" }}>Frase do dia</span>
        </div>
        <p className="text-base font-bold leading-snug" style={{ color: C.text }}>{phrase}</p>
      </div>

      {/* b) Treino de hoje */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.1em" }}>Treino de hoje</span>
      </div>
      {mainTraining ? (
        <TodayTrainingCard occ={mainTraining} count={todays.length} weekday={weekdayFull} onOpen={() => onOpenCard(mainTraining)} onSeeAll={() => goToDay(today)} />
      ) : (
        <div className="rounded-3xl p-6 mb-5 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <Moon size={26} color={C.muted} className="mx-auto mb-2" />
          <p className="text-xl font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>Dia de descanso</p>
          <p className="text-sm mt-1 mb-3" style={{ color: C.muted }}>Nenhum treino marcado pra hoje. Descanso também constrói.</p>
          <button onClick={onAddToday} className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: C.pink }}>
            <Plus size={15} /> Adicionar treino de hoje
          </button>
        </div>
      )}

      {/* c) Hidratação */}
      <HydrationReminder
        goal={goal} drank={drank} pct={pct} behind={behind} noWeight={!(weight > 0)}
        onAdd={(ml) => onAddHydration({ date: today, type: "agua", amount: ml })}
      />

      {/* d) Tira semanal */}
      <div className="flex items-center gap-1.5 mb-2 mt-6">
        <span className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.1em" }}>Sua semana</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {week.map((d) => (
          <button key={d.iso} onClick={() => goToDay(d.iso)} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold" style={{ color: d.isToday ? C.pink : C.muted }}>{WEEKDAY_LABELS[d.i]}</span>
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: d.anyDone ? C.pink : "transparent", border: `2px solid ${d.anyDone ? C.pink : d.isToday ? C.pink : d.has ? C.muted : C.line}` }}
            >
              {d.anyDone ? (
                <Check size={15} color="#fff" strokeWidth={3} />
              ) : (
                <span className="text-xs font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: d.isToday ? C.pink : C.text }}>{fromISO(d.iso).getDate()}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* e) Próximos dias */}
      {upcoming.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.1em" }}>Próximos dias</span>
          </div>
          <div className="flex flex-col gap-2">
            {upcoming.map((o) => (
              <button key={o.occId} onClick={() => goToDay(o.date)} className="rounded-2xl p-3.5 flex items-center gap-3 text-left" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
                <div className="shrink-0 w-11 text-center">
                  <p className="text-[10px] font-bold uppercase" style={{ color: C.muted }}>{WEEKDAY_LABELS[dowOf(o.date)]}</p>
                  <p className="text-lg font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>{fromISO(o.date).getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1"><TypeBadge type={o.type} /></div>
                  <p className="font-bold text-sm truncate" style={{ color: C.text }}>{o.title || "Treino"}</p>
                </div>
                <ChevronRight size={16} color={C.muted} className="shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TodayTrainingCard({ occ, count, weekday, onOpen, onSeeAll }) {
  const C = useC();
  const done = occ.status === "concluido";
  return (
    <div className="rounded-3xl p-5 mb-5" style={{ background: C.surface, border: `1.5px solid ${done ? C.pink : C.line}` }}>
      <p className="text-[11px] font-bold uppercase mb-1" style={{ color: C.pink, letterSpacing: "0.1em" }}>{weekday}</p>
      <h2 className="text-3xl font-black uppercase leading-none mb-2.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>{occ.title || "Treino"}</h2>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <TypeBadge type={occ.type} />
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase" style={{ background: done ? C.pink : "transparent", color: done ? "#fff" : C.muted, border: `1px solid ${done ? C.pink : C.line}`, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {done ? "Concluído" : "Pendente"}
        </span>
        {occ.time && <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: C.muted }}><Clock size={12} /> {occ.time}</span>}
      </div>
      <button onClick={onOpen} className="w-full py-3 rounded-2xl font-black uppercase flex items-center justify-center gap-1.5 text-white" style={{ background: C.pink, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
        Ver treino <ChevronRight size={18} strokeWidth={2.5} />
      </button>
      {count > 1 && (
        <button onClick={onSeeAll} className="w-full text-center text-[11px] font-bold mt-2.5" style={{ color: C.muted }}>
          +{count - 1} treino{count - 1 > 1 ? "s" : ""} hoje · ver todos
        </button>
      )}
    </div>
  );
}

function HydrationReminder({ goal, drank, pct, behind, noWeight, onAdd }) {
  const C = useC();
  return (
    <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Droplet size={15} color={WATER_BLUE} />
          <span className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.08em" }}>Hidratação de hoje</span>
        </div>
        <span className="text-sm font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
          {drank}<span style={{ color: C.muted }}> / {goal} ml</span>
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: C.surface2 }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: WATER_BLUE, transition: "width .3s" }} />
      </div>
      {behind && (
        <div className="flex items-start gap-2 rounded-2xl p-3 mb-3" style={{ background: "rgba(79,143,247,0.10)", border: `1px solid ${WATER_BLUE}` }}>
          <Droplet size={15} color={WATER_BLUE} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-snug" style={{ color: C.text }}>Beba água! Você está atrasado na meta de hoje.</p>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onAdd(250)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.line}` }}>+250 ml</button>
        <button onClick={() => onAdd(500)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.line}` }}>+500 ml</button>
      </div>
      {noWeight && <p className="text-[10px] mt-2" style={{ color: C.muted }}>Meta padrão de 2500 ml. Defina seu peso na aba Nutrição pra personalizar (~35 ml/kg).</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Week View                                                           */
/* ------------------------------------------------------------------ */
function WeekView({ weekStart, setWeekStart, weekDays, selectedDate, setSelectedDate, cardsForDate, recentVictories, streaks, onOpenCard, onAddCard, onQuickToggle }) {
  const C = useC();
  const today = toISO(new Date());
  return (
    <div className="px-5">
      <QuoteBlock />
      <StreakCard streaks={streaks} />

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-full" style={{ background: C.surface2 }}>
          <ChevronLeft size={18} color={C.text} />
        </button>
        <span className="text-sm font-bold" style={{ color: C.muted }}>
          {fmtDM(toISO(weekDays[0]))} – {fmtDM(toISO(weekDays[6]))}
        </span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-full" style={{ background: C.surface2 }}>
          <ChevronRight size={18} color={C.text} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {weekDays.map((iso, i) => {
          const has = cardsForDate(iso).length > 0;
          const isSel = iso === selectedDate;
          const isToday = iso === today;
          const d = fromISO(iso);
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className="rounded-2xl py-3 flex flex-col items-center gap-1.5"
              style={{
                background: isSel ? C.pink : C.surface2,
                border: `1.5px solid ${isSel ? C.pink : isToday ? C.pinkDark : "transparent"}`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: isSel ? "#fff" : C.muted }}>
                {WEEKDAY_LABELS[i]}
              </span>
              <span className="text-lg font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isSel ? "#fff" : C.text }}>
                {d.getDate()}
              </span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: has ? (isSel ? "#fff" : C.pink) : "transparent" }} />
            </button>
          );
        })}
      </div>

      {recentVictories.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy size={14} color={C.pink} />
            <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
              Últimas vitórias
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentVictories.map((c) => (
              <div
                key={c.key}
                className="shrink-0 max-w-[220px] rounded-xl px-3 py-2"
                style={{ background: C.pinkSoft, border: `1px solid ${C.pinkDark}` }}
              >
                <p className="text-[10px] font-bold mb-0.5" style={{ color: C.pink }}>{fmtDM(c.date)} · {c.title}</p>
                <p className="text-xs leading-snug" style={{ color: C.text }}>{c.feedback.vitoria}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
          {fromISO(selectedDate).toLocaleDateString("pt-BR", { weekday: "long" })}
        </span>
        <button onClick={onAddCard} className="flex items-center gap-1 text-xs font-bold" style={{ color: C.pink }}>
          <Plus size={14} /> Novo treino
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {cardsForDate(selectedDate).length === 0 && (
          <div className="rounded-3xl p-6 text-center" style={{ background: C.surface, border: `1px dashed ${C.line}` }}>
            <p className="text-sm" style={{ color: C.muted }}>Nenhum treino marcado. Toca em "Novo treino" pra organizar o dia.</p>
          </div>
        )}
        {cardsForDate(selectedDate).map((occ) => (
          <TrainingCard key={occ.occId} card={occ} onClick={() => onOpenCard(occ)} onQuickToggle={() => onQuickToggle(occ)} />
        ))}
      </div>
    </div>
  );
}

function StreakCard({ streaks }) {
  const C = useC();
  const { current, best } = streaks;
  const hasHistory = current > 0 || best > 0;
  return (
    <div
      className="rounded-3xl p-4 mb-4 flex items-center gap-4"
      style={{ background: current > 0 ? C.pinkSoft : C.surface, border: `1px solid ${current > 0 ? C.pinkDark : C.line}` }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
        style={{ background: current > 0 ? C.pink : C.surface2 }}
      >
        <Flame size={26} color={current > 0 ? "#fff" : C.muted} className={current > 0 ? "flame-pulse" : ""} />
      </div>
      <div className="flex-1 min-w-0">
        {hasHistory ? (
          <>
            <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
              {current} dia{current === 1 ? "" : "s"} seguidos
            </p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>
              {current > 0 ? "Continua hoje pra não quebrar!" : "Sua sequência quebrou — bora recomeçar."} Recorde: {best} dia{best === 1 ? "" : "s"}.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-black leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
              Comece sua sequência hoje
            </p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>
              Conclua um treino ou registre a recuperação. É assim que 1% por dia vira 10x.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TrainingCard({ card, onClick, onQuickToggle }) {
  const C = useC();
  const done = card.status === "concluido";
  const res = card.type === "jogo" ? resultInfo(card.feedback?.resultado) : null;
  return (
    <div
      className="rounded-3xl p-4 w-full flex gap-3.5"
      style={{
        background: C.surface,
        border: `1.5px solid ${done ? C.pink : C.line}`,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onQuickToggle(); }}
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 transition-transform active:scale-90"
        style={{ background: done ? C.pink : "transparent", border: `2px solid ${done ? C.pink : C.line}` }}
        aria-label="Marcar como concluído"
      >
        {done && <Check size={17} color="#fff" strokeWidth={3} />}
      </button>

      <button onClick={onClick} className="text-left flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5">
            <TypeBadge type={card.type} />
            {card.isRecurring && <Repeat size={12} color={C.muted} />}
            {res && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: res.color }}
              >
                {res.letter}
              </span>
            )}
          </div>
          {done ? (
            <span className="flex items-center gap-1 text-[11px] font-black uppercase shrink-0" style={{ color: C.pink }}>
              Concluído
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: C.muted }}>
              <Clock size={12} /> {card.time}
            </span>
          )}
        </div>
        <p className="font-bold text-lg leading-tight" style={{ color: C.text }}>{card.title || "Treino"}</p>
        {card.endDate && card.endDate !== card.date && (
          <p className="text-[11px] mt-1" style={{ color: C.muted }}>até {fmtDM(card.endDate)}</p>
        )}
        {done && card.feedback?.vitoria && (
          <p className="text-xs mt-2 flex items-start gap-1" style={{ color: C.pink }}>
            <Sparkles size={12} className="mt-0.5 shrink-0" /> {card.feedback.vitoria}
          </p>
        )}
        {done && !card.feedback?.bem && !card.feedback?.vitoria && !res && (
          <p className="text-xs mt-2" style={{ color: C.muted }}>Toca pra registrar como foi esse treino →</p>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase mt-2.5" style={{ color: C.pink, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
          Ver treino <ChevronRight size={13} />
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Month View                                                          */
/* ------------------------------------------------------------------ */
function MonthView({ monthCursor, setMonthCursor, cards, completions, selectedDate, setSelectedDate }) {
  const C = useC();
  const first = startOfMonth(monthCursor);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = toISO(new Date());

  function countFor(iso) {
    return getOccurrencesForDate(cards, completions, iso).length;
  }

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))} className="p-2 rounded-full" style={{ background: C.surface2 }}>
          <ChevronLeft size={18} color={C.text} />
        </button>
        <span className="text-xl font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
          {MONTH_LABELS[monthCursor.getMonth()]} {monthCursor.getFullYear()}
        </span>
        <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))} className="p-2 rounded-full" style={{ background: C.surface2 }}>
          <ChevronRight size={18} color={C.text} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} className="text-center text-[10px] font-bold py-1" style={{ color: C.muted }}>{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === monthCursor.getMonth();
          const count = countFor(iso);
          const isToday = iso === today;
          const isSel = iso === selectedDate;
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5"
              style={{
                background: isSel ? C.pink : C.surface,
                opacity: inMonth ? 1 : 0.35,
                border: isToday ? `1.5px solid ${C.pink}` : `1px solid ${C.line}`,
              }}
            >
              <span className="text-xs font-bold" style={{ color: isSel ? "#fff" : C.text }}>{d.getDate()}</span>
              {count > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                    <div key={k} className="w-1 h-1 rounded-full" style={{ background: isSel ? "#fff" : C.pink }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-center mt-4" style={{ color: C.muted }}>Toca num dia pra ver a agenda na Semana.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Painel View — training analytics + CMJ + recovery + insights        */
/* ------------------------------------------------------------------ */
function PainelView({ cards, completions, checkins, onSaveCheckin, jumps, onSaveJump, insights }) {
  const C = useC();
  const [period, setPeriod] = useState("semana");

  const [start, end] = getPeriodRange(period);
  const occs = useMemo(() => occurrencesInRange(cards, completions, start, end), [cards, completions, start, end]);
  const total = occs.length;
  const done = occs.filter((o) => o.status === "concluido").length;
  const overallPct = total ? Math.round((done / total) * 100) : 0;
  const byType = TYPES.map((t) => {
    const arr = occs.filter((o) => o.type === t.key);
    const d = arr.filter((o) => o.status === "concluido").length;
    return { ...t, total: arr.length, done: d, pct: arr.length ? Math.round((d / arr.length) * 100) : 0 };
  }).filter((t) => t.total > 0);

  return (
    <div className="px-5">
      {insights.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {insights.map((ins, i) => (
            <div
              key={i}
              className="rounded-2xl p-3.5 flex items-start gap-2.5"
              style={{
                background: ins.level === "warning" ? "rgba(245,165,36,0.10)" : C.pinkSoft,
                border: `1px solid ${ins.level === "warning" ? AMBER : C.pinkDark}`,
              }}
            >
              {ins.level === "warning"
                ? <AlertTriangle size={16} color={AMBER} className="shrink-0 mt-0.5" />
                : <Shield size={16} color={C.pink} className="shrink-0 mt-0.5" />}
              <p className="text-xs leading-snug" style={{ color: C.text }}>{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Analytics */}
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart3 size={16} color={C.pink} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Análise de desempenho
        </span>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        <Pill small active={period === "semana"} onClick={() => setPeriod("semana")}>Semana</Pill>
        <Pill small active={period === "mes"} onClick={() => setPeriod("mes")}>Mês</Pill>
        <Pill small active={period === "ano"} onClick={() => setPeriod("ano")}>Ano</Pill>
      </div>

      <div className="rounded-3xl p-5 mb-4 flex items-center gap-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <RingStat percent={overallPct} />
        <div>
          <p className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
            {done}<span style={{ color: C.muted }}>/{total}</span>
          </p>
          <p className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.04em" }}>
            treinos concluídos
          </p>
          {total === 0 && <p className="text-xs mt-1" style={{ color: C.muted }}>sem treinos marcados no período</p>}
        </div>
      </div>

      {byType.length > 0 && (
        <div className="rounded-3xl p-4 mb-6" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: C.muted, letterSpacing: "0.04em" }}>
            Por área
          </p>
          <div className="flex flex-col gap-3">
            {byType.map((t) => (
              <div key={t.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: C.text }}>{t.label}</span>
                  <span className="text-xs font-bold" style={{ color: C.muted }}>{t.done}/{t.total} · {t.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
                  <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: C.pink }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CMJ */}
      <CMJPanel jumps={jumps} onSave={onSaveJump} />

      {/* Recovery */}
      <RecoveryPanel checkins={checkins} onSave={onSaveCheckin} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nutrição View — hidratação hoje; alimentação chega depois          */
/* ------------------------------------------------------------------ */
function NutricaoView({ hydration, weight, onAddHydration, onDeleteHydration, onSaveWeight, nutrition, onSaveNutrition, cards, completions }) {
  const C = useC();
  const [ws, we] = getPeriodRange("semana");
  // Frequência de treino a partir da agenda do app (Painel/Semana). Alimenta o
  // fator de atividade. Conservador: sem agenda, assume frequência moderada.
  const sessionsPerWeek = useMemo(() => {
    const planned = occurrencesInRange(cards, completions, ws, we).length;
    if (planned > 0) return planned;
    return nutrition?.trainings?.length ? 4 : 2;
  }, [cards, completions, ws, we, nutrition]);

  return (
    <div className="px-5">
      <SectionHeader eyebrow="Nutrição do atleta" title="NUTRIÇÃO" />

      <NutritionPlanner
        profile={nutrition}
        onSaveProfile={onSaveNutrition}
        sessionsPerWeek={sessionsPerWeek}
        weight={weight}
      />

      <div className="mt-8" />
      <InfoNote title="Dica de hidratação">
        Distribua a água ao longo do dia — não adianta beber tudo de uma vez. Comece assim que acordar e mantenha um ritmo constante até o fim do treino.
      </InfoNote>
      <HydrationPanel
        hydration={hydration} weight={weight}
        onAdd={onAddHydration} onDelete={onDeleteHydration} onSaveWeight={onSaveWeight}
      />
    </div>
  );
}

/* ================================================================== */
/*  MEAL PLAN ENGINE (pure) — decide meals + compute macros            */
/* ================================================================== */
function hmToMin(hm) {
  if (!hm) return null;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + (m || 0);
}
function minToHM(min) {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* Decide QUAIS refeições fazem sentido a partir dos horários do atleta.  */
/* Cada refeição carrega pesos (carbW/protW/fatW) usados pra distribuir   */
/* os macros — refeições perto do treino puxam mais carboidrato.         */
function decideMeals(profile) {
  const wake = hmToMin(profile.wake) ?? 7 * 60;
  const sleep = hmToMin(profile.sleep) ?? 23 * 60;
  const school = profile.school && profile.school.start && profile.school.end
    ? { start: hmToMin(profile.school.start), end: hmToMin(profile.school.end) } : null;
  const trainings = (profile.trainings || [])
    .filter((t) => t.start)
    .map((t) => ({ start: hmToMin(t.start), dur: Number(t.durationMin) || 60, intensity: t.intensity || "moderado", place: t.place || "" }))
    .sort((a, b) => a.start - b.start);

  const meals = [];
  const add = (m) => meals.push(m);

  // Âncoras: sempre existem. (Horários de almoço/jantar são padrões
  // conservadores; dá pra refinar com os horários de escola depois.)
  const cafe = wake + 30;
  add({ key: "cafe", label: "Café da manhã", time: cafe, tier: "essencial", carbW: 1.2, protW: 1.0, fatW: 1.0 });
  const lunch = 12 * 60 + 30;
  add({ key: "almoco", label: "Almoço", time: lunch, tier: "essencial", carbW: 1.2, protW: 1.1, fatW: 1.0 });
  const dinner = 20 * 60;
  add({ key: "jantar", label: "Jantar", time: dinner, tier: "essencial", carbW: 1.0, protW: 1.1, fatW: 1.0 });

  // Lanche da manhã — intervalo café→almoço.
  const gapM = lunch - cafe;
  if (gapM > 240) add({ key: "lanche_manha", label: "Lanche da manhã", time: cafe + Math.round(gapM / 2), tier: "essencial", carbW: 0.8, protW: 0.9, fatW: 0.9 });
  else if (gapM > 180) add({ key: "lanche_manha", label: "Lanche da manhã", time: cafe + Math.round(gapM / 2), tier: "recomendado", note: "Intervalo moderado até o almoço — ajuda a manter energia e não exagerar depois.", carbW: 0.8, protW: 0.9, fatW: 0.9 });

  // Lanche da tarde — intervalo almoço→jantar.
  const gapA = dinner - lunch;
  if (gapA > 240) add({ key: "lanche_tarde", label: "Lanche da tarde", time: lunch + Math.round(gapA / 2), tier: "essencial", carbW: 0.9, protW: 0.9, fatW: 0.9 });
  else if (gapA > 180) add({ key: "lanche_tarde", label: "Lanche da tarde", time: lunch + Math.round(gapA / 2), tier: "recomendado", note: "Tarde longa até o jantar — evita chegar no jantar com fome demais.", carbW: 0.9, protW: 0.9, fatW: 0.9 });

  // Refeições ligadas ao treino.
  trainings.forEach((t, i) => {
    const end = t.start + t.dur;
    const next = trainings[i + 1];
    const backToBack = next && next.start - end < 90;

    // Pré-treino: ~1h30 antes (dentro da janela de 1-2h).
    const preLeve = t.intensity === "leve";
    add({
      key: `pre_${i}`, label: "Pré-treino", time: t.start - 90,
      tier: preLeve ? "recomendado" : "essencial",
      note: preLeve ? "Treino leve: o pré-treino não é obrigatório, mas melhora o rendimento se você não treina em jejum." : undefined,
      carbW: 1.6, protW: 0.9, fatW: 0.3, peri: true,
    });

    // Intra-treino: só se treino longo (>75min) ou dois treinos colados.
    if (t.dur > 75 || backToBack) {
      add({
        key: `intra_${i}`, label: "Intra-treino", time: t.start + Math.round(t.dur / 2), tier: "essencial",
        note: backToBack ? "Dois treinos seguidos: carboidrato líquido no intervalo segura a intensidade." : "Treino longo (>75min): repor carbo durante evita queda de rendimento.",
        carbW: 1.4, protW: 0.2, fatW: 0.0, peri: true,
      });
    }

    // Pós-treino: janela ~30-45min. Um só quando os treinos são colados.
    if (!backToBack) {
      add({
        key: `pos_${i}`, label: "Pós-treino", time: end + 30, tier: "essencial",
        note: "Janela de recuperação (~30-45min): carbo + proteína pra repor e reconstruir.",
        carbW: 1.8, protW: 1.3, fatW: 0.3, peri: true,
      });
    }
  });

  // Ceia: se dorme tarde (>=23h) ou treinou à noite.
  const nightTraining = trainings.some((t) => t.start + t.dur > 20 * 60);
  const lateSleep = sleep >= 23 * 60;
  if (lateSleep || nightTraining) {
    const both = lateSleep && nightTraining;
    add({
      key: "ceia", label: "Ceia", time: sleep - 45, tier: both ? "essencial" : "recomendado",
      note: both ? undefined : (nightTraining ? "Treino à noite: uma ceia leve com proteína ajuda a recuperação no sono." : "Você dorme tarde — uma ceia leve evita ir pra cama com fome."),
      carbW: 0.5, protW: 1.0, fatW: 0.8,
    });
  }

  // Ordena por horário. Se um pré-treino cai coladinho numa refeição âncora,
  // não cria refeição separada — só reforça o carbo daquela refeição.
  meals.sort((a, b) => a.time - b.time);
  const anchors = new Set(["cafe", "almoco", "jantar", "lanche_manha", "lanche_tarde", "ceia"]);
  const out = [];
  for (const m of meals) {
    if (m.key.startsWith("pre_")) {
      const near = meals.find((x) => anchors.has(x.key) && Math.abs(x.time - m.time) <= 45);
      if (near) {
        near.note = (near.note ? near.note + " " : "") + "Essa é sua refeição pré-treino — reforce o carboidrato.";
        near.carbW = Math.max(near.carbW, 1.5);
        continue;
      }
    }
    if (school && m.time >= school.start && m.time <= school.end) {
      m.note = (m.note ? m.note + " " : "") + "Durante a escola — leve algo prático/portátil.";
    }
    out.push(m);
  }
  return out;
}

/* Calcula TMB, TDEE, alvo calórico e macros; distribui pelas refeições. */
function computeNutritionPlan(profile, sessionsPerWeek) {
  const kg = Number(profile.weight) || 70;
  const age = Number(profile.age) || 18;
  const heightAssumed = !profile.height;
  const cm = Number(profile.height) || 170; // altura opcional — assume 170cm
  const sex = profile.sex === "F" ? "F" : "M";

  const tmb = Math.round(10 * kg + 6.25 * cm - 5 * age + (sex === "F" ? -161 : 5));
  const af = activityFactorFromSessions(sessionsPerWeek);
  const tdee = Math.round(tmb * af);

  const gm = GOAL_MACROS[profile.goal] || GOAL_MACROS.performance;
  const target = Math.round(tdee * gm.kcalAdj);

  let protG = Math.round(gm.prot * kg);
  let carbG = Math.round(gm.carb * kg);
  let fatG = Math.round((target - protG * 4 - carbG * 4) / 9);
  const fatFloor = Math.round(FAT_FLOOR_PER_KG * kg);
  let adjustedNote = null;
  if (fatG < fatFloor) {
    // Gordura abaixo do piso saudável → reduz carbo pra compensar (conservador).
    fatG = fatFloor;
    carbG = Math.max(0, Math.round((target - protG * 4 - fatG * 9) / 4));
    adjustedNote = "Carboidrato ajustado pra manter um mínimo saudável de gordura.";
  }
  const kcalFinal = protG * 4 + carbG * 4 + fatG * 9;

  const meals = decideMeals(profile);
  const sumC = meals.reduce((a, m) => a + m.carbW, 0) || 1;
  const sumP = meals.reduce((a, m) => a + m.protW, 0) || 1;
  const sumF = meals.reduce((a, m) => a + m.fatW, 0) || 1;
  const mealsOut = meals.map((m) => ({
    ...m, timeHM: minToHM(m.time),
    carb: Math.round(carbG * (m.carbW / sumC)),
    prot: Math.round(protG * (m.protW / sumP)),
    fat: Math.round(fatG * (m.fatW / sumF)),
  }));

  return { tmb, af, tdee, target: kcalFinal, protG, carbG, fatG, kg, meals: mealsOut, heightAssumed, adjustedNote, sessionsPerWeek };
}

function defaultProfile(weight) {
  return {
    sex: "M", weight: weight != null ? String(weight) : "", age: "", height: "",
    goal: "performance", wake: "07:00", sleep: "23:00",
    school: { start: "", end: "" },
    trainings: [{ start: "18:00", durationMin: "60", intensity: "moderado", place: "academia" }],
    mealsPerDay: 5,
  };
}

/* ------------------------------------------------------------------ */
/*  Nutrition planner UI                                                */
/* ------------------------------------------------------------------ */
function NutritionPlanner({ profile, onSaveProfile, sessionsPerWeek, weight }) {
  const C = useC();
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState(null); // { macroKey, grams, mealLabel }
  const plan = useMemo(() => (profile ? computeNutritionPlan(profile, sessionsPerWeek) : null), [profile, sessionsPerWeek]);

  if (!profile) {
    return (
      <>
        <div className="rounded-3xl p-6 mb-6 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: C.pinkSoft }}>
            <Apple size={26} color={C.pink} />
          </div>
          <h3 className="text-2xl font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>Gerador de plano alimentar</h3>
          <p className="text-sm mt-1.5 mb-4" style={{ color: C.muted }}>
            Responde algumas perguntas e o app monta suas refeições, macros e horários com base no seu treino.
          </p>
          <button onClick={() => setEditing(true)} className="w-full py-3 rounded-2xl font-bold text-white" style={{ background: C.pink }}>
            Gerar meu plano
          </button>
        </div>
        {editing && (
          <NutriQuestionnaireModal
            initial={defaultProfile(weight)}
            onClose={() => setEditing(false)}
            onSave={(p) => { onSaveProfile(p); setEditing(false); }}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <PlanSummary plan={plan} profile={profile} onEdit={() => setEditing(true)} />

      <div className="flex items-center gap-1.5 mb-3">
        <Apple size={16} color={C.pink} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Suas refeições · toque no valor pra ver equivalências
        </span>
      </div>
      <div className="flex flex-col gap-3 mb-6">
        {plan.meals.map((m) => (
          <MealPlanCard key={m.key} meal={m} onPickMacro={(macroKey, grams) => setPick({ macroKey, grams, mealLabel: m.label })} />
        ))}
      </div>

      <SupplementsSection profile={profile} plan={plan} />

      <div className="rounded-2xl p-3.5 mb-2 flex items-start gap-2" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
        <AlertTriangle size={15} color={AMBER} className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug" style={{ color: C.muted }}>
          <b style={{ color: C.text }}>Este plano é educacional.</b> Consulte um nutricionista antes de seguir à risca, especialmente quanto a suplementos.
        </p>
      </div>

      {editing && (
        <NutriQuestionnaireModal
          initial={profile}
          onClose={() => setEditing(false)}
          onSave={(p) => { onSaveProfile(p); setEditing(false); }}
        />
      )}
      {pick && <EquivalenceSheet macroKey={pick.macroKey} grams={pick.grams} mealLabel={pick.mealLabel} onClose={() => setPick(null)} />}
    </div>
  );
}

function PlanSummary({ plan, profile, onEdit }) {
  const C = useC();
  const g = nutriGoalInfo(profile.goal);
  const macro = (label, val, color) => (
    <div className="flex-1 rounded-2xl py-2.5 text-center" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
      <p className="text-lg font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{val}<span className="text-xs" style={{ color: C.muted }}>g</span></p>
      <p className="text-[10px] font-bold uppercase mt-0.5" style={{ color: C.muted }}>{label}</p>
    </div>
  );
  return (
    <div className="rounded-3xl p-5 mb-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase" style={{ color: C.pink, letterSpacing: "0.1em" }}>{g.label}</p>
          <p className="text-4xl font-black leading-none mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
            {plan.target}<span className="text-base" style={{ color: C.muted }}> kcal/dia</span>
          </p>
        </div>
        <button onClick={onEdit} className="p-2 rounded-full shrink-0" style={{ background: C.surface2 }} aria-label="Editar questionário">
          <Pencil size={14} color={C.muted} />
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        {macro("Carbo", plan.carbG, C.pink)}
        {macro("Proteína", plan.protG, "#22C55E")}
        {macro("Gordura", plan.fatG, AMBER)}
      </div>
      <p className="text-[11px]" style={{ color: C.muted }}>
        TMB {plan.tmb} · gasto ~{plan.tdee} kcal (fator {plan.af} · {plan.sessionsPerWeek}x treino/sem) · {plan.meals.length} refeições
        {profile.mealsPerDay ? ` (meta: ${profile.mealsPerDay})` : ""}
      </p>
      {plan.heightAssumed && <p className="text-[10px] mt-1" style={{ color: AMBER }}>Altura não informada — assumindo 170cm. Edite pra deixar mais preciso.</p>}
      {plan.adjustedNote && <p className="text-[10px] mt-1" style={{ color: AMBER }}>{plan.adjustedNote}</p>}
    </div>
  );
}

function MealTierTag({ tier }) {
  const C = useC();
  const rec = tier === "recomendado";
  return (
    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 999, color: rec ? AMBER : "#fff", background: rec ? "transparent" : C.pink, border: `1px solid ${rec ? AMBER : C.pink}`, fontFamily: "'Barlow Condensed', sans-serif" }}>
      {rec ? "Recomendado" : "Essencial"}
    </span>
  );
}

function CatBadge({ tier }) {
  const info = MEAL_TIERS[tier];
  return (
    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 6, color: "#fff", background: info.color, fontFamily: "'Barlow Condensed', sans-serif" }}>
      {info.label}
    </span>
  );
}

function MealPlanCard({ meal, onPickMacro }) {
  const C = useC();
  // Monta as linhas em 3 categorias (BASE / COMPLEMENTO / ACESSÓRIO).
  const lines = [];
  if (meal.carb > 0) lines.push({ tier: "base", name: "Carboidrato", macroKey: "carb", grams: meal.carb });
  if (meal.prot > 0) lines.push({ tier: "base", name: "Proteína", macroKey: "prot", grams: meal.prot });
  if (meal.fat > 0) lines.push({ tier: "complemento", name: "Gordura boa", macroKey: "fat", grams: meal.fat });
  if (!meal.peri) lines.push({ tier: "complemento", name: "Vegetais e fibras", text: "à vontade" });
  lines.push({ tier: "acessorio", name: meal.peri ? "Água / isotônico" : "Tempero, azeite extra ou fruta", text: "opcional" });

  return (
    <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-bold shrink-0" style={{ color: C.pink, fontFamily: "'Barlow Condensed', sans-serif" }}>{meal.timeHM}</span>
          <span className="font-bold text-base truncate" style={{ color: C.text }}>{meal.label}</span>
        </div>
        <MealTierTag tier={meal.tier} />
      </div>
      {meal.note && (
        <p className="text-[11px] leading-snug mb-2.5" style={{ color: meal.tier === "recomendado" ? AMBER : C.muted }}>{meal.note}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <CatBadge tier={l.tier} />
            <span className="text-sm flex-1 min-w-0" style={{ color: C.text }}>{l.name}</span>
            {l.grams != null ? (
              <button
                onClick={() => onPickMacro(l.macroKey, l.grams)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0"
                style={{ background: C.surface2, border: `1px solid ${C.line}`, color: C.text }}
              >
                {l.grams}g <ChevronRight size={12} color={C.pink} />
              </button>
            ) : (
              <span className="text-xs shrink-0" style={{ color: C.muted }}>{l.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const MACRO_NAMES = { carb: "carboidrato", prot: "proteína", fat: "gordura" };
function EquivalenceSheet({ macroKey, grams, mealLabel, onClose }) {
  const C = useC();
  const foods = FOODS[macroKey] || [];
  return (
    <Modal onClose={onClose} title="Equivalências">
      <p className="text-sm mb-1" style={{ color: C.muted }}>{mealLabel}</p>
      <p className="text-2xl font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
        {grams}g de {MACRO_NAMES[macroKey]} <span className="text-sm" style={{ color: C.muted }}>= um destes:</span>
      </p>
      <div className="flex flex-col gap-2">
        {foods.map((f) => {
          const g = gramsForMacro(f, macroKey, grams);
          return (
            <div key={f.key} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
              <span className="text-sm font-semibold" style={{ color: C.text }}>{f.label}</span>
              <span className="text-base font-black shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.pink }}>
                ~{g}g
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] mt-4" style={{ color: C.muted }}>
        Pesos aproximados pra bater só esse macro. Como cada alimento também carrega um pouco dos outros macros, use como referência prática, não como medida exata.
      </p>
    </Modal>
  );
}

function SupplementsSection({ profile, plan }) {
  const C = useC();
  const recs = [];
  const protPerKg = plan.protG / (plan.kg || 1);
  if (protPerKg >= 1.9 || profile.goal !== "performance") {
    recs.push({ name: "Whey protein", note: `Ajuda a bater a meta de proteína (${plan.protG}g/dia) quando fica difícil só com comida — prático no pós-treino ou lanches.` });
  }
  if (profile.goal === "performance" || profile.goal === "massa") {
    recs.push({ name: "Creatina", note: "3-5g/dia, uso contínuo. Um dos suplementos mais estudados: melhora força, potência e recuperação." });
  }
  const longTraining = (profile.trainings || []).some((t) => (Number(t.durationMin) || 0) > 75) || (profile.trainings || []).length >= 2;
  if (longTraining) {
    recs.push({ name: "Maltodextrina / dextrose", note: "Carbo de rápida absorção pro intra-treino em sessões longas ou treinos duplos." });
  }

  if (recs.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={16} color={C.pink} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>Suplementos (educacional)</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {recs.map((r, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <p className="font-bold text-sm mb-0.5" style={{ color: C.text }}>{r.name}</p>
            <p className="text-xs leading-snug" style={{ color: C.muted }}>{r.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Questionário — salvo no localStorage, reeditável. */
function NutriQuestionnaireModal({ initial, onClose, onSave }) {
  const C = useC();
  const [d, setD] = useState(() => ({
    ...defaultProfile(null), ...initial,
    school: { start: "", end: "", ...(initial.school || {}) },
    trainings: initial.trainings && initial.trainings.length ? initial.trainings.map((t) => ({ ...t })) : defaultProfile(null).trainings,
  }));
  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const setTraining = (i, patch) => setD((p) => ({ ...p, trainings: p.trainings.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  const addTraining = () => setD((p) => ({ ...p, trainings: [...p.trainings, { start: "18:00", durationMin: "60", intensity: "moderado", place: "academia" }] }));
  const removeTraining = (i) => setD((p) => ({ ...p, trainings: p.trainings.filter((_, j) => j !== i) }));
  const canSave = Number(d.weight) > 0 && Number(d.age) > 0;

  return (
    <Modal onClose={onClose} title="Seu perfil">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)">
          <input type="number" step="0.5" min="0" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.weight} onChange={(e) => set({ weight: e.target.value })} placeholder="Ex: 72" />
        </Field>
        <Field label="Idade">
          <input type="number" min="0" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.age} onChange={(e) => set({ age: e.target.value })} placeholder="Ex: 17" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Altura (cm, opcional)">
          <input type="number" min="0" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.height} onChange={(e) => set({ height: e.target.value })} placeholder="Ex: 175" />
        </Field>
        <Field label="Sexo">
          <div className="flex gap-2">
            <Pill small active={d.sex === "M"} onClick={() => set({ sex: "M" })}>Masc</Pill>
            <Pill small active={d.sex === "F"} onClick={() => set({ sex: "F" })}>Fem</Pill>
          </div>
        </Field>
      </div>

      <Field label="Objetivo">
        <div className="flex flex-wrap gap-2">
          {NUTRI_GOALS.map((g) => (
            <Pill key={g.key} small active={d.goal === g.key} onClick={() => set({ goal: g.key })}>{g.short}</Pill>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Acorda">
          <input type="time" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.wake} onChange={(e) => set({ wake: e.target.value })} />
        </Field>
        <Field label="Dorme">
          <input type="time" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.sleep} onChange={(e) => set({ sleep: e.target.value })} />
        </Field>
      </div>

      <Field label="Escola (opcional)">
        <div className="grid grid-cols-2 gap-3">
          <input type="time" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.school.start} onChange={(e) => set({ school: { ...d.school, start: e.target.value } })} />
          <input type="time" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={d.school.end} onChange={(e) => set({ school: { ...d.school, end: e.target.value } })} />
        </div>
      </Field>

      <Field label="Treinos do dia">
        <div className="flex flex-col gap-3">
          {d.trainings.map((t, i) => (
            <div key={i} className="rounded-2xl p-3" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase" style={{ color: C.muted }}>Treino {i + 1}</span>
                {d.trainings.length > 1 && (
                  <button onClick={() => removeTraining(i)} aria-label="Remover treino"><Trash2 size={14} color={C.muted} /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: C.muted }}>Início</label>
                  <input type="time" className="w-full rounded-lg px-2 py-2 text-sm outline-none" style={inputStyle}
                    value={t.start} onChange={(e) => setTraining(i, { start: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: C.muted }}>Duração (min)</label>
                  <input type="number" min="0" step="5" className="w-full rounded-lg px-2 py-2 text-sm outline-none" style={inputStyle}
                    value={t.durationMin} onChange={(e) => setTraining(i, { durationMin: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {["leve", "moderado", "intenso"].map((iv) => (
                  <Pill key={iv} small active={t.intensity === iv} onClick={() => setTraining(i, { intensity: iv })}>{iv}</Pill>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["academia", "campo", "outro"].map((pl) => (
                  <Pill key={pl} small active={t.place === pl} onClick={() => setTraining(i, { place: pl })}>{pl}</Pill>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addTraining} className="flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-bold" style={{ background: C.surface2, color: C.pink, border: `1px dashed ${C.line}` }}>
            <Plus size={15} /> Adicionar treino
          </button>
        </div>
      </Field>

      <Field label="Refeições por dia (sugestão: 5-6)">
        <input type="number" min="3" max="8" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
          value={d.mealsPerDay} onChange={(e) => set({ mealsPerDay: Number(e.target.value) })} />
      </Field>

      <button
        onClick={() => canSave && onSave(d)}
        disabled={!canSave}
        className="w-full py-3 rounded-2xl font-bold text-white mt-1"
        style={{ background: canSave ? C.pink : C.line }}
      >
        GERAR PLANO
      </button>
      {!canSave && <p className="text-[11px] text-center mt-2" style={{ color: C.muted }}>Informe pelo menos peso e idade.</p>}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Hydration panel — daily intake, optimal zone & sources             */
/* ------------------------------------------------------------------ */
function HydrationPanel({ hydration, weight, onAdd, onDelete, onSaveWeight }) {
  const C = useC();
  const [date, setDate] = useState(toISO(new Date()));
  const [type, setType] = useState("agua");
  const [amount, setAmount] = useState("");
  const [chartPeriod, setChartPeriod] = useState("semana");
  const [weightInput, setWeightInput] = useState(weight != null ? String(weight) : "");
  const [editWeight, setEditWeight] = useState(false);

  const weightNum = Number(weight) || 0;
  const goalMin = Math.round(weightNum * WATER_ML_PER_KG_MIN);
  const goalMax = Math.round(weightNum * WATER_ML_PER_KG_MAX);
  const hasWeight = weightNum > 0;

  const dayEntries = useMemo(
    () => hydration.filter((h) => h.date === date).sort((a, b) => (b.id || "").localeCompare(a.id || "")),
    [hydration, date]
  );
  const dayEffective = useMemo(() => dayEntries.reduce((a, h) => a + effectiveWater(h), 0), [dayEntries]);
  const dayPure = useMemo(
    () => dayEntries.filter((h) => h.type === "agua").reduce((a, h) => a + effectiveWater(h), 0),
    [dayEntries]
  );
  const dayOther = dayEffective - dayPure;

  const days = chartPeriod === "semana" ? 7 : 30;
  const series = useMemo(() => {
    const today = new Date();
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const iso = toISO(addDays(today, -i));
      const dayList = hydration.filter((h) => h.date === iso);
      const agua = dayList.filter((h) => h.type === "agua").reduce((a, h) => a + effectiveWater(h), 0);
      const outras = dayList.reduce((a, h) => a + effectiveWater(h), 0) - agua;
      arr.push({ date: fmtDM(iso), agua, outras });
    }
    return arr;
  }, [hydration, days]);

  const periodStart = toISO(addDays(new Date(), -(days - 1)));
  const sources = useMemo(() => {
    const inPeriod = hydration.filter((h) => h.date >= periodStart);
    return BEVERAGES.map((b) => {
      const ml = inPeriod.filter((h) => h.type === b.key).reduce((a, h) => a + effectiveWater(h), 0);
      return { key: b.key, label: b.label, color: b.color, ml };
    }).filter((s) => s.ml > 0).sort((a, b) => b.ml - a.ml);
  }, [hydration, periodStart]);
  const sourcesTotal = sources.reduce((a, s) => a + s.ml, 0);

  const amountNum = Number(amount);
  const canAdd = amount !== "" && !isNaN(amountNum) && amountNum > 0;
  function submit(ml) {
    const v = ml != null ? ml : amountNum;
    if (!v || v <= 0) return;
    onAdd({ date, type, amount: v });
    setAmount("");
  }
  function saveWeight() {
    const w = Number(weightInput);
    if (w > 0) { onSaveWeight(w); setEditWeight(false); }
  }

  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-3">
        <Droplets size={16} color={WATER_BLUE} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Hidratação
        </span>
      </div>

      {/* Peso corporal → zona ótima */}
      {(!hasWeight || editWeight) ? (
        <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: C.text }}>
            <Scale size={13} color={C.muted} /> Qual seu peso corporal? (kg)
          </p>
          <p className="text-[11px] mb-2.5" style={{ color: C.muted }}>
            Usamos pra calcular sua meta: 35 a 50 ml de água por kg de peso.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number" step="0.5" min="0" placeholder="Ex: 72"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
            <button
              onClick={saveWeight}
              disabled={!(Number(weightInput) > 0)}
              className="py-2.5 px-5 rounded-xl font-bold text-sm text-white"
              style={{ background: Number(weightInput) > 0 ? WATER_BLUE : C.line }}
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-4 mb-4 flex items-center gap-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: `${WATER_BLUE}22` }}>
            <Scale size={22} color={WATER_BLUE} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
              {goalMin}–{goalMax} <span className="text-sm" style={{ color: C.muted }}>ml/dia</span>
            </p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>
              Meta de água pra {weightNum} kg · 35–50 ml/kg (zona ótima)
            </p>
          </div>
          <button
            onClick={() => { setWeightInput(String(weightNum)); setEditWeight(true); }}
            className="p-2 rounded-full shrink-0" style={{ background: C.surface2 }}
            aria-label="Editar peso"
          >
            <Pencil size={14} color={C.muted} />
          </button>
        </div>
      )}

      {/* Registro de bebida */}
      <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={13} color={C.muted} />
            <span className="text-xs font-bold" style={{ color: C.muted }}>Registro do dia</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs outline-none"
            style={inputStyle}
          />
        </div>

        <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Tipo de líquido
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {BEVERAGES.map((b) => {
            const active = type === b.key;
            return (
              <button
                key={b.key}
                onClick={() => setType(b.key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                style={{
                  background: active ? b.color : C.surface2,
                  color: active ? "#fff" : C.muted,
                  border: `1.5px solid ${active ? b.color : C.line}`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: active ? "#fff" : b.color }} />
                {b.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mb-3" style={{ color: C.muted }}>
          {bevInfo(type).label} tem <b style={{ color: C.text }}>{bevInfo(type).waterPct}%</b> de água — cada 100 ml contam como {Math.round(bevInfo(type).waterPct)} ml de hidratação.
        </p>

        <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Quantidade (ml)
        </label>
        <div className="flex gap-2 items-center mb-2">
          <input
            type="number" step="10" min="0" placeholder="Ex: 250"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
          <button
            onClick={() => submit()}
            disabled={!canAdd}
            className="py-2.5 px-5 rounded-xl font-bold text-sm text-white flex items-center gap-1"
            style={{ background: canAdd ? WATER_BLUE : C.line }}
          >
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="flex gap-2">
          {AMOUNT_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => submit(p)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.line}` }}
            >
              +{p} ml
            </button>
          ))}
        </div>

        {/* Resumo do dia — anel de progresso + zona ótima */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
          {hasWeight ? (
            <HydrationRing value={dayEffective} pure={dayPure} min={goalMin} max={goalMax} />
          ) : (
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
                {dayEffective} <span className="text-sm" style={{ color: C.muted }}>ml de água</span>
              </p>
              <span className="text-[11px] text-right" style={{ color: C.muted }}>informe seu peso<br />pra ver a meta</span>
            </div>
          )}
          {dayOther > 0 && (
            <p className="text-[11px] mt-3 text-center" style={{ color: C.muted }}>
              <span style={{ color: WATER_BLUE }}>{dayPure} ml</span> de água pura + <span style={{ color: C.pink }}>{dayOther} ml</span> de outras bebidas
            </p>
          )}
        </div>

        {/* Lista do dia */}
        {dayEntries.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-4">
            {dayEntries.map((h) => {
              const b = bevInfo(h.type);
              return (
                <div key={h.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: C.surface2 }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
                  <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{b.label}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{h.amount} ml → {effectiveWater(h)} ml</span>
                  <button onClick={() => onDelete(h.id)} className="p-1 rounded-full" aria-label="Remover">
                    <Trash2 size={13} color={C.muted} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panorama diário */}
      <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.04em" }}>
            Panorama diário de hidratação
          </span>
          <div className="flex gap-1.5">
            <Pill small active={chartPeriod === "semana"} onClick={() => setChartPeriod("semana")}>7 dias</Pill>
            <Pill small active={chartPeriod === "mes"} onClick={() => setChartPeriod("mes")}>30 dias</Pill>
          </div>
        </div>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={series} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
              {hasWeight && (
                <ReferenceArea y1={goalMin} y2={goalMax} fill="#22C55E" fillOpacity={0.10} />
              )}
              {hasWeight && (
                <ReferenceLine y={goalMin} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.7} />
              )}
              {hasWeight && (
                <ReferenceLine y={goalMax} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.7} />
              )}
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted }} interval={chartPeriod === "mes" ? 4 : 0} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: C.text }}
                formatter={(v, name) => [`${v} ml`, name === "agua" ? "Água pura" : "Outras bebidas"]}
              />
              <Bar dataKey="agua" stackId="h" fill={WATER_BLUE} />
              <Bar dataKey="outras" stackId="h" fill={C.pink} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <LegendDot color={WATER_BLUE} label="Água pura" />
          <LegendDot color={C.pink} label="Água de outras bebidas" />
          {hasWeight && <LegendDot color="#22C55E" label="Zona ótima (35–50 ml/kg)" dashed />}
        </div>
      </div>

      {/* Fontes de hidratação */}
      <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.04em" }}>
          Principais fontes de hidratação
        </span>
        {sources.length === 0 ? (
          <p className="text-xs mt-3" style={{ color: C.muted }}>
            Registre suas bebidas pra ver de onde vem sua hidratação.
          </p>
        ) : (
          <>
            <div style={{ width: "100%", height: Math.max(120, sources.length * 38) }} className="mt-3">
              <ResponsiveContainer>
                <BarChart data={sources} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C.line} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: C.text }} axisLine={false} tickLine={false} width={78} />
                  <Tooltip
                    cursor={{ fill: C.surface2 }}
                    contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: C.text }}
                    formatter={(v) => [`${v} ml de água`, "Contribuição"]}
                  />
                  <Bar dataKey="ml" radius={[0, 6, 6, 0]}>
                    {sources.map((s) => <Cell key={s.key} fill={s.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {sources.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="flex-1" style={{ color: C.text }}>{s.label}</span>
                  <span style={{ color: C.muted }}>
                    {s.ml} ml · {sourcesTotal ? Math.round((s.ml / sourcesTotal) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Anel de ticks estilo velocímetro — água pura (azul) + outras (rosa),  */
/* com a zona ótima (35–50 ml/kg) destacada em verde no trilho.          */
function HydrationRing({ value, pure, min, max }) {
  const C = useC();
  const SIZE = 260, cx = SIZE / 2, cy = SIZE / 2;
  const rInner = 100, rOuter = 120;
  const N = 60;
  const startDeg = 30, sweepDeg = 300; // abertura de 60° no topo
  const cap = max || 1;
  const pTotal = Math.min(1, value / cap);
  const pPure = Math.min(1, pure / cap);
  const zMin = Math.min(1, min / cap); // início da zona ótima (ex: 0.7)

  const ticks = [];
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    const A = ((startDeg + f * sweepDeg) * Math.PI) / 180;
    const sin = Math.sin(A), cos = Math.cos(A);
    let color, glow = false;
    if (value > 0 && f <= pPure) { color = WATER_BLUE; glow = true; }
    else if (value > 0 && f <= pTotal) { color = C.pink; glow = true; }
    else if (f >= zMin - 1e-6) { color = "rgba(34,197,94,0.45)"; } // trilho da zona ótima
    else { color = C.line; }
    ticks.push({
      key: i, color, glow,
      x1: cx + rInner * sin, y1: cy - rInner * cos,
      x2: cx + rOuter * sin, y2: cy - rOuter * cos,
    });
  }

  let statusLabel = "Comece a beber", statusColor = C.muted;
  if (value > 0) {
    if (value < min) { statusLabel = "Abaixo do ideal"; statusColor = AMBER; }
    else if (value <= max) { statusLabel = "Zona ótima"; statusColor = "#22C55E"; }
    else { statusLabel = "Acima da zona"; statusColor = WATER_BLUE; }
  }
  const pct = Math.round(pTotal * 100);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: SIZE, margin: "0 auto", aspectRatio: "1 / 1" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "100%", display: "block" }}>
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.color} strokeWidth={3.4} strokeLinecap="round"
            style={t.glow ? { filter: `drop-shadow(0 0 2.5px ${t.color})` } : undefined}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 40px",
        }}
      >
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, lineHeight: 1, color: C.text, fontSize: "3.1rem" }}>
          {value}<span style={{ fontSize: "1.1rem", color: C.muted }}> ml</span>
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.muted, letterSpacing: "0.1em", marginTop: 2 }}>
          de hidratação
        </p>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
          meta <b style={{ color: C.text }}>{min}–{max} ml</b> · {pct}%
        </p>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, marginTop: 6, background: `${statusColor}1F`, color: statusColor }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  const C = useC();
  return (
    <div className="flex items-center gap-1.5">
      {dashed ? (
        <span className="w-3.5 h-0 shrink-0" style={{ borderTop: `2px dashed ${color}` }} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      )}
      <span className="text-[11px]" style={{ color: C.muted }}>{label}</span>
    </div>
  );
}

function RingStat({ percent }) {
  const C = useC();
  const size = 96;
  const strokeW = 10;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.surface2} strokeWidth={strokeW} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={C.pink} strokeWidth={strokeW} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="20" fontWeight="900" fill={C.text}>
        {percent}%
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  CMJ panel — daily vertical jump tracking                            */
/* ------------------------------------------------------------------ */
function CMJPanel({ jumps, onSave }) {
  const C = useC();
  const [date, setDate] = useState(toISO(new Date()));
  const [chartPeriod, setChartPeriod] = useState("semana");
  const existing = jumps.find((j) => j.date === date);
  const [height, setHeight] = useState(existing ? String(existing.height) : "");

  useEffect(() => {
    const e = jumps.find((j) => j.date === date);
    setHeight(e ? String(e.height) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const sorted = useMemo(() => [...jumps].sort((a, b) => a.date.localeCompare(b.date)), [jumps]);
  const last = sorted[sorted.length - 1];
  const pb = sorted.length ? Math.max(...sorted.map((j) => j.height)) : null;
  const sevenAgo = toISO(addDays(new Date(), -6));
  const last7 = jumps.filter((j) => j.date >= sevenAgo);
  const avg7 = last7.length ? Math.round((last7.reduce((a, j) => a + j.height, 0) / last7.length) * 10) / 10 : null;

  const days = chartPeriod === "semana" ? 7 : 30;
  const series = useMemo(() => {
    const today = new Date();
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const iso = toISO(addDays(today, -i));
      const entry = jumps.find((j) => j.date === iso);
      arr.push({ date: fmtDM(iso), height: entry ? entry.height : null });
    }
    return arr;
  }, [jumps, days]);

  const canSave = height !== "" && !isNaN(Number(height)) && Number(height) > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp size={16} color={C.pink} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Salto vertical (CMJ)
        </span>
      </div>

      <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={13} color={C.muted} />
            <span className="text-xs font-bold" style={{ color: C.muted }}>Registro do dia</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs outline-none"
            style={{ background: C.surface2, border: `1px solid ${C.line}`, color: C.text }}
          />
        </div>

        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.muted, letterSpacing: "0.05em" }}>
              Altura do salto (cm)
            </label>
            <input
              type="number" step="0.1" min="0" placeholder="Ex: 42.5"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: C.surface2, border: `1px solid ${C.line}`, color: C.text }}
            />
          </div>
          <button
            onClick={() => canSave && onSave({ date, height: Number(height) })}
            disabled={!canSave}
            className="py-2.5 px-5 rounded-xl font-bold text-sm text-white"
            style={{ background: canSave ? C.pink : C.line }}
          >
            {existing ? "Atualizar" : "Salvar"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatChip label="Último" value={last ? `${last.height} cm` : "—"} sub={last ? fmtDM(last.date) : ""} />
          <StatChip label="Recorde" value={pb !== null ? `${pb} cm` : "—"} icon={<Award size={12} color={C.pink} />} highlight />
          <StatChip label="Média 7d" value={avg7 !== null ? `${avg7} cm` : "—"} />
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.04em" }}>
            Evolução do salto
          </span>
          <div className="flex gap-1.5">
            <Pill small active={chartPeriod === "semana"} onClick={() => setChartPeriod("semana")}>7 dias</Pill>
            <Pill small active={chartPeriod === "mes"} onClick={() => setChartPeriod("mes")}>30 dias</Pill>
          </div>
        </div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted }} interval={chartPeriod === "mes" ? 4 : 0} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} width={26} domain={["dataMin - 3", "dataMax + 3"]} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: C.text }} />
              <Line type="monotone" dataKey="height" stroke={C.pink} strokeWidth={2.5} dot={{ r: 3, fill: C.pink }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, sub, icon, highlight }) {
  const C = useC();
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: highlight ? C.pinkSoft : C.surface2, border: `1px solid ${highlight ? C.pinkDark : C.line}` }}>
      <p className="text-[9px] font-bold uppercase mb-0.5 flex items-center justify-center gap-1" style={{ color: C.muted }}>
        {icon} {label}
      </p>
      <p className="text-sm font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: highlight ? C.pink : C.text }}>{value}</p>
      {sub && <p className="text-[9px]" style={{ color: C.muted }}>{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recovery panel (subjective wellness + charts)                       */
/* ------------------------------------------------------------------ */
function RecoveryPanel({ checkins, onSave }) {
  const C = useC();
  const [date, setDate] = useState(toISO(new Date()));
  const [chartPeriod, setChartPeriod] = useState("semana");

  const existing = checkins.find((c) => c.date === date);
  const [form, setForm] = useState(
    existing || { date, sono: null, disposicao: null, dor: null, stress: null, humor: null, recovery: null }
  );

  useEffect(() => {
    const e = checkins.find((c) => c.date === date);
    setForm(e || { date, sono: null, disposicao: null, dor: null, stress: null, humor: null, recovery: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const canSave = RECOVERY_METRICS.every((m) => form[m.key]) && form.recovery;

  const days = chartPeriod === "semana" ? 7 : 30;
  const series = useMemo(() => {
    const today = new Date();
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const iso = toISO(addDays(today, -i));
      const entry = checkins.find((c) => c.date === iso);
      arr.push({ date: fmtDM(iso), recovery: entry ? entry.recovery : null });
    }
    return arr;
  }, [checkins, days]);

  const periodStart = toISO(addDays(new Date(), -(days - 1)));
  const inPeriod = checkins.filter((c) => c.date >= periodStart);
  const averages = RECOVERY_METRICS.map((m) => {
    const vals = inPeriod.map((c) => c[m.key]).filter((v) => v);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { key: m.key, label: m.label.split(" ").slice(-2).join(" "), avg: Math.round(avg * 10) / 10 };
  });

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Gauge size={16} color={C.pink} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Métricas de percepção subjetiva
        </span>
      </div>

      <div className="rounded-3xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={13} color={C.muted} />
            <span className="text-xs font-bold" style={{ color: C.muted }}>Registro do dia</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs outline-none"
            style={{ background: C.surface2, border: `1px solid ${C.line}`, color: C.text }}
          />
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {RECOVERY_METRICS.map((m) => (
            <div key={m.key}>
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: C.text }}>
                <m.icon size={13} color={C.muted} /> {m.label}?
              </p>
              <div className="grid grid-cols-5 gap-1">
                {SCALE_5.map((s) => {
                  const active = form[m.key] === s.v;
                  return (
                    <button
                      key={s.v}
                      onClick={() => setForm({ ...form, [m.key]: s.v })}
                      className="rounded-lg py-1.5 text-[10px] font-bold text-center leading-tight"
                      style={{
                        background: active ? s.color : C.surface2,
                        color: active ? "#fff" : C.muted,
                        border: `1px solid ${active ? s.color : C.line}`,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: C.text }}>
              Como você está se sentindo para o treino? (recuperação)
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
                const active = form.recovery === v;
                const col = recoveryColor(v);
                return (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, recovery: v })}
                    className="rounded-lg py-2 text-xs font-black"
                    style={{
                      background: active ? col : C.surface2,
                      color: active ? "#fff" : C.muted,
                      border: `1.5px solid ${active ? col : C.line}`,
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] mt-1" style={{ color: C.muted }}>1 = nenhuma recuperação · 10 = totalmente recuperado</p>
          </div>
        </div>

        <button
          onClick={() => canSave && onSave(form)}
          disabled={!canSave}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: canSave ? C.pink : C.line }}
        >
          {existing ? "ATUALIZAR REGISTRO" : "SALVAR REGISTRO DO DIA"}
        </button>
      </div>

      {/* Charts */}
      <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.04em" }}>
            Evolução da recuperação
          </span>
          <div className="flex gap-1.5">
            <Pill small active={chartPeriod === "semana"} onClick={() => setChartPeriod("semana")}>7 dias</Pill>
            <Pill small active={chartPeriod === "mes"} onClick={() => setChartPeriod("mes")}>30 dias</Pill>
          </div>
        </div>

        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted }} interval={chartPeriod === "mes" ? 4 : 0} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} width={22} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: C.text }} />
              <Line type="monotone" dataKey="recovery" stroke={C.pink} strokeWidth={2.5} dot={{ r: 3, fill: C.pink }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs font-bold uppercase mt-4 mb-2" style={{ color: C.muted, letterSpacing: "0.04em" }}>
          Médias do período
        </p>
        <div style={{ width: "100%", height: 140 }}>
          <ResponsiveContainer>
            <BarChart data={averages} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} width={22} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: C.text }} />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                {averages.map((a, i) => <Cell key={i} fill={C.pink} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Goals View                                                          */
/* ------------------------------------------------------------------ */
function GoalsView({ goals, onOpen, onQuickAdd }) {
  const C = useC();
  const active = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);

  return (
    <div className="px-5">
      <div className="flex items-center gap-1.5 mb-4">
        <Target size={16} color={C.pink} />
        <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
          Mini metas · motivação diária
        </span>
      </div>

      {goals.length === 0 && (
        <div className="rounded-2xl p-6 text-center mb-4" style={{ background: C.surface, border: `1px dashed ${C.line}` }}>
          <p className="text-sm" style={{ color: C.muted }}>Nenhuma meta ainda. Ex: "200 embaixadinhas até dia 20" ou uma meta fixa sem prazo. Cria a tua!</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {active.map((g) => (
          <GoalCard key={g.id} goal={g} onClick={() => onOpen(g)} onQuickAdd={onQuickAdd} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mb-3">
            <Trophy size={16} color={C.pink} />
            <span className="text-xs font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.05em" }}>
              Conquistadas
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {done.map((g) => (
              <GoalCard key={g.id} goal={g} onClick={() => onOpen(g)} onQuickAdd={onQuickAdd} conquered />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GoalCard({ goal, onClick, onQuickAdd, conquered }) {
  const C = useC();
  const hasTarget = goal.target && Number(goal.target) > 0;
  const pct = hasTarget ? Math.min(100, Math.round(((goal.current || 0) / Number(goal.target)) * 100)) : null;
  const dLeft = goal.deadline ? daysUntil(goal.deadline) : null;

  return (
    <div
      className="rounded-3xl p-4"
      style={{
        background: conquered ? C.pinkSoft : C.surface,
        border: `1px solid ${conquered ? C.pinkDark : C.line}`,
      }}
    >
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between mb-1 gap-2">
          <p className="font-black text-lg leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>
            {goal.title}
          </p>
          {conquered ? <Trophy size={18} color={C.pink} className="shrink-0" /> : !goal.deadline && (
            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: C.surface2, color: C.muted }}>
              CONTÍNUA
            </span>
          )}
        </div>
        {goal.deadline && (
          <p className="text-[11px] mb-2" style={{ color: dLeft < 0 && !conquered ? C.pink : C.muted }}>
            {conquered ? `concluída` : dLeft >= 0 ? `${dLeft} dia(s) restantes` : "prazo passou"} · até {fmtDM(goal.deadline)}
          </p>
        )}
        {!goal.deadline && !conquered && <div className="mb-2" />}
      </button>

      {hasTarget && (
        <div className="mb-1">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.pink }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-bold" style={{ color: C.muted }}>
              {goal.current || 0} / {goal.target} {goal.unit}
            </span>
            {!conquered && (
              <div className="flex gap-1.5">
                <button onClick={() => onQuickAdd(goal.id, -1)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: C.surface2, color: C.text }}>−</button>
                <button onClick={() => onQuickAdd(goal.id, 1)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: C.surface2, color: C.text }}>+1</button>
                <button onClick={() => onQuickAdd(goal.id, 10)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: C.pink, color: "#fff" }}>+10</button>
              </div>
            )}
          </div>
        </div>
      )}
      {goal.note && (
        <p className="text-xs mt-2 italic" style={{ color: C.muted }}>"{goal.note}"</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card detail modal                                                   */
/* ------------------------------------------------------------------ */
function CardDetailModal({ card, onClose, onEdit, onDelete, onStartFeedback }) {
  const C = useC();
  const done = card.status === "concluido";
  const fb = card.feedback;
  const res = card.type === "jogo" ? resultInfo(fb?.resultado) : null;
  return (
    <Modal onClose={onClose} title={done ? "Treino concluído" : "Treino"}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TypeBadge type={card.type} />
        <span className="text-xs font-bold flex items-center gap-1" style={{ color: C.muted }}>
          <Clock size={12} /> {card.time} · {fmtDM(card.date)}{card.endDate && card.endDate !== card.date ? ` – ${fmtDM(card.endDate)}` : ""}
        </span>
        {card.isRecurring && (
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: C.muted }}>
            <Repeat size={12} /> repete
          </span>
        )}
      </div>
      <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>{card.title}</h3>

      {res && (
        <div className="rounded-3xl p-4 mb-4 flex items-center gap-4" style={{ background: `${res.color}18`, border: `1px solid ${res.color}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-black text-lg text-white" style={{ background: res.color }}>
            {res.letter}
          </div>
          <div>
            <p className="text-base font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>{res.label}</p>
            <p className="text-xs" style={{ color: C.muted }}>
              {fb.minutos ? `${fb.minutos} min em campo` : ""}{fb.minutos && fb.notaJogo ? " · " : ""}{fb.notaJogo ? `nota ${fb.notaJogo}/10` : ""}
            </p>
          </div>
        </div>
      )}

      {done && fb && (fb.bem || fb.ruim || fb.melhorar || fb.vitoria || fb.cansaco) && (
        <div className="flex flex-col gap-3 mb-5">
          {fb.cansaco && <FeedbackRow label="Nível de cansaço" value={CANSACO_LEVELS.find((l) => l.v === fb.cansaco)?.label} icon={<Flame size={14} color={C.pink} />} />}
          <FeedbackRow label="O que fiz de bom" value={fb.bem} />
          <FeedbackRow label="O que fiz de ruim" value={fb.ruim} />
          <FeedbackRow label="O que preciso melhorar" value={fb.melhorar} />
          {fb.vitoria && (
            <div className="rounded-xl p-3" style={{ background: C.pinkSoft, border: `1px solid ${C.pinkDark}` }}>
              <p className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1" style={{ color: C.pink }}>
                <Trophy size={12} /> Pequena vitória
              </p>
              <p className="text-sm" style={{ color: C.text }}>{fb.vitoria}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {!done && (
          <button onClick={onStartFeedback} className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{ background: C.pink }}>
            <Check size={16} /> {card.type === "jogo" ? "REGISTRAR JOGO" : "CONCLUIR E REGISTRAR"}
          </button>
        )}
        {done && (
          <button onClick={onStartFeedback} className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{ background: C.surface2, color: C.text }}>
            <Pencil size={16} /> {fb?.bem || fb?.vitoria || fb?.resultado ? "Editar registro" : "Adicionar registro"}
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: C.surface2, color: C.text }}>
            <Pencil size={14} /> Editar {card.isRecurring ? "série" : ""}
          </button>
          <button onClick={onDelete} className="flex-1 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.muted }}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
        {card.isRecurring && (
          <p className="text-[11px] text-center" style={{ color: C.muted }}>Editar ou excluir afeta toda a série repetida.</p>
        )}
      </div>
    </Modal>
  );
}
function FeedbackRow({ label, value, icon }) {
  const C = useC();
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1" style={{ color: C.muted }}>
        {icon} {label}
      </p>
      <p className="text-sm leading-snug" style={{ color: C.text }}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card form modal (with Google Calendar–style recurrence)             */
/* ------------------------------------------------------------------ */
function CardFormModal({ card, onClose, onSave }) {
  const C = useC();
  const [draft, setDraft] = useState({
    ...card,
    recurrence: card.recurrence || { type: "none", days: [], until: "" },
  });
  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };
  const recType = draft.recurrence.type;

  function setRecType(type) {
    if (type === "none") {
      setDraft({ ...draft, recurrence: { type: "none", days: [], until: "" } });
    } else if (type === "weekly") {
      setDraft({ ...draft, recurrence: { type: "weekly", days: [dowOf(draft.date)], until: draft.recurrence.until || "" } });
    } else {
      const seed = draft.recurrence.days?.length ? draft.recurrence.days : [dowOf(draft.date)];
      setDraft({ ...draft, recurrence: { type: "custom", days: seed, until: draft.recurrence.until || "" } });
    }
  }
  function toggleCustomDay(i) {
    const days = draft.recurrence.days.includes(i)
      ? draft.recurrence.days.filter((d) => d !== i)
      : [...draft.recurrence.days, i].sort();
    setDraft({ ...draft, recurrence: { ...draft.recurrence, days } });
  }
  function onDateChange(newDate) {
    const rec = draft.recurrence.type === "weekly" ? { ...draft.recurrence, days: [dowOf(newDate)] } : draft.recurrence;
    setDraft({ ...draft, date: newDate, recurrence: rec });
  }

  return (
    <Modal onClose={onClose} title={card.__new ? "Novo treino" : "Editar treino"}>
      <Field label="Título">
        <input
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
          placeholder="Ex: Treino A · Superiores"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </Field>
      <Field label="Tipo">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Pill key={t.key} small active={draft.type === t.key} onClick={() => setDraft({ ...draft, type: t.key })}>
              {t.label}
            </Pill>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={recType === "none" ? "Data" : "Começa em"}>
          <input type="date" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={draft.date} onChange={(e) => onDateChange(e.target.value)} />
        </Field>
        <Field label="Hora">
          <input type="time" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
        </Field>
      </div>

      <Field label="Repetição">
        <div className="flex flex-wrap gap-2 mb-2">
          <Pill small active={recType === "none"} onClick={() => setRecType("none")}>Não repete</Pill>
          <Pill small active={recType === "weekly"} onClick={() => setRecType("weekly")}>
            Toda {WEEKDAY_FULL[dowOf(draft.date)]}
          </Pill>
          <Pill small active={recType === "custom"} onClick={() => setRecType("custom")}>Personalizado</Pill>
        </div>

        {recType === "custom" && (
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_LABELS.map((l, i) => {
              const active = draft.recurrence.days.includes(i);
              return (
                <button
                  key={l}
                  onClick={() => toggleCustomDay(i)}
                  className="rounded-lg py-2 text-[10px] font-bold"
                  style={{
                    background: active ? C.pink : C.surface2,
                    color: active ? "#fff" : C.muted,
                    border: `1px solid ${active ? C.pink : C.line}`,
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        )}

        {recType !== "none" && (
          <input
            type="date" placeholder="Repetir até (opcional)"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            value={draft.recurrence.until}
            onChange={(e) => setDraft({ ...draft, recurrence: { ...draft.recurrence, until: e.target.value } })}
          />
        )}
        {recType !== "none" && (
          <p className="text-[10px] mt-1" style={{ color: C.muted }}>
            {draft.recurrence.until ? `Repete até ${fmtDM(draft.recurrence.until)}` : "Sem data final — repete indefinidamente"}
          </p>
        )}
      </Field>

      {recType === "none" && (
        <Field label="Até (opcional, pra bloco de vários dias seguidos)">
          <input type="date" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={draft.endDate || ""} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
        </Field>
      )}

      <button
        onClick={() => draft.title.trim() && (recType !== "custom" || draft.recurrence.days.length) && onSave(draft)}
        disabled={!draft.title.trim() || (recType === "custom" && draft.recurrence.days.length === 0)}
        className="w-full py-3 rounded-2xl font-bold text-white mt-2"
        style={{ background: draft.title.trim() ? C.pink : C.line }}
      >
        SALVAR TREINO
      </button>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback modal — with dedicated match-day fields for JOGO           */
/* ------------------------------------------------------------------ */
function FeedbackModal({ card, onClose, onSave }) {
  const C = useC();
  const isGame = card.type === "jogo";
  const [fb, setFb] = useState(
    card.feedback && (card.feedback.cansaco || card.feedback.resultado)
      ? card.feedback
      : { cansaco: 3, bem: "", ruim: "", melhorar: "", vitoria: "", resultado: "", minutos: "", notaJogo: null, ...(card.feedback || {}) }
  );
  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };
  return (
    <Modal onClose={onClose} title={isGame ? "Registrar jogo" : "Registrar treino"}>
      <p className="text-sm mb-4" style={{ color: C.muted }}>{card.title} · {fmtDM(card.date)}</p>

      {isGame && (
        <>
          <Field label="Resultado">
            <div className="flex gap-2">
              {RESULT_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setFb({ ...fb, resultado: r.key })}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{
                    background: fb.resultado === r.key ? r.color : C.surface2,
                    color: fb.resultado === r.key ? "#fff" : C.muted,
                    border: `1.5px solid ${fb.resultado === r.key ? r.color : C.line}`,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Minutos em campo">
            <input type="number" min="0" max="120" placeholder="Ex: 70" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
              value={fb.minutos} onChange={(e) => setFb({ ...fb, minutos: e.target.value })} />
          </Field>
          <Field label="Nota da sua atuação">
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
                const active = fb.notaJogo === v;
                const col = recoveryColor(v);
                return (
                  <button key={v} onClick={() => setFb({ ...fb, notaJogo: v })}
                    className="rounded-lg py-2 text-xs font-black"
                    style={{ background: active ? col : C.surface2, color: active ? "#fff" : C.muted, border: `1.5px solid ${active ? col : C.line}` }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </Field>
        </>
      )}

      <Field label="Nível de cansaço">
        <div className="flex flex-wrap gap-2">
          {CANSACO_LEVELS.map((l) => (
            <Pill key={l.v} small active={fb.cansaco === l.v} onClick={() => setFb({ ...fb, cansaco: l.v })}>
              {l.label}
            </Pill>
          ))}
        </div>
      </Field>
      <Field label={isGame ? "O que fiz de bom em campo" : "O que fiz de bom"}>
        <textarea rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={inputStyle}
          value={fb.bem} onChange={(e) => setFb({ ...fb, bem: e.target.value })} />
      </Field>
      <Field label={isGame ? "O que fiz de ruim em campo" : "O que fiz de ruim"}>
        <textarea rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={inputStyle}
          value={fb.ruim} onChange={(e) => setFb({ ...fb, ruim: e.target.value })} />
      </Field>
      <Field label="O que preciso melhorar">
        <textarea rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={inputStyle}
          value={fb.melhorar} onChange={(e) => setFb({ ...fb, melhorar: e.target.value })} />
      </Field>
      <Field label="Pequena vitória do dia">
        <textarea rows={2} placeholder="Ex: consegui fazer o cruzamento com a perna direita"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ ...inputStyle, borderColor: C.pinkDark }}
          value={fb.vitoria} onChange={(e) => setFb({ ...fb, vitoria: e.target.value })} />
      </Field>

      <button onClick={() => onSave(fb)} className="w-full py-3 rounded-2xl font-bold text-white mt-1" style={{ background: C.pink }}>
        SALVAR REGISTRO
      </button>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Goal modals                                                         */
/* ------------------------------------------------------------------ */
function GoalFormModal({ goal, onClose, onSave }) {
  const C = useC();
  const [draft, setDraft] = useState(goal);
  const [fixed, setFixed] = useState(!draft.deadline);
  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };
  return (
    <Modal onClose={onClose} title="Nova meta">
      <Field label="Meta">
        <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
          placeholder="Ex: 200 embaixadinhas sem deixar cair"
          value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número alvo (opcional)">
          <input type="number" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            placeholder="200" value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} />
        </Field>
        <Field label="Unidade">
          <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            placeholder="embaixadinhas" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
        </Field>
      </div>
      <Field label="Tipo de meta">
        <div className="flex gap-2">
          <Pill small active={!fixed} onClick={() => { setFixed(false); setDraft({ ...draft, deadline: draft.deadline || toISO(new Date()) }); }}>Com prazo</Pill>
          <Pill small active={fixed} onClick={() => { setFixed(true); setDraft({ ...draft, deadline: "" }); }}>Fixa (sem prazo)</Pill>
        </div>
      </Field>
      {!fixed && (
        <Field label="Prazo">
          <input type="date" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
        </Field>
      )}
      <button
        onClick={() => draft.title.trim() && onSave(draft)}
        disabled={!draft.title.trim()}
        className="w-full py-3 rounded-2xl font-bold text-white mt-2"
        style={{ background: draft.title.trim() ? C.pink : C.line }}
      >
        CRIAR META
      </button>
    </Modal>
  );
}

function GoalDetailModal({ goal, onClose, onDelete, onSave }) {
  const C = useC();
  const [draft, setDraft] = useState(goal);
  const [fixed, setFixed] = useState(!goal.deadline);
  const inputStyle = { background: C.surface2, border: `1px solid ${C.line}`, color: C.text };
  const hasTarget = draft.target && Number(draft.target) > 0;
  const canFinish = !draft.done;
  return (
    <Modal onClose={onClose} title={draft.done ? "Meta conquistada" : "Meta"}>
      <h3 className="text-2xl font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}>{draft.title}</h3>

      {!draft.done && (
        <Field label="Tipo de meta">
          <div className="flex gap-2">
            <Pill small active={!fixed} onClick={() => { setFixed(false); setDraft({ ...draft, deadline: draft.deadline || toISO(new Date()) }); }}>Com prazo</Pill>
            <Pill small active={fixed} onClick={() => { setFixed(true); setDraft({ ...draft, deadline: "" }); }}>Fixa (sem prazo)</Pill>
          </div>
        </Field>
      )}
      {!fixed && !draft.done && (
        <Field label="Prazo">
          <input type="date" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}
            value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
        </Field>
      )}
      {draft.deadline && <p className="text-xs mb-4" style={{ color: C.muted }}>até {fmtDM(draft.deadline)}</p>}

      {hasTarget && (
        <Field label={`Progresso (${draft.current || 0} / ${draft.target} ${draft.unit})`}>
          <input type="range" min={0} max={Number(draft.target)} value={draft.current || 0}
            onChange={(e) => setDraft({ ...draft, current: Number(e.target.value) })}
            className="w-full" style={{ accentColor: C.pink }} />
        </Field>
      )}

      <Field label="Reflexão / como foi essa meta">
        <textarea rows={3} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={inputStyle}
          placeholder="Como você se sentiu perseguindo essa meta?"
          value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
      </Field>

      <div className="flex flex-col gap-2 mt-2">
        {canFinish && (
          <button
            onClick={() => onSave({ ...draft, done: true, current: hasTarget ? Number(draft.target) : draft.current })}
            className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: C.pink }}
          >
            <Trophy size={16} /> MARCAR COMO CONQUISTADA
          </button>
        )}
        <button onClick={() => onSave(draft)} className="w-full py-2.5 rounded-2xl font-bold text-sm" style={{ background: C.surface2, color: C.text }}>
          Salvar alterações
        </button>
        <button onClick={onDelete} className="w-full py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.muted }}>
          <Trash2 size={14} /> Excluir meta
        </button>
      </div>
    </Modal>
  );
}
