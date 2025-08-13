import xlsx from "xlsx";

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseDkNumber(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim();
  if (!s) return 0;
  const cleaned = s.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const file = "public/data/priser-til-beregning.xlsx";
const wb = xlsx.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const A = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });

const base = {};
const extras = {};

let headerRow = -1;
for (let i = 0; i < A.length; i++) {
  const c0 = norm(A[i]?.[0] ?? "");
  if (c0 === norm("arbejdstype")) {
    headerRow = i;
    break;
  }
}
if (headerRow === -1) {
  console.error("Header row not found");
  process.exit(1);
}
const H = A[headerRow];
const colIndex = (labels) => {
  const cands = labels.map(norm);
  for (let j = 0; j < H.length; j++) {
    const h = norm(H[j] || "");
    if (!h) continue;
    if (cands.some((c) => h.includes(c))) return j;
  }
  return -1;
};
const idxStart = colIndex(["start pris", "startpris"]);
const idxM2 = colIndex(["m2 pris", "m2pris", "pris pr m2", "kr/m2"]);
const idxLav = colIndex(["laveste kvalitet faktor", "lav"]);
const idxHoj = colIndex(["højeste kvalitet faktor", "hoj", "høj"]);

let i = headerRow + 1;
for (; i < A.length; i++) {
  const row = A[i];
  const raw = String(row?.[0] ?? "").trim();
  const key = norm(raw);
  if (!raw) continue;
  if (key === norm("tag")) break;
  const start = parseDkNumber(idxStart >= 0 ? row[idxStart] : 0);
  const m2 = parseDkNumber(idxM2 >= 0 ? row[idxM2] : 0);
  const lav = parseDkNumber(idxLav >= 0 ? row[idxLav] : 0) || undefined;
  const hoj = parseDkNumber(idxHoj >= 0 ? row[idxHoj] : 0) || undefined;
  base[key] = {
    key,
    startpris: start,
    m2pris: m2,
    faktorLav: lav,
    faktorHøj: hoj,
  };
  if ([norm("træværk"), norm("stuk"), norm("høje paneler")].includes(key)) {
    const cat = norm("maling");
    extras[cat] ||= [];
    if (m2 > 0) extras[cat].push({ name: raw, kind: "per_m2", amount: m2 });
    if (start > 0)
      extras[cat].push({ name: raw, kind: "fixed", amount: start });
  }
  if (key === norm("ny placering bad")) {
    const cat = norm("badeværelse");
    extras[cat] ||= [];
    if (start > 0)
      extras[cat].push({ name: raw, kind: "fixed", amount: start });
    if (m2 > 0) extras[cat].push({ name: raw, kind: "per_m2", amount: m2 });
  }
  if (
    key.includes(norm("tillæg  ved nyt")) ||
    key.includes(norm("tillaeg  ved nyt"))
  ) {
    const cat = norm("døre og vinduer");
    extras[cat] ||= [];
    const val = m2 > 0 ? m2 : start;
    if (val > 0) extras[cat].push({ name: raw, kind: "fixed", amount: val });
  }
}

for (let r = i + 1; r < A.length; r++) {
  const row = A[r];
  const raw = String(row?.[0] ?? "").trim();
  const key = norm(raw);
  if (!raw) continue;
  if (key === norm("fladt")) {
    const start = parseDkNumber(idxStart >= 0 ? row[idxStart] : 0);
    const m2 = parseDkNumber(idxM2 >= 0 ? row[idxM2] : 0);
    const lav = parseDkNumber(idxLav >= 0 ? row[idxLav] : 0) || undefined;
    const hoj = parseDkNumber(idxHoj >= 0 ? row[idxHoj] : 0) || undefined;
    base[norm("tag")] = {
      key: norm("tag"),
      startpris: start,
      m2pris: m2,
      faktorLav: lav,
      faktorHøj: hoj,
    };
    continue;
  }
  if (key.includes(norm("tillæg")) || key.includes(norm("tillaeg"))) {
    const cat = norm("tag");
    extras[cat] ||= [];
    const start = parseDkNumber(idxStart >= 0 ? row[idxStart] : 0);
    const m2 = parseDkNumber(idxM2 >= 0 ? row[idxM2] : 0);
    const isFactor = m2 && m2 >= 0.9 && m2 <= 5;
    if (isFactor) extras[cat].push({ name: raw, kind: "factor", amount: m2 });
    if (start > 0)
      extras[cat].push({ name: raw, kind: "fixed", amount: start });
    if (!isFactor && m2 > 0)
      extras[cat].push({ name: raw, kind: "per_m2", amount: m2 });
  }
}

// Checks
const maling = base[norm("maling")];
const okPainting =
  !!maling &&
  Math.abs(maling.startpris - 5000) <= 10 &&
  Math.abs(maling.m2pris - 1400) <= 10;
const roofE = (extras[norm("tag")] || []).map((e) => e.name.toLowerCase());
const hasSaddel = roofE.some((n) => n.includes("saddeltag"));
const hasValm = roofE.some((n) => n.includes("valm"));
const hasEfter = roofE.some((n) => n.includes("efterisolering"));

console.log(
  JSON.stringify(
    {
      baseKeys: Object.keys(base),
      painting: maling,
      okPainting,
      roofExtras: extras[norm("tag")] || [],
      checks: { hasSaddel, hasValm, hasEfter },
    },
    null,
    2
  )
);
