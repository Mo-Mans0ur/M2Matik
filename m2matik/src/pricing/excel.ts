import * as XLSX from "xlsx";

// Quality labels (slider mapping: 0 -> lav, 1 -> normal, 2 -> høj)
export type FaktorLabel = "lav" | "normal" | "høj";

export type ExcelPriceRow = {
  key: string; // normalized arbejdstype key, e.g., 'maling', 'bad', 'køkken', 'tag'
  startpris: number; // base start price
  m2pris: number; // price per m2
  faktorLav?: number; // optional multiplier for low quality
  faktorHøj?: number; // optional multiplier for high quality
};

export type ExtraKind = "fixed" | "per_m2" | "factor";
export type ExtraItem = { name: string; kind: ExtraKind; amount: number };

export type BaseMap = Record<string, ExcelPriceRow>;
export type ExtrasMap = Record<string, ExtraItem[]>; // by category, e.g. { tag: [...], maling: [...] }

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_.-]/g, "");

const parseDkNumber = (val: any) => {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  let s = String(val).trim();
  if (!s) return 0;
  // Remove everything but digits, ., , and '-'
  s = s.replace(/[^0-9.,\-]/g, "");
  // Remove thousands '.' and use '.' as decimal
  s = s.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// Public API: Load base rows and extras from the Excel sheet
export async function loadPricingFromExcel(
  url = "/data/priser-til-beregning.xlsx"
) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Read as array-of-arrays to handle sheets where headers are in row values, not column labels
  const A: any[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
  }) as any[][];
  if (!A || !A.length) return { base: {} as BaseMap, extras: {} as ExtrasMap };

  const base: BaseMap = {};
  const extras: ExtrasMap = {};

  // Find header row (first col says 'arbejdstype')
  let headerRow = -1;
  for (let i = 0; i < A.length; i++) {
    const c0 = norm(String(A[i]?.[0] ?? ""));
    if (c0 === norm("arbejdstype")) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return { base, extras };

  const headersRow = A[headerRow] as any[];
  const colIndex = (labelCands: string[]) => {
    const cands = labelCands.map(norm);
    for (let j = 0; j < headersRow.length; j++) {
      const h = norm(String(headersRow[j] ?? ""));
      if (!h) continue;
      if (cands.some((c) => h.includes(c))) return j;
    }
    return -1;
  };

  const startIdx = colIndex(["start pris", "startpris", "opstart", "basis"]);
  const m2Idx = colIndex([
    "m2 pris",
    "m2pris",
    "pris pr m2",
    "pris/m2",
    "kr/m2",
    "krprm2",
  ]);
  const lavIdx = colIndex([
    "laveste kvalitet faktor",
    "laveste faktor",
    "lav",
    "low",
  ]);
  const hojIdx = colIndex([
    "højeste kvalitet faktor",
    "hojeste kvalitet faktor",
    "høj",
    "hoj",
    "high",
  ]);

  // Parse rows until we hit a 'tag' section marker
  let i = headerRow + 1;
  for (; i < A.length; i++) {
    const row = A[i] as any[];
    const rawName = String(row?.[0] ?? "").trim();
    const name = norm(rawName);
    if (!rawName) continue;
    if (name === norm("tag")) break; // end of general base section

    const startpris = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
    const m2pris = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
    const faktorLav = lavIdx >= 0 ? parseDkNumber(row[lavIdx]) : 0;
    const faktorHøj = hojIdx >= 0 ? parseDkNumber(row[hojIdx]) : 0;

    // Save as base row
    base[name] = {
      key: name,
      startpris: isFinite(startpris) ? startpris : 0,
      m2pris: isFinite(m2pris) ? m2pris : 0,
      faktorLav: isFinite(faktorLav) && faktorLav !== 0 ? faktorLav : undefined,
      faktorHøj: isFinite(faktorHøj) && faktorHøj !== 0 ? faktorHøj : undefined,
    };

    // Known extras before tag section
    // Painting related rows are treated as extras under 'maling'
    if (
      name === norm("træværk") ||
      name === norm("stuk") ||
      name === norm("høje paneler")
    ) {
      const cat = norm("maling");
      if (!extras[cat]) extras[cat] = [];
      if (m2pris > 0)
        extras[cat].push({ name: rawName, kind: "per_m2", amount: m2pris });
      if (startpris > 0)
        extras[cat].push({ name: rawName, kind: "fixed", amount: startpris });
    }
    if (name === norm("ny placering bad")) {
      const cat = norm("badeværelse");
      if (!extras[cat]) extras[cat] = [];
      if (startpris > 0)
        extras[cat].push({ name: rawName, kind: "fixed", amount: startpris });
      if (m2pris > 0)
        extras[cat].push({ name: rawName, kind: "per_m2", amount: m2pris });
    }
    if (name === norm("ny tavle")) {
      const cat = norm("elektriker");
      if (!extras[cat]) extras[cat] = [];
      if (startpris > 0)
        extras[cat].push({ name: rawName, kind: "fixed", amount: startpris });
      if (m2pris > 0)
        extras[cat].push({ name: rawName, kind: "per_m2", amount: m2pris });
    }
    if (
      name.includes(norm("tillæg  ved nyt")) ||
      name.includes(norm("tillaeg ved nyt"))
    ) {
      const cat = norm("døre og vinduer");
      if (!extras[cat]) extras[cat] = [];
      const val = m2pris > 0 ? m2pris : startpris; // treat as fixed per-unit add-on
      if (val > 0) extras[cat].push({ name: rawName, kind: "fixed", amount: val });
    }
  }

  // Parse 'tag' section (roof) and any post-tag categories/extras (e.g., Terasse, Gulve)
  for (let r = i + 1; r < A.length; r++) {
    const row = A[r] as any[];
    const rawName = String(row?.[0] ?? "").trim();
    const name = norm(rawName);
    if (!rawName) continue;

    // Base for roof (e.g., 'fladt') -> store under key 'tag'
    if (name === norm("fladt")) {
      const startpris = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const m2pris = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      const faktorLav = lavIdx >= 0 ? parseDkNumber(row[lavIdx]) : 0;
      const faktorHøj = hojIdx >= 0 ? parseDkNumber(row[hojIdx]) : 0;
      base[norm("tag")] = {
        key: norm("tag"),
        startpris: isFinite(startpris) ? startpris : 0,
        m2pris: isFinite(m2pris) ? m2pris : 0,
        faktorLav: isFinite(faktorLav) && faktorLav !== 0 ? faktorLav : undefined,
        faktorHøj: isFinite(faktorHøj) && faktorHøj !== 0 ? faktorHøj : undefined,
      };
      continue;
    }

    // Base for terrace may appear after the 'tag' section and be spelled 'Terasse' (one 'r')
    if (name === norm("terrasse") || name === norm("terasse")) {
      const startpris = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const m2pris = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      const faktorLav = lavIdx >= 0 ? parseDkNumber(row[lavIdx]) : 0;
      const faktorHøj = hojIdx >= 0 ? parseDkNumber(row[hojIdx]) : 0;
      // Normalize storage key to the correct double-r variant
      base[norm("terrasse")] = {
        key: norm("terrasse"),
        startpris: isFinite(startpris) ? startpris : 0,
        m2pris: isFinite(m2pris) ? m2pris : 0,
        faktorLav: isFinite(faktorLav) && faktorLav !== 0 ? faktorLav : undefined,
        faktorHøj: isFinite(faktorHøj) && faktorHøj !== 0 ? faktorHøj : undefined,
      };
      continue;
    }

    // Base for floors may appear as plural 'Gulve' after the 'tag' section
    if (name === norm("gulv") || name === norm("gulve")) {
      const startpris = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const m2pris = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      const faktorLav = lavIdx >= 0 ? parseDkNumber(row[lavIdx]) : 0;
      const faktorHøj = hojIdx >= 0 ? parseDkNumber(row[hojIdx]) : 0;
      // Store under singular key
      base[norm("gulv")] = {
        key: norm("gulv"),
        startpris: isFinite(startpris) ? startpris : 0,
        m2pris: isFinite(m2pris) ? m2pris : 0,
        faktorLav: isFinite(faktorLav) && faktorLav !== 0 ? faktorLav : undefined,
        faktorHøj: isFinite(faktorHøj) && faktorHøj !== 0 ? faktorHøj : undefined,
      };
      continue;
    }

    // Extras like 'tillæg ved saddeltag', 'valmtag', 'kviste', 'efterisolering'
    if (name.includes(norm("tillæg")) || name.includes(norm("tillaeg"))) {
      if (!extras[norm("tag")]) extras[norm("tag")] = [];
      const startVal = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const m2Val = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      // Heuristics: small values in m2 column around 1-3 are factors
      const factorCandidate = m2Val && m2Val >= 0.9 && m2Val <= 5 ? m2Val : 0;
      const isKvist = name.includes(norm("kvist")) || name.includes(norm("kviste"));
      if (factorCandidate) {
        extras[norm("tag")].push({ name: rawName, kind: "factor", amount: factorCandidate });
      }
      if (isKvist) {
        const val = startVal > 0 ? startVal : m2Val;
        if (val > 0)
          extras[norm("tag")].push({ name: rawName, kind: "fixed", amount: val });
      } else {
        if (startVal > 0)
          extras[norm("tag")].push({ name: rawName, kind: "fixed", amount: startVal });
        if (!factorCandidate && m2Val > 0)
          extras[norm("tag")].push({ name: rawName, kind: "per_m2", amount: m2Val });
      }
      continue;
    }

    // Terrace factor extras: e.g., 'faktor ved hævet', 'faktor  ved værn'
    if (name.includes(norm("faktor")) && (name.includes(norm("hæv")) || name.includes(norm("haev")) || name.includes(norm("værn")) || name.includes(norm("vaern")))) {
      if (!extras[norm("terrasse")]) extras[norm("terrasse")] = [];
      const m2Val = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      const startVal = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const factorCandidate = m2Val && m2Val >= 0.9 && m2Val <= 5 ? m2Val : 0;
      const amount = factorCandidate || (startVal >= 0.9 && startVal <= 5 ? startVal : 0);
      if (amount)
        extras[norm("terrasse")].push({ name: rawName, kind: "factor", amount });
      continue;
    }

    // Terrace fixed/per-m2 extra: e.g., 'tilvalg trappe'
    if (name.includes(norm("trappe"))) {
      if (!extras[norm("terrasse")]) extras[norm("terrasse")] = [];
      const startVal = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const m2Val = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      if (startVal > 0)
        extras[norm("terrasse")].push({ name: rawName, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        extras[norm("terrasse")].push({ name: rawName, kind: "per_m2", amount: m2Val });
      continue;
    }

    // Floor extra: e.g., 'tillæg gulvvarme'
    if (name.includes(norm("gulvvarme")) || (name.includes(norm("gulv")) && name.includes(norm("varme")))) {
      if (!extras[norm("gulv")]) extras[norm("gulv")] = [];
      const startVal = parseDkNumber(startIdx >= 0 ? row[startIdx] : 0);
      const m2Val = parseDkNumber(m2Idx >= 0 ? row[m2Idx] : 0);
      if (startVal > 0)
        extras[norm("gulv")].push({ name: rawName, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        extras[norm("gulv")].push({ name: rawName, kind: "per_m2", amount: m2Val });
      continue;
    }
  }

  // Dev-time verification for painting row values as requested
  const maling = base[norm("maling")];
  if (maling) {
    const okStart = Math.abs(maling.startpris - 5000) <= 10; // allow tiny rounding
    const okM2 = Math.abs(maling.m2pris - 1400) <= 10;
    const lav = maling.faktorLav ?? 1;
    const hoj = maling.faktorHøj ?? 1;
    const okLav = Math.abs(lav - 0.6) <= 0.1; // ≈ 0.6
    const okHoj = Math.abs(hoj - 1.4) <= 0.1; // ≈ 1.4
    if (!(okStart && okM2 && okLav && okHoj)) {
      console.warn("Excel painting row differs from expected defaults", {
        got: maling,
        expected: { startpris: 5000, m2pris: 1400, faktorLav: "~0.6", faktorHøj: "~1.4" },
      });
    }
  }

  return { base, extras } as { base: BaseMap; extras: ExtrasMap };
}

// Backwards-compatible light loader for older calls (kept for safety)
export async function loadExcelPrices(
  url = "/data/priser-til-beregning.xlsx"
): Promise<Record<string, ExcelPriceRow>> {
  const { base } = await loadPricingFromExcel(url);
  return base;
}

// Helpers
export function qualityToLabel(q: 0 | 1 | 2): FaktorLabel {
  return q === 0 ? "lav" : q === 2 ? "høj" : "normal";
}

export function calcBaseTotal(
  row: ExcelPriceRow | undefined,
  areaM2: number,
  quality: FaktorLabel
) {
  const r: ExcelPriceRow = row || { key: "", startpris: 0, m2pris: 0 };
  const factor = quality === "lav" ? r.faktorLav ?? 1 : quality === "høj" ? r.faktorHøj ?? 1 : 1;
  const total = Math.max(0, Math.round((r.startpris || 0) + Math.max(0, areaM2) * (r.m2pris || 0) * factor));
  return total;
}

export function calcExtrasTotal(
  extras: ExtraItem[] | undefined,
  areaM2: number,
  pickedNames: string[]
) {
  if (!extras || extras.length === 0 || pickedNames.length === 0) return 0;
  const picks = pickedNames.map((n) => norm(n));
  let total = 0;
  for (const e of extras) {
    const en = norm(e.name);
    if (!picks.some((p) => en.includes(p) || p.includes(en))) continue;
    if (e.kind === "fixed") total += e.amount;
    if (e.kind === "per_m2") total += e.amount * Math.max(0, areaM2);
    // factor extras are multiplicative and handled elsewhere
  }
  return Math.max(0, Math.round(total));
}

export function computeWithTagExtras(
  baseRow: ExcelPriceRow | undefined,
  tagExtras: ExtraItem[] | undefined,
  areaM2: number,
  quality: FaktorLabel,
  pickedExtraNames: string[]
) {
  let base = calcBaseTotal(baseRow, areaM2, quality);
  // apply multiplicative factors (match by normalized substring)
  if (tagExtras && pickedExtraNames.length) {
    const picks = pickedExtraNames.map((n) => norm(n));
    for (const e of tagExtras) {
      if (e.kind !== "factor") continue;
      const en = norm(e.name);
      if (picks.some((p) => en.includes(p) || p.includes(en))) {
        base *= e.amount;
      }
    }
  }
  const extrasTotal = calcExtrasTotal(tagExtras, areaM2, pickedExtraNames);
  return Math.max(0, Math.round(base + extrasTotal));
}

// Adapter: UI option ids -> Excel arbejdstype keys
export const UI_TO_EXCEL_KEY: Record<string, string> = {
  maling: norm("maling"),
  gulv: norm("gulv"),
  terrasse: norm("terrasse"),
  bad: norm("badeværelse"),
  køkken: norm("køkken"),
  el: norm("elektriker"),
  døreOgVinduer: norm("døre og vinduer"),
  roof: norm("tag"),
};
