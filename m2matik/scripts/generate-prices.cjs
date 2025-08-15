#!/usr/bin/env node
/*
  Generate public/data/priser.json from public/data/priser-til-beregning.xlsx
  Output structure:
  {
    base: {
      arbejdstype: { startpris, m2pris, faktorLav, faktorNormal: 1, faktorHøj }
      // e.g. maling, badeværelse, tag, gulv, terrasse, køkken, elektriker, døreOgVinduer, stuk, højePaneler
    },
    extras: {
      // category -> add-ons
      tag: [ { name, kind: "fixed"|"per_m2", amount } ],
      terrasse: [ ... ],
      gulv: [ ... ],
      badeværelse: [ ... ],
      køkken: [ ... ],
      elektriker: [ ... ],
      "døre og vinduer": [ ... ],
      maling: [ ... ]
    }
  }
*/
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const EXCEL = path.join(ROOT, "public", "data", "priser-til-beregning.xlsx");
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

  // Scan all rows; capture before and after 'tag'
  for (let i = headerRow + 1; i < A.length; i++) {
    const row = A[i];
    const raw = String(row?.[0] ?? "").trim();
    if (!raw) continue;
    const n = norm(raw);

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
      };
      continue;
    }

    // EXTRAS (non-factor only): capture common add-ons by category
    const startVal = parseDk(startIdx >= 0 ? row[startIdx] : 0);
    const m2Val = parseDk(m2Idx >= 0 ? row[m2Idx] : 0);
    const pushExtra = (cat, item) => {
      if (!outExtras[cat]) outExtras[cat] = [];
      outExtras[cat].push(item);
    };

    // Skip obvious section markers
    if (n === "tag" || n.includes("prisinddex")) continue;

    // Maling extras: træværk, stuk, høje paneler (add as separate fast and per m² lines if present)
    if (
      n === norm("træværk") ||
      n === "traevrk" ||
      n === "traevrk" ||
      n === "traevaerk"
    ) {
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

    // Badeværelse/Køkken: ny placering
    if (
      n.includes("placering") &&
      (n.includes("bad") || n.includes("badvrelse"))
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
      n.includes("placering") &&
      (n.includes("kkken") || n.includes("kkken"))
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

    // Døre/Vinduer: tillæg ved nyt (treated as fixed per unit)
    if (n.includes("tillg") || n.includes("tillaeg")) {
      // Only include if seems like døre og vinduer context
      if (n.includes("nyt")) {
        const val = m2Val > 0 ? m2Val : startVal;
        if (val > 0)
          pushExtra("døre og vinduer", {
            name: raw,
            kind: "fixed",
            amount: val,
          });
      }
      // Skip roof factors and similar here
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

    // Tag: additive lines such as efterisolering, undertag, kviste (fixed per piece) when given as fixed/m2
    if (
      n.includes("efterisolering") ||
      n.includes("undertag") ||
      n.includes("kvist") ||
      n.includes("kviste")
    ) {
      if (startVal > 0)
        pushExtra("tag", { name: raw, kind: "fixed", amount: startVal });
      if (m2Val > 0)
        pushExtra("tag", {
          name: raw + " (pr. m²)",
          kind: "per_m2",
          amount: m2Val,
        });
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
    };
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ base: outBase, extras: outExtras }, null, 2),
    "utf8"
  );
  console.log("Wrote", OUT);
}

main();
