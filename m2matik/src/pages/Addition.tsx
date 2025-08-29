import { useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { FaBath } from "react-icons/fa";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { MdKitchen, MdStairs, MdYard, MdHome } from "react-icons/md";
import BackButton from "../components/BackButton";
import novaPoint from "../assets/pictures/nova_point.png";
import { loadProjectMeta } from "../lib/storage";
import {
  loadPricesJson,
  type JsonData,
  type JsonPrice,
  applyPostnr,
  applyEscalation,
  extrasTotal,
  
} from "../pricing/json";
import { formatKr, smartRound } from "./renovationTypes";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

const BASE_TYPES = [
  { id: "tilbygning", label: "Tilbygning", key: "tilbygning" },
  { id: "1sal", label: "1. sal på eksisterende hus", key: "1. sal" },
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
    match: ["tillæg badeværelse", "badevaerelse", "badeværelse"],
    Icon: FaBath,
  },
  {
    id: "koekken",
    label: "Køkken",
    match: ["tilllæg køkken", "koekken", "køkken"],
    Icon: MdKitchen,
  },
  {
    id: "kaeldertrappe",
    label: "Kældertrappe",
    match: ["tillæg kældertrappe", "kaeldertrappe", "kældertrappe", "trappe"],
    Icon: MdStairs,
  },
  {
    id: "beplantning",
    label: "Beplantning/belægning",
    match: [
      "beplatning  / belægning mv",
      "beplantning",
      "belægning",
      "beplatning",
      "belægning mv",
    ],
    Icon: MdYard,
  },
];

export default function Addition() {
  // Advisory table helpers
  // ...state declarations...

  // Advisory table helpers (after pricing is defined)
  const [pricing, setPricing] = useState<JsonData | null>(null);
  const [area, setArea] = useState<number>(30);
  const [baseType, setBaseType] =
    useState<(typeof BASE_TYPES)[number]["id"]>("tilbygning");
  // 5-stop quality slider (0..4) like Renovation
  const [qualityIdx, setQualityIdx] = useState<0 | 1 | 2 | 3 | 4>(2);
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
    // Two types: Tilbygning or 1. sal på eksisterende hus
    if (baseType === "tilbygning") return pricing.base["tilbygning"];
    // baseType === '1sal' — use 1. sal if present, else fall back to Tilbygning only if missing
    return pricing.base["1. sal"] || pricing.base["tilbygning"];
  }, [pricing, baseType]);

  // (qualityLabel removed; using 5-stop interpolation directly)

  // Compute add-ons total from extras category "tilbygning"
  const addonsTotal = useMemo(() => {
    if (!pricing) return 0;
    // Instead of passing IDs, pass all match strings for checked add-ons
    const pickedMatches = Object.keys(addons)
      .filter((id) => addons[id])
      .flatMap((id) => {
        const opt = ADDON_OPTIONS.find((o) => o.id === id);
        return opt ? opt.match : [];
      });
    return extrasTotal(
      pricing.extras?.["tilbygning"] || [],
      area,
      pickedMatches
    );
  }, [pricing, area, addons]);

  // Calculate base subtotal using 5 quality levels
  const baseSubtotal = useMemo(() => {
    const qualityFactors = [0.8, 0.9, 1, 1.3, 1.6]; // Example: adjust as needed
    if (!baseRow) return 0;
    const factor = qualityFactors[qualityIdx] ?? 1;
    const sqm = Math.max(0, area);
    switch (baseRow.beregning) {
      case "faktor_kun_pa_start":
        return Math.max(
          0,
          Math.round(baseRow.startpris * factor + baseRow.m2pris * sqm)
        );
      case "faktor_kun_pa_m2":
        return Math.max(
          0,
          Math.round(baseRow.startpris + baseRow.m2pris * sqm * factor)
        );
      case "kun_start_med_faktor":
        return Math.max(0, Math.round(baseRow.startpris * factor));
      case "kun_start":
        return Math.max(0, Math.round(baseRow.startpris));
      case "kun_m2":
        return Math.max(0, Math.round(baseRow.m2pris * sqm));
      default:
        return Math.max(
          0,
          Math.round(baseRow.startpris + baseRow.m2pris * sqm * factor)
        );
    }
  }, [baseRow, area, qualityIdx]);

  // Quality text helper
  const qualityText = ["Basis", "Basis", "Standard", "Eksklusiv", "Eksklusiv"][
    qualityIdx
  ];
  // Addon helpers
  const isChecked = (id: string) => !!addons[id];
  const toggleAddon = (id: string) =>
    setAddons((prev) => ({ ...prev, [id]: !prev[id] }));

  const subtotal = Math.max(0, Math.round(baseSubtotal + addonsTotal));

  // Calculate final estimate (after postnr and escalation)
  const afterPostnr = useMemo(() => {
    const rules = pricing?.postnrFaktorer || [];
    return applyPostnr(subtotal, postcode, rules);
  }, [pricing, subtotal, postcode]);

  const finalEstimate = useMemo(() => {
    const esc = pricing?.global?.escalation;
    return applyEscalation(afterPostnr, esc);
  }, [pricing, afterPostnr]);

  // Advisory table helpers (after all state/hooks)
  // moved inside useMemo below

  return (
    <main ref={mainRef} className="min-h-screen bg-slate-50">
      <div>
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
                {/* Base type */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-700 mb-1">
                    Type
                  </span>
                  <div className="border-b border-slate-300 pb-2">
                    <Select
                      value={baseType}
                      onValueChange={(v) =>
                        setBaseType(v as (typeof BASE_TYPES)[number]["id"])
                      }
                    >
                      <SelectTrigger className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base font-semibold text-slate-800 bg-white">
                        <SelectValue placeholder="Vælg type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-lg shadow-lg border border-gray-200 mt-1">
                        {BASE_TYPES.map((opt) => (
                          <SelectItem
                            key={opt.id}
                            value={opt.id}
                            className="flex items-center px-4 py-2 cursor-pointer text-base rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                          >
                            <span className="font-medium text-slate-800">
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </label>

                <div className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm text-slate-600">
                    Areal (m²)
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10}
                      max={250}
                      step={1}
                      value={area}
                      onChange={(e) =>
                        setArea(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full accent-blue-600"
                      aria-label="Areal (m²)"
                    />
                    <input
                      type="number"
                      min={1}
                      className="w-24 bg-white rounded-lg px-3 py-2 shadow-sm ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      value={area}
                      onChange={(e) =>
                        setArea(Math.max(1, Number(e.target.value)))
                      }
                      aria-label="Areal (m²)"
                    />
                  </div>
                </div>

                {/* Quality slider: 5 stops (0..4) like Renovation */}
                <div className="flex flex-col gap-1 mt-1 sm:mt-2">
                  <span className="text-sm sm:text-base font-medium text-slate-700">
                    Kvalitet
                  </span>
                  {/* scale labels: show 3 categories while slider has 5 stops */}
                  <div className="grid grid-cols-3 text-xs sm:text-sm text-slate-700 font-medium px-1 mb-2">
                    <span>Basis</span>
                    <span className="text-center">Standard</span>
                    <span className="text-right">Eksklusiv</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={4}
                      step={1}
                      value={qualityIdx}
                      onChange={(e) =>
                        setQualityIdx(
                          Number(e.target.value) as 0 | 1 | 2 | 3 | 4
                        )
                      }
                      className="w-full accent-blue-600 [--tw-ring-offset-shadow:0_0_#0000] [--tw-ring-shadow:0_0_#0000] focus:outline-none"
                      aria-label="Kvalitet"
                      aria-valuetext={qualityText}
                    />
                  </div>
                </div>

                {/* Add-ons */}
                <div className="pt-2">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-2">
                    Tilvalg
                  </h2>
                  {/* Basement toggle that auto-activates basement stairs */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <label className="inline-flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 accent-blue-600 border border-slate-300 rounded"
                        checked={!!addons["kaelder"]}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAddons((prev) => {
                            const next: Record<string, boolean> = {
                              ...prev,
                              kaelder: checked,
                            };
                            // Link: toggle basement stairs with basement selection
                            next.kaeldertrappe = checked ? true : false;
                            return next;
                          });
                        }}
                      />
                      <MdHome
                        className="text-slate-500"
                        size={22}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-slate-800">Kælder</span>
                    </label>
                    {addons.kaelder && (
                      <label className="inline-flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="size-5 shrink-0 accent-blue-600 border border-slate-300 rounded"
                          checked={!!addons["kaeldertrappe"]}
                          onChange={() => toggleAddon("kaeldertrappe")}
                        />
                        <MdStairs
                          className="text-slate-500"
                          size={22}
                          aria-hidden="true"
                        />
                        <span className="text-sm text-slate-800">
                          Kældertrappe
                        </span>
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ADDON_OPTIONS.filter((o) => o.id !== "kaeldertrappe").map(
                      (o) => (
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
                          <span className="text-sm text-slate-800">
                            {o.label}
                          </span>
                        </label>
                      )
                    )}
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
                  <Row
                    label="Base"
                    value={formatKr(smartRound(baseSubtotal))}
                  />
                  <Row
                    label="Tilvalg"
                    value={formatKr(smartRound(addonsTotal))}
                  />
                  <Divider />
                  <Row
                    label="Subtotal"
                    value={formatKr(smartRound(subtotal))}
                  />
                  <Divider />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600">Estimat samlet pris</span>
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 border-b">
                    <th className="py-2 pr-4 font-medium">Ydelse</th>
                    <th className="py-2 pr-4 font-semibold text-right">
                      Pris (for {area} m²)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const norm = (s: string) =>
                      String(s || "")
                        .toLowerCase()
                        .replace(/[^a-zæøå0-9]/gi, "");
                    const advisoryRowsList = [
                      "Skitser",
                      "Myndighedsansøgning",
                      "Hovedprojekt",
                      "Statisk beregninger",
                      "Tilsyn og byggeledelse",
                    ];
                    const advisoryList =
                      pricing?.extras?.["tilbygning_rådgivning"] || [];
                    return advisoryRowsList.map((label) => {
                      // Find fixed and per_m2 prices for each advisory item
                      const fixed = advisoryList.find(
                        (item) =>
                          norm(item.name) === norm(label) &&
                          item.kind === "fixed"
                      );
                      const perM2 = advisoryList.find(
                        (item) =>
                          norm(item.name).includes(norm(label)) &&
                          item.kind === "per_m2"
                      );
                      const startpris =
                        fixed &&
                        "amount" in fixed &&
                        typeof fixed.amount === "number"
                          ? fixed.amount
                          : 0;
                      const m2pris =
                        perM2 &&
                        "amount" in perM2 &&
                        typeof perM2.amount === "number"
                          ? perM2.amount
                          : 0;
                      const hasData = m2pris !== 0 || startpris !== 0;
                      const price = hasData
                        ? Math.round(m2pris * area + startpris)
                        : null;
                      return (
                        <tr
                          key={label}
                          className="border-b last:border-b-0 odd:bg-neutral-50"
                        >
                          <td className="py-2 pr-4 text-slate-800">{label}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {hasData
                              ? price! > 0
                                ? price!.toLocaleString("da-DK") + " kr."
                                : "0 kr."
                              : "—"}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Rådgivningspriser er vejledende og afhænger af projektets omfang.
              Disse indgår ikke i totalen.
            </p>
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
              omfang, forhold på grunden og andre specifikke forhold. Vi
              anbefaler altid at få en rådgiver til at gennemgå projektet for et
              mere præcist estimat. Mads Windfeldt Arkitekter kan ikke holdes
              ansvarlige for eventuelle afvigelser mellem prisberegnerens
              estimat og den endelige projektøkonomi.
            </span>
          </p>
        </footer>

        {/* Sticky total bar on mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div>
            <div className="text-xs text-slate-600">Estimat samlet pris</div>
            <div className="text-lg font-semibold">
              {formatKr(smartRound(finalEstimate))}
            </div>
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
