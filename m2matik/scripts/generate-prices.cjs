#!/usr/bin/env node
/*
  Generate public/data/priser.json from public/data/priser-til-beregning.xlsx
  Output structure:
  {
    base: { arbejdstype: { startpris, m2pris, faktorLav, faktorNormal: 1, faktorHøj, beregning }},
    extras: {
      // category -> add-ons
      tag: [ { name, kind: "fixed"|"per_m2"|"per_unit"|"factor"|"factor_fn", amount?, fn?, params? } ],
      ...
    },
    postnrFaktorer: [ { from, to, factor, note? } ],
    global: {
      multipliers: { basement: 1.2, firstFloor: 1.1 },
      escalation: { baseDate: "2025-01-01", percentPerYear: 0.03 }
    }
  }
*/
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
// Prefer the new file name if present, otherwise fallback to the original
const EXCEL_CANDIDATES = [
  // Newest first
  path.join(ROOT, "public", "data", "priser-til-beregning-4.xlsx"),
  path.join(ROOT, "public", "data", "priser til beregning 4.xlsx"),
  path.join(ROOT, "public", "data", "priser-til-beregning-3.xlsx"),
  path.join(ROOT, "public", "data", "priser til beregning 3.xlsx"),
  path.join(ROOT, "public", "data", "priser-til-beregning.xlsx"),
];
const EXCEL =
  EXCEL_CANDIDATES.find((p) => fs.existsSync(p)) ||
  EXCEL_CANDIDATES[EXCEL_CANDIDATES.length - 1];
const OUT = path.join(ROOT, "public", "data", "priser.json");

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_.-]/g, "");

const parseDk = (val) => {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  let s = String(val).trim();
  if (!s) return 0;
  s = s.replace(/[^0-9.,\-]/g, "");
  s = s.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function toJsonKey(n) {
  // Map normalized names to desired JSON keys
  switch (n) {
    case "maling":
      return "maling";
    case "badevrelse":
      return "badeværelse";
    case "toilet":
      return "toilet";
    case "kkken":
      return "køkken";
    case "elektriker":
      return "elektriker";
    case "dreogvinduer":
      return "døreOgVinduer";
    case "fladt":
      return "tag";
    case "terasse":
    case "terrasse":
      return "terrasse";
    case "gulv":
    case "gulve":
      return "gulv";
    case "stuk":
      return "stuk";
  case "indvendigevaegge":
  case "indvendigevaeg":
  case "indvendigvaeg":
  case "indvendigvaegge":
  case "vaeg":
  case "vaegge":
    case "vaeg":
  case "vaegindvendig":
  case "indrevaegge":
  case "indrevaeg":
      return "walls";
    case "hjepaneler":
    case "hje":
    case "hjeepaneler":
    case "hjeepaneler":
    case "hejepaneler":
      return "højePaneler";
    default:
      return null; // ignore unknown rows for this export
  }
}

function main() {
  if (!fs.existsSync(EXCEL)) {
    console.error("Excel file not found:", EXCEL);
    process.exit(1);
  }
  const wb = XLSX.readFile(EXCEL);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const A = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!A || !A.length) {
    console.error("Empty sheet");
    process.exit(1);
  }

  let headerRow = -1;
  for (let i = 0; i < A.length; i++) {
    const c0 = norm(A[i]?.[0] ?? "");
    if (c0 === norm("arbejdstype")) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) {
    console.error("Header row not found");
    process.exit(1);
  }

  const headersRow = A[headerRow] || [];
  const colIndex = (labels) => {
    const cands = labels.map(norm);
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
    "stk eller m2 pris",
  ]);
  const unitIdx = colIndex([
    "pris pr stk",
    "pr stk",
    "pr. stk",
    "stk pris",
    "pris pr enhed",
    "enhedspris",
    "stk",
    "stk eller m2 pris",
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

  const outBase = {};
  const outExtras = {};
  const outPostnr = [];

  // Scan all rows; capture before and after 'tag'
  let currentSection = null; // remembers last base key encountered (e.g., "køkken")
  for (let i = headerRow + 1; i < A.length; i++) {
    const row = A[i];
    const raw = String(row?.[0] ?? "").trim();
    const rowText = String((row || []).join(" ") || "");
    const n = norm(raw);
    const nAll = norm(rowText);

    // Determine key mapping
    let key = toJsonKey(n);
  if (key) {
      const startpris = parseDk(startIdx >= 0 ? row[startIdx] : 0);
      const m2pris = parseDk(m2Idx >= 0 ? row[m2Idx] : 0);
      const faktorLav = lavIdx >= 0 ? parseDk(row[lavIdx]) : 1;
      const faktorHøj = hojIdx >= 0 ? parseDk(row[hojIdx]) : 1;

  outBase[key] = {
        startpris: Number.isFinite(startpris) ? startpris : 0,
        m2pris: Number.isFinite(m2pris) ? m2pris : 0,
        faktorLav:
          Number.isFinite(faktorLav) && faktorLav !== 0 ? faktorLav : 1,
        faktorNormal: 1,
        faktorHøj:
          Number.isFinite(faktorHøj) && faktorHøj !== 0 ? faktorHøj : 1,
        beregning:
          key === "køkken"
            ? "faktor_kun_pa_start"
            : key === "badeværelse" || key === "toilet"
            ? "kun_start_med_faktor"
            : "faktor_pa_m2_og_start",
  };
  currentSection = key; // remember section for subsequent extras lines
      continue;
    }

    // EXTRAS (non-factor only): capture common add-ons by category
    const startVal = parseDk(startIdx >= 0 ? row[startIdx] : 0);
    const m2Val = parseDk(m2Idx >= 0 ? row[m2Idx] : 0);
    const unitVal = parseDk(unitIdx >= 0 ? row[unitIdx] : 0);
    const pushExtra = (cat, item) => {
      if (!outExtras[cat]) outExtras[cat] = [];
      outExtras[cat].push(item);
    };

    // Skip obvious section markers
    if (n === "tag" || n.includes("prisinddex")) continue;

    // Maling extras: træværk, stuk, høje paneler (add as separate fast and per m² lines if present)
    if (n === norm("træværk") || n === "traevrk" || n === "traevaerk") {
      if (startVal > 0)
        pushExtra("maling", {
          name: raw + " (fast)",
          kind: "fixed",
          amount: startVal,
        });
      if (m2Val > 0)
        pushExtra("maling", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }
    if (n === "stuk") {
      if (startVal > 0)
        pushExtra("maling", {
          name: raw + " (fast)",
          kind: "fixed",
          amount: startVal,
        });
      if (m2Val > 0)
        pushExtra("maling", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }
    if (n.includes("hje") && n.includes("paneler")) {
      if (startVal > 0)
        pushExtra("maling", {
          name: raw + " (fast)",
          kind: "fixed",
          amount: startVal,
        });
      if (m2Val > 0)
        pushExtra("maling", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Badeværelse/Køkken: ny placering (look across the whole row text)
    if (
      (nAll.includes("placering") || n.includes("placering")) &&
      (nAll.includes("bad") || nAll.includes("badevrelse") || n.includes("badvrelse"))
    ) {
      if (startVal > 0)
        pushExtra("badeværelse", {
          name: raw,
          kind: "fixed",
          amount: startVal,
        });
      if (m2Val > 0)
        pushExtra("badeværelse", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }
    if (
      (nAll.includes("placering") || n.includes("placering")) &&
      (
        // explicit kitchen mention in any cell text
        nAll.includes("kkken") ||
        // or we are currently inside the kitchen section
        currentSection === "køkken" ||
        // or the line is just a generic "ny placering" without qualifiers
        n === "nyplacering"
      )
    ) {
      if (startVal > 0)
        pushExtra("køkken", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("køkken", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Badeværelse: bruseniche / badekar (fixed and optional per m² if provided)
    if (n.includes("bruseniche") || n.includes("badekar")) {
      if (startVal > 0)
        pushExtra("badeværelse", {
          name: raw,
          kind: "fixed",
          amount: startVal,
        });
      if (m2Val > 0)
        pushExtra("badeværelse", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Elektriker: ny tavle + other additive lines
    if (n.includes("tavle")) {
      if (startVal > 0)
        pushExtra("elektriker", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("elektriker", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Elektriker: pris pr stik (per unit)
    if (n.includes("pris") && n.includes("stik")) {
      const perUnit = unitVal > 0 ? unitVal : m2Val > 0 ? m2Val : startVal;
      if (perUnit > 0)
        pushExtra("elektriker", { name: "stik", kind: "per_unit", amount: perUnit });
      continue;
    }

    // Elektriker: pr afbrydere og udtag (per unit)
    if ((n.includes("afbrydere") || n.includes("afbryder")) && n.includes("udtag")) {
      const perUnit = unitVal > 0 ? unitVal : m2Val > 0 ? m2Val : startVal;
      if (perUnit > 0)
        pushExtra("elektriker", {
          name: raw || "afbrydere og udtag",
          kind: "per_unit",
          amount: perUnit,
        });
      continue;
    }

  // Elektriker: tillæg skjulte føringer (fixed and/or per m2)
  if (n.includes("skjult")) {
      if (startVal > 0)
        pushExtra("elektriker", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("elektriker", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Elektriker: billader tillæg (fixed and/or per m2 if provided)
    if (n.includes("billader") || (n.includes("bil") && n.includes("lader"))) {
      if (startVal > 0)
        pushExtra("elektriker", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("elektriker", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Walls-specific: capture 'tillæg dør' while inside walls section (before generic tillæg handling)
    if (
      (nAll.includes("tillaeg") || nAll.includes("tillg")) &&
      (nAll.includes("dor") || nAll.includes("doer")) &&
      (currentSection === "walls" || nAll.includes("vaeg"))
    ) {
      const perUnit = unitVal > 0 ? unitVal : 0;
      if (perUnit > 0) {
        pushExtra("walls", { name: raw || "tillæg dør", kind: "per_unit", amount: perUnit });
      } else {
        if (startVal > 0)
          pushExtra("walls", { name: raw || "tillæg dør", kind: "fixed", amount: startVal });
        if (m2Val > 0)
          pushExtra("walls", { name: (raw || "tillæg dør") + " (pr. m²)", kind: "per_m2", amount: m2Val });
      }
      continue;
    }

    // Døre/Vinduer: tillæg ved nyt (treated as fixed per unit) — only in DV context
    if (n.includes("tillg") || n.includes("tillaeg")) {
      const isDV =
        currentSection === "døreOgVinduer" ||
        nAll.includes("vindue") ||
        nAll.includes("vindu") ||
        nAll.includes("dor") ||
        nAll.includes("doer");
      if (isDV && (nAll.includes("nyt") || nAll.includes("ny"))) {
        const val = unitVal > 0 ? unitVal : m2Val > 0 ? m2Val : startVal;
        if (val > 0)
          pushExtra("døre og vinduer", {
            name: raw,
            kind: "fixed",
            amount: val,
          });
      }
      continue;
    }

    // Terrasse: tilvalg trappe (fixed/per m²); ignore pure factors
    if (n.includes("trappe")) {
      if (startVal > 0)
        pushExtra("terrasse", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("terrasse", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Vægge: dør i væg (prefer per-unit if available) — also capture 'tillæg dør' within walls section
    if (
      (nAll.includes("dør") || nAll.includes("dor") || nAll.includes("doer") || nAll.includes("dore")) &&
      (nAll.includes("væg") || nAll.includes("vaeg") || currentSection === "walls")
    ) {
      const perUnit = unitVal > 0 ? unitVal : 0;
      if (perUnit > 0) {
        pushExtra("walls", { name: "dør i væg", kind: "per_unit", amount: perUnit });
      } else {
        if (startVal > 0)
          pushExtra("walls", { name: raw || "dør i væg", kind: "fixed", amount: startVal });
        if (m2Val > 0)
          pushExtra("walls", { name: (raw || "dør i væg") + " (pr. m²)", kind: "per_m2", amount: m2Val });
      }
      continue;
    }

    // Fallback: capture generic 'tillæg dør' as Walls door if not matched above
    if (
      (nAll.includes("tillg") || nAll.includes("tillaeg")) &&
      (nAll.includes("dør") || nAll.includes("dor") || nAll.includes("doer") || nAll.includes("dore"))
    ) {
      const perUnit = unitVal > 0 ? unitVal : 0;
      if (perUnit > 0) {
        pushExtra("walls", { name: raw || "tillæg dør", kind: "per_unit", amount: perUnit });
      } else {
        if (startVal > 0)
          pushExtra("walls", { name: raw || "tillæg dør", kind: "fixed", amount: startVal });
        if (m2Val > 0)
          pushExtra("walls", { name: (raw || "tillæg dør") + " (pr. m²)", kind: "per_m2", amount: m2Val });
      }
      continue;
    }

    // Gulv: tillæg gulvvarme
    if (n.includes("gulv") && n.includes("varme")) {
      if (startVal > 0)
        pushExtra("gulv", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("gulv", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
      continue;
    }

    // Tag: additive lines such as efterisolering, undertag, kviste
    if (
      nAll.includes("efterisolering") ||
      nAll.includes("undertag") ||
      nAll.includes("kvist") ||
      nAll.includes("kviste")
    ) {
      const isKvist = nAll.includes("kvist") || nAll.includes("kviste");
      if (isKvist) {
        const inlineVal = parseDk(rowText);
        const perUnit =
          unitVal > 0
            ? unitVal
            : m2Val > 0
            ? m2Val
            : startVal > 0
            ? startVal
            : inlineVal;
        if (perUnit > 0) {
          const name = raw || "kvist";
          pushExtra("tag", { name, kind: "per_unit", amount: perUnit });
        }
      } else {
        if (startVal > 0)
          pushExtra("tag", { name: raw, kind: "fixed", amount: startVal });
        if (m2Val > 0)
          pushExtra("tag", {
            name: raw + " (pr. m²)",
            kind: "per_m2",
            amount: m2Val,
          });
      }
      continue;
    }
  }

  // Ensure roof base exists from 'fladt' row
  const fladtRow = A.find((r) => norm(String(r?.[0] ?? "")) === "fladt");
  if (fladtRow) {
    const startpris = parseDk(startIdx >= 0 ? fladtRow[startIdx] : 0);
    const m2pris = parseDk(m2Idx >= 0 ? fladtRow[m2Idx] : 0);
    const faktorLav = lavIdx >= 0 ? parseDk(fladtRow[lavIdx]) : 1;
    const faktorHøj = hojIdx >= 0 ? parseDk(fladtRow[hojIdx]) : 1;
    outBase["tag"] = {
      startpris: Number.isFinite(startpris) ? startpris : 0,
      m2pris: Number.isFinite(m2pris) ? m2pris : 0,
      faktorLav: Number.isFinite(faktorLav) && faktorLav !== 0 ? faktorLav : 1,
      faktorNormal: 1,
      faktorHøj: Number.isFinite(faktorHøj) && faktorHøj !== 0 ? faktorHøj : 1,
      beregning: "faktor_kun_pa_m2",
    };
  }

  // ---- Inject items to replace hardcoded logic when missing in Excel ----
  const ensure = (obj, key, def) => {
    if (!obj[key]) obj[key] = def;
  };
  // Facade as extras per m² + after insulation
  ensure(outExtras, "facade", []);
  const facadeNames = outExtras["facade"].map((e) =>
    (e.name || "").toLowerCase()
  );
  if (!facadeNames.some((n) => n.includes("male")))
    outExtras["facade"].push({ name: "male", kind: "per_m2", amount: 250 });
  if (!facadeNames.some((n) => n.includes("pudse")))
    outExtras["facade"].push({ name: "pudse", kind: "per_m2", amount: 200 });
  if (!facadeNames.some((n) => n.includes("træ") || n.includes("trae")))
    outExtras["facade"].push({ name: "træ", kind: "per_m2", amount: 300 });
  if (!facadeNames.some((n) => n.includes("efterisolering")))
    outExtras["facade"].push({
      name: "efterisolering",
      kind: "per_m2",
      amount: 200,
    });

  // Walls: base m2 baseline and extras
  ensure(outBase, "walls", {
    startpris: 0,
    m2pris: 7000,
    faktorLav: 1,
    faktorNormal: 1,
    faktorHøj: 1,
    beregning: "kun_m2",
  });
  ensure(outExtras, "walls", []);
  outExtras["walls"].push({ name: "nyLet", kind: "fixed", amount: 9000 });
  outExtras["walls"].push({ name: "nyBærende", kind: "fixed", amount: 18000 });
  // If no door-in-wall price was parsed, inject a sensible default so the UI toggle affects price
  {
    const hasDoor = (outExtras["walls"] || []).some((e) => {
      const n = String(e.name || "").toLowerCase();
      return n.includes("dør") || n.includes("dor") || n.includes("doer") || n.includes("dore");
    });
    if (!hasDoor) {
      outExtras["walls"].push({ name: "tillæg dør", kind: "fixed", amount: 8000 });
    }
  }

  // Demolition
  ensure(outExtras, "demolition", []);
  outExtras["demolition"].push({ name: "let", kind: "fixed", amount: 7000 });
  outExtras["demolition"].push({
    name: "bærende",
    kind: "fixed",
    amount: 15000,
  });
  outExtras["demolition"].push({
    name: "indvendig",
    kind: "fixed",
    amount: 6000,
  });

  // Heating
  ensure(outExtras, "heating", []);
  outExtras["heating"].push({
    name: "fjernvarme",
    kind: "fixed",
    amount: 12000,
  });
  outExtras["heating"].push({ name: "radiator", kind: "fixed", amount: 8000 });

  // Elektriker per-unit 'stik' (inject only if not provided by Excel)
  ensure(outExtras, "elektriker", outExtras["elektriker"] || []);
  {
    const hasStik = (outExtras["elektriker"] || []).some((e) =>
      String(e.name || "").toLowerCase().includes("stik")
    );
    if (!hasStik) {
      outExtras["elektriker"].push({ name: "stik", kind: "per_unit", amount: 1000 });
    }
  }
  {
    const hasOutlets = (outExtras["elektriker"] || []).some((e) => {
      const n = String(e.name || "").toLowerCase();
      return n.includes("afbrydere") || n.includes("udtag");
    });
  if (!hasOutlets) {
      outExtras["elektriker"].push({
        name: "afbrydere og udtag",
        kind: "per_unit",
    amount: 1600,
      });
    }
  }

  // Køkken: ensure a default "ny placering" exists if not present in Excel
  ensure(outExtras, "køkken", outExtras["køkken"] || []);
  {
    const hasPlacering = (outExtras["køkken"] || []).some((e) =>
      String(e.name || "").toLowerCase().includes("placering")
    );
    if (!hasPlacering) {
      outExtras["køkken"].push({
        name: "ny placering køkken",
        kind: "fixed",
        amount: 30000,
      });
    }
  }

  // Dedupe 'ny placering' lines to avoid double-charging (keep the highest per kind)
  const dedupePlacering = (cat) => {
    const list = outExtras[cat];
    if (!Array.isArray(list) || list.length === 0) return;
    const isPlac = (e) => String(e.name || "").toLowerCase().includes("placering");
    const fixed = list.filter((e) => e.kind === "fixed" && isPlac(e));
    const perM2 = list.filter((e) => e.kind === "per_m2" && isPlac(e));
    const bestFixed = fixed.reduce((a, b) => (b.amount > (a?.amount ?? -1) ? b : a), null);
    const bestPerM2 = perM2.reduce((a, b) => (b.amount > (a?.amount ?? -1) ? b : a), null);
    const others = list.filter(
      (e) => !(isPlac(e) && (e.kind === "fixed" || e.kind === "per_m2"))
    );
    if (bestFixed) others.push(bestFixed);
    if (bestPerM2) others.push(bestPerM2);
    outExtras[cat] = others;
  };
  dedupePlacering("badeværelse");
  dedupePlacering("køkken");

  // Gulv: gulvvarme per m² (only if not already from Excel)
  ensure(outExtras, "gulv", outExtras["gulv"] || []);
  if (
    !outExtras["gulv"].some((e) =>
      String(e.name).toLowerCase().includes("gulvvarme")
    )
  ) {
    outExtras["gulv"].push({ name: "gulvvarme", kind: "per_m2", amount: 500 });
  }

  // Tag: add factors and slope function
  ensure(outExtras, "tag", outExtras["tag"] || []);
  outExtras["tag"].push({ name: "saddeltag", kind: "factor", amount: 1.2 });
  outExtras["tag"].push({ name: "valm", kind: "factor", amount: 1.2 });
  outExtras["tag"].push({
    name: "roofSlope",
    kind: "factor_fn",
    fn: "roofSlopeLinear",
    params: { minDeg: 0, maxDeg: 45, min: 1, max: 2 },
  });
  // Ensure there is a per-unit 'kvist' entry to support antal kviste
  {
    const names = (outExtras["tag"] || []).map((e) =>
      String(e.name || "").toLowerCase()
    );
    if (!names.some((n) => n.includes("kvist"))) {
      outExtras["tag"].push({ name: "kvist", kind: "per_unit", amount: 80000 });
    }
  }

  // Terrasse: factors for hævet/værn
  ensure(outExtras, "terrasse", outExtras["terrasse"] || []);
  outExtras["terrasse"].push({ name: "hævet", kind: "factor", amount: 1.5 });
  outExtras["terrasse"].push({ name: "værn", kind: "factor", amount: 1.2 });

  // Robust fallback: if 'tillæg dør' for walls wasn't found on the main sheet, scan other sheets
  {
    ensure(outExtras, "walls", outExtras["walls"] || []);
    const hasDoor = (outExtras["walls"] || []).some((e) => {
      const n = String(e.name || "").toLowerCase();
      return n.includes("dør") || n.includes("dor") || n.includes("doer");
    });
    if (!hasDoor) {
      const found = { ok: false };
      for (const sheetName of wb.SheetNames) {
        if (found.ok) break;
        const wsAny = wb.Sheets[sheetName];
        const A2 = XLSX.utils.sheet_to_json(wsAny, { header: 1, defval: "" });
        for (let i = 0; i < A2.length; i++) {
          const row = A2[i] || [];
          const rowText = String(row.join(" ") || "");
          const nAll2 = norm(rowText);
          if (
            (nAll2.includes("tillaeg") || nAll2.includes("tillg")) &&
            (nAll2.includes("dor") || nAll2.includes("doer"))
          ) {
            // pick the largest numeric value on this row
            const nums = row.map((c) => parseDk(c)).filter((n) => Number.isFinite(n) && n > 0);
            const val = nums.length ? Math.max(...nums) : 0;
            if (val > 0) {
              outExtras["walls"].push({ name: "tillæg dør", kind: "fixed", amount: val });
              found.ok = true;
              break;
            }
          }
        }
      }
    }
  }

  // ---- Optional second sheet 'postnummer' ----
  const pnSheetName = (wb.SheetNames || []).find((n) => {
    const s = String(n || "").toLowerCase();
    return (
      s.includes("postnummer") ||
      s.includes("postnumre") ||
      s.includes("postnr")
    );
  });
  if (pnSheetName) {
    const wsPn = wb.Sheets[pnSheetName];
    const AP = XLSX.utils.sheet_to_json(wsPn, { header: 1, defval: "" });
    if (AP && AP.length) {
      // Attempt to locate a header row within the first few rows
      let headerRow = -1;
      for (let i = 0; i < Math.min(6, AP.length); i++) {
        const rowTxt = String((AP[i] || []).join(" ")).toLowerCase();
        if (
          rowTxt.includes("post") ||
          rowTxt.includes("fra") ||
          rowTxt.includes("til") ||
          rowTxt.includes("from") ||
          rowTxt.includes("to") ||
          rowTxt.includes("faktor") ||
          rowTxt.includes("indeks")
        ) {
          headerRow = i;
          break;
        }
      }
      const headers = headerRow >= 0 ? AP[headerRow] : [];
      const idxOf = (cands) => {
        if (headerRow < 0) return -1;
        const C = cands.map((s) => norm(s));
        for (let j = 0; j < headers.length; j++) {
          const h = norm(String(headers[j] ?? ""));
          if (C.some((c) => h.includes(c))) return j;
        }
        return -1;
      };
      // Support a broader set of Danish/English header variants
      const fromIdx = idxOf([
        "postnummer lav",
        "postnummer fra",
        "postnr lav",
        "postnr fra",
        "fra postnr",
        "fra",
        "from",
      ]);
      const toIdx = idxOf([
        "postnummer høj",
        "postnummer hoj",
        "postnummer til",
        "postnr hoj",
        "postnr til",
        "til postnr",
        "til",
        "to",
      ]);
      const factorIdx = idxOf([
        "indeksering",
        "faktor",
        "factor",
        "tillæg",
        "tillaeg",
        "prisindeks",
        "pris indeks",
        "prisindex",
        "index",
      ]);

      const noteIdx = idxOf(["note", "bemærkning", "bemaerkning", "kommentar"]);

      if (fromIdx >= 0 && toIdx >= 0 && factorIdx >= 0) {
        for (let i = headerRow + 1; i < AP.length; i++) {
          const r = AP[i] || [];
          const from = parseDk(r[fromIdx]);
          const to = parseDk(r[toIdx]);
          const factor = parseDk(r[factorIdx]);
          const note = String(r[noteIdx] ?? "").trim();
          if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
          if (from <= 0 || to <= 0) continue;
          if (!Number.isFinite(factor) || factor <= 0) continue;
          outPostnr.push({
            from: Math.round(from),
            to: Math.round(to),
            factor: Number(factor),
            note,
          });
        }
      } else {
        // Fallback: assume columns [0]=from, [1]=to, [2]=factor and parse rows
        for (let i = 0; i < AP.length; i++) {
          // Skip the detected header row if any
          if (i === headerRow) continue;
          const r = AP[i] || [];
          const from = parseDk(r[0]);
          const to = parseDk(r[1]);
          const factor = parseDk(r[2]);
          const note = String(r[3] ?? "").trim();
          if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
          if (from <= 0 || to <= 0) continue;
          if (!Number.isFinite(factor) || factor <= 0) continue;
          outPostnr.push({
            from: Math.round(from),
            to: Math.round(to),
            factor: Number(factor),
            note,
          });
        }
        if (outPostnr.length === 0) {
          console.warn(
            "[generate-prices] 'postnummer' sheet present but no valid rows parsed using fallback."
          );
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const out = {
    base: outBase,
    extras: outExtras,
    postnrFaktorer: outPostnr,
    global: {
      multipliers: { basement: 1.2, firstFloor: 1.1 },
      escalation: { baseDate: "2025-01-01", percentPerYear: 0.03 },
    },
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", OUT);
}

main();
