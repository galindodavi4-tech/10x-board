import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import {
  Plus, X, ChevronLeft, ChevronRight, Trophy, Flame, Target,
  Clock, Check, Trash2, Pencil, Sun, Moon, MonitorSmartphone, Sparkles,
  CheckCircle2, Zap, Activity, Brain, Smile, Gauge, BarChart3, Calendar as CalendarIcon,
  Repeat, TrendingUp, Award, AlertTriangle, Shield
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                        */
/* ------------------------------------------------------------------ */
const DARK = {
  bg: "#0A0A0F",
  surface: "#15151C",
  surface2: "#1D1D26",
  line: "#2A2A34",
  pink: "#FF1B7A",
  pinkDark: "#C4125A",
  pinkSoft: "rgba(255,27,122,0.14)",
  text: "#F5F5F7",
  muted: "#8C8C97",
};
const LIGHT = {
  bg: "#F6F6F8",
  surface: "#FFFFFF",
  surface2: "#F0F0F4",
  line: "#E2E2E9",
  pink: "#FF1B7A",
  pinkDark: "#C4125A",
  pinkSoft: "rgba(255,27,122,0.09)",
  text: "#0E0E13",
  muted: "#75757F",
};
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
  return { cards: [], goals: [], checkins: [], completions: [], jumps: [], theme: "auto" };
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
      className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase inline-block"
      style={{
        background: t.fill ? "#FF1B7A" : "#000",
        color: "#fff",
        letterSpacing: "0.04em",
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
  const [themePref, setThemePref] = useState("auto");
  const [tab, setTab] = useState("semana");
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
      setThemePref(data.theme || "auto");
      setLoading(false);
    })();
  }, []);

  const isDark = themePref === "auto" ? isNightNow() : themePref === "dark";
  const C = isDark ? DARK : LIGHT;

  const persist = useCallback((partial) => {
    saveData({
      cards: partial.cards !== undefined ? partial.cards : cards,
      goals: partial.goals !== undefined ? partial.goals : goals,
      checkins: partial.checkins !== undefined ? partial.checkins : checkins,
      completions: partial.completions !== undefined ? partial.completions : completions,
      jumps: partial.jumps !== undefined ? partial.jumps : jumps,
      theme: partial.theme !== undefined ? partial.theme : themePref,
    });
  }, [cards, goals, checkins, completions, jumps, themePref]);

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
            <ThemeSwitch value={themePref} onChange={updateTheme} />
            <StreakBadge current={streaks.current} />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 flex gap-2 mb-5 overflow-x-auto whitespace-nowrap">
          <Pill active={tab === "semana"} onClick={() => setTab("semana")}>Semana</Pill>
          <Pill active={tab === "mes"} onClick={() => setTab("mes")}>Mês</Pill>
          <Pill active={tab === "painel"} onClick={() => setTab("painel")}>Painel</Pill>
          <Pill active={tab === "metas"} onClick={() => setTab("metas")}>Metas</Pill>
        </div>

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

        {(tab === "semana" || tab === "metas") && (
          <button
            onClick={() => (tab === "semana" ? openNewCard(selectedDate) : setShowAddGoal(true))}
            className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
            style={{ background: C.pink, boxShadow: `0 8px 24px ${C.pinkSoft}` }}
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </button>
        )}

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
/*  Week View                                                           */
/* ------------------------------------------------------------------ */
function WeekView({ weekStart, setWeekStart, weekDays, selectedDate, setSelectedDate, cardsForDate, recentVictories, streaks, onOpenCard, onAddCard, onQuickToggle }) {
  const C = useC();
  const today = toISO(new Date());
  return (
    <div className="px-5">
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
              className="rounded-2xl py-2.5 flex flex-col items-center gap-1"
              style={{
                background: isSel ? C.pink : C.surface,
                border: `1.5px solid ${isSel ? C.pink : isToday ? C.pinkDark : C.line}`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: isSel ? "#fff" : C.muted }}>
                {WEEKDAY_LABELS[i]}
              </span>
              <span className="text-base font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isSel ? "#fff" : C.text }}>
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
          <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px dashed ${C.line}` }}>
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
      className="rounded-2xl p-4 mb-4 flex items-center gap-4"
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
      className="rounded-2xl p-4 w-full flex gap-3"
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderLeftWidth: "4px",
        borderLeftColor: done ? C.pink : C.muted,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onQuickToggle(); }}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 transition-transform active:scale-90"
        style={{ background: done ? C.pink : "transparent", border: `2px solid ${done ? C.pink : C.line}` }}
        aria-label="Marcar como concluído"
      >
        {done && <Check size={16} color="#fff" strokeWidth={3} />}
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
            <span className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: C.pink }}>
              Concluído
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: C.muted }}>
              <Clock size={12} /> {card.time}
            </span>
          )}
        </div>
        <p className="font-bold text-base leading-tight" style={{ color: C.text }}>{card.title || "Treino"}</p>
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

      <div className="rounded-2xl p-5 mb-4 flex items-center gap-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
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
        <div className="rounded-2xl p-4 mb-6" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
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

      <div className="rounded-2xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
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

      <div className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
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

      <div className="rounded-2xl p-4 mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
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
      <div className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
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
      className="rounded-2xl p-4"
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
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-4" style={{ background: `${res.color}18`, border: `1px solid ${res.color}` }}>
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
