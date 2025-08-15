export type JsonPrice = {
  startpris: number;
  m2pris: number;
  faktorLav: number;
  faktorNormal: number; // always 1
  faktorHøj: number;
};

export type ExtraItem = { name: string; kind: "fixed" | "per_m2"; amount: number };

export type JsonData = {
  base: Record<string, JsonPrice>;
  extras: Record<string, ExtraItem[]>;
};

const warnedKeys = new Set<string>();
function warnOnce(key: string, msg: string) {
  const code = `${key}:${msg}`;
  if (warnedKeys.has(code)) return;
  warnedKeys.add(code);
  console.warn(`[priser.json] ${msg}`, key);
}

export async function loadPricesJson(url = "/data/priser.json"): Promise<JsonData> {
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
  };
  if (!p && keyForLog) warnOnce(keyForLog, "Missing base price; defaulting to 0/1 values");
  const faktor = factorKind === "lav" ? price.faktorLav : factorKind === "høj" ? price.faktorHøj : price.faktorNormal;
  const total = price.startpris + Math.max(0, areaM2) * price.m2pris * faktor;
  return Math.max(0, Math.round(total));
}

export function extrasTotal(
  list: ExtraItem[] | undefined,
  areaM2: number,
  pickedNames: string[],
  keyForLog?: string
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
  let total = 0;
  for (const e of list) {
    const en = norm(e.name);
    if (!picks.some((p) => en.includes(p) || p.includes(en))) continue;
    if (e.kind === "fixed") total += e.amount;
    if (e.kind === "per_m2") total += e.amount * Math.max(0, areaM2);
  }
  if (total === 0 && keyForLog) warnOnce(keyForLog, "Picked extras but none matched; defaulting to 0");
  return Math.max(0, Math.round(total));
}

export function total(base: number, extras: number) {
  return Math.max(0, Math.round(base + extras));
}
