import { useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { FaBath } from "react-icons/fa";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { MdKitchen, MdStairs, MdYard } from "react-icons/md";
import BackButton from "../components/BackButton";
import novaPoint from "../assets/pictures/nova_point.png";
import { loadProjectMeta } from "../lib/storage";
import {
  loadPricesJson,
  type JsonData,
  type JsonPrice,
  baseTotal,
  applyPostnr,
  applyEscalation,
  extrasTotal,
} from "../pricing/json";
import { formatKr, smartRound } from "./renovationTypes";

// Labels and mapping to priser.json keys
const BASE_TYPES = [
  { id: "tilbygning", label: "Tilbygning", key: "tilbygning" },
  { id: "kaelder", label: "Kælder", key: "kælder" },
  { id: "1sal", label: "1. sal", key: "1. sal" },
] as const;

const ADDON_OPTIONS: Array<{
  id: string;
  label: string;
  match: string[];
  Icon: IconType;
}> = [
  {
    id: "badevaerelse",
    label: "Badeværelse",
    match: ["bade", "bad"],
    Icon: FaBath,
  },
  {
    id: "koekken",
    label: "Køkken",
    match: ["køk", "kok", "kÃ¸k", "kkken"],
    Icon: MdKitchen,
  },
  {
    id: "kaeldertrappe",
    label: "Kældertrappe",
    match: ["kældertrappe", "kaeldertrappe", "trappe"],
    Icon: MdStairs,
  },
  {
    id: "beplantning",
    label: "Beplantning/belægning",
    match: ["beplant", "belæg", "belag", "belaeg"],
    Icon: MdYard,
  },
];

const ADVISORY_OPTIONS = [
  { id: "skitser", label: "Skitser" },
  { id: "myndighed", label: "Myndighed" },
  { id: "hovedprojekt", label: "Hovedprojekt" },
  { id: "statik", label: "Statisk beregninger" },
  { id: "tilsyn", label: "Tilsyn" },
] as const;

export default function Addition() {
  const [pricing, setPricing] = useState<JsonData | null>(null);
  const [area, setArea] = useState<number>(30);
  const [baseType, setBaseType] =
    useState<(typeof BASE_TYPES)[number]["id"]>("tilbygning");
  // 3-step quality slider: 0=Lav, 1=Normal, 2=Høj
  const [qualityIdx, setQualityIdx] = useState<0 | 1 | 2>(1);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [postcode, setPostcode] = useState<number | undefined>(undefined);
  const mainRef = useRef<HTMLElement | null>(null);

  // Load priser.json and meta
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await loadPricesJson();
        if (!alive) return;
        setPricing(data);
      } catch (e) {
        console.warn("Failed to load priser.json", e);
        setPricing({ base: {}, extras: {} });
      }
      const meta = loadProjectMeta();
      if (meta) {
        const pc = Number(String(meta.postcode || "").replace(/[^0-9]/g, ""));
        setPostcode(Number.isFinite(pc) ? pc : undefined);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const baseRow: JsonPrice | undefined = useMemo(() => {
    if (!pricing) return undefined;
    // Prefer explicit keys; fallback to 'tilbygning' for robustness
    if (baseType === "tilbygning") return pricing.base["tilbygning"];
    if (baseType === "1sal")
      return pricing.base["1. sal"] || pricing.base["tilbygning"];
    // kælder
    return pricing.base["kælder"] || pricing.base["tilbygning"];
  }, [pricing, baseType]);

  const qualityLabel: "lav" | "normal" | "høj" =
    qualityIdx === 0 ? "lav" : qualityIdx === 2 ? "høj" : "normal";

  // Compute add-ons total from extras category "tilbygning"
  const addonsTotal = useMemo(() => {
    if (!pricing) return 0;
    // Use match tokens for robust substring matching in extrasTotal
    const picks = ADDON_OPTIONS.filter((o) => addons[o.id])
      .flatMap((o) => o.match)
      .filter(Boolean);
    const list = pricing.extras?.["tilbygning"] || [];
    return extrasTotal(list, area, picks);
  }, [pricing, addons, area]);

  const baseSubtotal = useMemo(() => {
    if (!baseRow) return 0;
    return baseTotal(baseRow, area, qualityLabel);
  }, [baseRow, area, qualityLabel]);

  const subtotal = Math.max(0, Math.round(baseSubtotal + addonsTotal));

  const afterPostnr = useMemo(() => {
    const rules = pricing?.postnrFaktorer || [];
    return applyPostnr(subtotal, postcode, rules);
  }, [pricing, subtotal, postcode]);

  // (postnrRule removed; simple label restored)

  const finalEstimate = useMemo(() => {
    const esc = pricing?.global?.escalation;
    return applyEscalation(afterPostnr, esc);
  }, [pricing, afterPostnr]);

  const qualityText: "Budget" | "Standard" | "Eksklusiv" =
    qualityIdx === 0 ? "Budget" : qualityIdx === 2 ? "Eksklusiv" : "Standard";

  // Advisory helpers (not included in total)
  const advisoryCost = (label: string, m2: number) => {
    if (!pricing) return 0;
    const list = pricing.extras?.["tilbygning_rådgivning"] || [];
    return extrasTotal(list, m2, [label]);
  };

  // UI helpers
  const isChecked = (id: string) => !!addons[id];
  const toggleAddon = (id: string) =>
    setAddons((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <main ref={mainRef} className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center gap-3 mb-2">
          <BackButton />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-5 sm:mb-6">
          Tilbygning
        </h1>

        {/* Layout: content + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main card */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6">
            <div className="space-y-6">
              {/* Area */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm text-slate-600">
                    Areal (m²)
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={area}
                      onChange={(e) =>
                        setArea(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full bg-white rounded-lg px-3 py-2 pr-10 shadow-sm ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      m²
                    </span>
                  </div>
                </label>

                {/* Base type */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm text-slate-600">
                    Type
                  </span>
                  <select
                    className="w-full bg-white rounded-lg px-3 py-2 shadow-sm ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={baseType}
                    onChange={(e) =>
                      setBaseType(
                        e.target.value as (typeof BASE_TYPES)[number]["id"]
                      )
                    }
                  >
                    {BASE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Quality slider (Tilbygning + Kælder), hidden for 1. sal) */}
              {(baseType === "tilbygning" || baseType === "kaelder") && (
                <div className="flex flex-col gap-1 mt-1 sm:mt-2">
                  <span className="text-sm sm:text-base font-medium text-slate-700">
                    Kvalitet
                  </span>
                  {/* scale labels */}
                  <div className="grid grid-cols-3 text-sm text-slate-700 font-medium px-1 mb-2">
                    <span>Budget</span>
                    <span className="text-center">Standard</span>
                    <span className="text-right">Eksklusiv</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={1}
                      value={qualityIdx}
                      onChange={(e) =>
                        setQualityIdx(Number(e.target.value) as 0 | 1 | 2)
                      }
                      className="w-full accent-blue-600 [--tw-ring-offset-shadow:0_0_#0000] [--tw-ring-shadow:0_0_#0000] focus:outline-none"
                      aria-label="Kvalitet"
                      aria-valuetext={qualityText}
                    />
                  </div>
                  {/** Removed caption under slider per request */}
                </div>
              )}

              {/* Add-ons */}
              <div className="pt-2">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-2">
                  Tilvalg
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ADDON_OPTIONS.map((o) => (
                    <label
                      key={o.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 accent-blue-600 border border-slate-300 rounded"
                        checked={isChecked(o.id)}
                        onChange={() => toggleAddon(o.id)}
                      />
                      <o.Icon
                        className="text-slate-500"
                        size={22}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-slate-800">{o.label}</span>
                    </label>
                  ))}
                </div>
                {pricing &&
                  (pricing.extras?.["tilbygning"] || []).length === 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Bemærk: Ingen tilvalgspriser fundet i data – beløb vises
                      som 0 kr.
                    </p>
                  )}
              </div>
            </div>
          </section>

          {/* Summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 sticky top-4">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-3">
                Oversigt
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Base" value={formatKr(smartRound(baseSubtotal))} />
                <Row
                  label="Tilvalg"
                  value={formatKr(smartRound(addonsTotal))}
                />
                <Divider />
                <Row label="Subtotal" value={formatKr(smartRound(subtotal))} />
                <Row
                  label={`Efter postnr. faktor${
                    postcode ? ` (postnr ${postcode})` : ""
                  }`}
                  value={formatKr(smartRound(afterPostnr))}
                />
                <Divider />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600">Estimat</span>
                  <span className="text-xl font-semibold tracking-tight tabular-nums">
                    {formatKr(smartRound(finalEstimate))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Inkl. postnr. faktor og evt. indeksering
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Advisory examples (not included in total) */}
        <section className="mt-5 sm:mt-7 bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Rådgivning (eksempler)
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Viser priseksempler for 30 m² og 80 m². Indgår ikke i totalen.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4 font-medium">Ydelse</th>
                  <th className="py-2 pr-4 font-semibold text-right">30 m²</th>
                  <th className="py-2 pr-4 font-semibold text-right">80 m²</th>
                </tr>
              </thead>
              <tbody>
                {ADVISORY_OPTIONS.map((a) => {
                  const c30 = advisoryCost(a.label, 30);
                  const c80 = advisoryCost(a.label, 80);
                  return (
                    <tr
                      key={a.id}
                      className="border-b last:border-b-0 odd:bg-neutral-50"
                    >
                      <td className="py-2 pr-4 text-slate-800">{a.label}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatKr(smartRound(c30))}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatKr(smartRound(c80))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pricing &&
            (pricing.extras?.["tilbygning_rådgivning"] || []).length === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Bemærk: Ingen rådgivningspriser fundet i data – beløb vises som
                0 kr.
              </p>
            )}
        </section>
      </div>

      {/* Footer disclaimer inside main to keep spacing tight */}
      <footer
        id="footer-disclaimer"
        role="contentinfo"
        className="mt-6 px-4 pb-24 md:pb-8 text-[11px] sm:text-xs text-gray-600 max-w-3xl mx-auto border-t border-gray-200 pt-4 relative"
      >
        {/* Mascot pointing to the disclaimer – sits just outside the left side on larger screens */}
        <figure className="hidden md:flex md:absolute md:bottom-4 md:left-0 md:-translate-x-[82%] flex-col items-center pointer-events-auto select-none z-10 group">
          <img
            src={novaPoint}
            alt="Maskot der peger på ansvarsfraskrivelsen"
            className="w-12 sm:w-16 md:w-20 h-auto drop-shadow-md"
            loading="lazy"
            decoding="async"
          />
          <figcaption className="mt-1 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            © Mohammad Mansour
          </figcaption>
        </figure>
        <p className="flex items-start gap-1.5">
          <AiOutlineInfoCircle className="mt-[2px] text-blue-600" />
          <span>
            <strong>Bemærk:</strong> Beregningen er vejledende og baseret på
            overordnede forhold og vores erfaringspriser ud fra tidligere
            projekter. Faktiske priser vil variere afhængigt af projektets
            omfang, forhold på grunden og andre specifikke forhold. Vi anbefaler
            altid at få en rådgiver til at gennemgå projektet for et mere
            præcist estimat. Mads Windfeldt Arkitekter kan ikke holdes
            ansvarlige for eventuelle afvigelser mellem prisberegnerens estimat
            og den endelige projektøkonomi.
          </span>
        </p>
      </footer>

      {/* Sticky total bar on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div>
          <div className="text-xs text-slate-600">Estimat</div>
          <div className="text-lg font-semibold">
            {formatKr(smartRound(finalEstimate))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span
        className={
          strong
            ? "font-semibold text-right tabular-nums"
            : "text-right tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t my-2" />;
}
