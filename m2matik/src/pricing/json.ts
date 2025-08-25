export type JsonPrice = {
  startpris: number;
  m2pris: number;
  faktorLav?: number;
  faktorNormal?: number; // default 1
  faktorHøj?: number;
  beregning?:
    | "faktor_pa_m2_og_start"
    | "faktor_kun_pa_start"
    | "faktor_kun_pa_m2"
    | "kun_start_med_faktor"
    | "kun_start"
    | "kun_m2";
};

export type ExtraItem =
  | { name: string; kind: "fixed"; amount: number }
  | { name: string; kind: "per_m2"; amount: number }
  | { name: string; kind: "per_unit"; amount: number }
  | { name: string; kind: "factor"; amount: number }
  | {
      name: string;
      kind: "factor_fn";
      fn: string;
      params?: Record<string, number>;
    };

export type PostnrRule = {
  from: number;
  to: number;
  factor: number;
  note?: string;
};

export type JsonData = {
  base: Record<string, JsonPrice>;
  extras: Record<string, ExtraItem[]>;
  postnrFaktorer?: PostnrRule[];
  global?: {
    multipliers?: { basement?: number; firstFloor?: number };
    escalation?: { baseDate?: string; percentPerYear?: number };
  };
};

const warnedKeys = new Set<string>();
function warnOnce(key: string, msg: string) {
  const code = `${key}:${msg}`;
  if (warnedKeys.has(code)) return;
  warnedKeys.add(code);
  console.warn(`[priser.json] ${msg}`, key);
}

export async function loadPricesJson(
  url = "/data/priser.json"
): Promise<JsonData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return (await res.json()) as JsonData;
}

export function baseTotal(
  p: JsonPrice | undefined,
  areaM2: number,
  factorKind: "lav" | "normal" | "høj",
  keyForLog?: string
): number {
  const price: JsonPrice = p || {
    startpris: 0,
    m2pris: 0,
    faktorLav: 1,
    faktorNormal: 1,
    faktorHøj: 1,
    beregning: "faktor_pa_m2_og_start",
  };
  if (!p && keyForLog)
    warnOnce(keyForLog, "Missing base price; defaulting to 0/1 values");
  const fLav = price.faktorLav ?? 1;
  const fNorm = price.faktorNormal ?? 1;
  const fHoj = price.faktorHøj ?? 1;
  const faktor =
    factorKind === "lav" ? fLav : factorKind === "høj" ? fHoj : fNorm;
  const sqm = Math.max(0, areaM2);
  switch (price.beregning) {
    case "faktor_kun_pa_start":
      return Math.max(
        0,
        Math.round(price.startpris * faktor + price.m2pris * sqm)
      );
    case "faktor_kun_pa_m2":
      return Math.max(
        0,
        Math.round(price.startpris + price.m2pris * sqm * faktor)
      );
    case "kun_start_med_faktor":
      return Math.max(0, Math.round(price.startpris * faktor));
    case "kun_start":
      return Math.max(0, Math.round(price.startpris));
    case "kun_m2":
      return Math.max(0, Math.round(price.m2pris * sqm));
    default:
      return Math.max(
        0,
        Math.round(price.startpris + price.m2pris * sqm * faktor)
      );
  }
}

export function extrasTotal(
  list: ExtraItem[] | undefined,
  areaM2: number,
  pickedNames: string[],
  keyForLog?: string,
  units = 1,
  slopeDeg?: number,
  subtotalBeforeFactors?: number
): number {
  if (!list || list.length === 0 || pickedNames.length === 0) return 0;
  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_.-]/g, "");
  const picks = pickedNames.map(norm);
  let add = 0;
  let mult = 1;
  let fnMult = 1;
  for (const e of list) {
    const en = norm(e.name);
    if (!picks.some((p) => en.includes(p) || p.includes(en))) continue;
    switch (e.kind) {
      case "fixed":
        add += e.amount || 0;
        break;
      case "per_m2":
        add += (e.amount || 0) * Math.max(0, areaM2);
        break;
      case "per_unit":
        add += (e.amount || 0) * Math.max(0, units || 0);
        break;
      case "factor":
        mult *= Math.max(0, e.amount || 1);
        break;
      case "factor_fn": {
        const fn = e.fn;
        const p = e.params || {};
        if (fn === "roofSlopeLinear") {
          const minDeg = p.minDeg ?? 0;
          const maxDeg = p.maxDeg ?? 45;
          const min = p.min ?? 1;
          const max = p.max ?? 2;
          const d = Math.min(Math.max(slopeDeg ?? 0, minDeg), maxDeg);
          const t = (d - minDeg) / (maxDeg - minDeg || 1);
          fnMult *= min + (max - min) * t;
        }
        break;
      }
    }
  }
  const base = (subtotalBeforeFactors ?? 0) * mult * fnMult;
  const total = base + add;
  if (total === 0 && keyForLog)
    warnOnce(keyForLog, "Picked extras but none matched; defaulting to 0");
  return Math.max(0, Math.round(total));
}

export function total(base: number, extras: number) {
  return Math.max(0, Math.round(base + extras));
}

// High-level calculators per spec
export type Kvalitet = "lav" | "normal" | "høj";
export function calcBase(
  row: JsonPrice | undefined,
  areaM2: number,
  kvalitet: Kvalitet
) {
  return baseTotal(row, areaM2, kvalitet);
}

export function applyPostnr(
  total: number,
  postnr: number | undefined,
  rules: PostnrRule[] = []
) {
  if (!postnr) return Math.round(total);
  const hit = rules.find((r) => postnr >= r.from && postnr <= r.to);
  const f = hit?.factor ?? 1;
  return Math.round(total * f);
}

export function applyGlobal(
  total: number,
  selected: string[] = [],
  global?: JsonData["global"]
) {
  let t = total;
  const m = global?.multipliers ?? {};
  for (const key of selected) {
    const f =
      key === "basement"
        ? m.basement
        : key === "firstFloor"
        ? m.firstFloor
        : undefined;
    if (typeof f === "number" && isFinite(f) && f > 0) t *= f;
  }
  return Math.round(t);
}

export function applyEscalation(
  total: number,
  esc?: { baseDate?: string; percentPerYear?: number }
) {
  const baseDate = esc?.baseDate
    ? new Date(esc.baseDate)
    : new Date("2025-01-01");
  const pct = esc?.percentPerYear ?? 0.03;
  const years = (Date.now() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.round(total * Math.pow(1 + pct, years));
}
