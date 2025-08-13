import { useEffect, useMemo, useState } from "react";
import { FaPaintRoller, FaBath, FaDoorOpen } from "react-icons/fa";
import { GiBrickWall } from "react-icons/gi";
import {
  MdBalcony,
  MdOutlineRoofing,
  MdHouseSiding,
  MdKitchen,
  MdOutlineElectricalServices,
} from "react-icons/md";
import { RiLayoutGridLine } from "react-icons/ri";
import { FaHouseFire } from "react-icons/fa6";
import PaintingEditor from "../components/editors/PaintingEditor";
import FloorEditor from "../components/editors/FloorEditor";
import BathEditor from "../components/editors/BathEditor";
import DoorWindowEditor from "../components/editors/DoorWindowEditor";
import TerraceEditor from "../components/editors/TerraceEditor";
import RoofEditor from "../components/editors/RoofEditor";
import FacadeEditor from "../components/editors/FacadeEditor";
import WallsEditor from "../components/editors/WallsEditor";
import HeatingEditor from "../components/editors/HeatingEditor";
import ElectricityEditor from "../components/editors/ElectricityEditor";
import KitchenEditor from "../components/editors/KitchenEditor";
import InfoTooltip from "../components/InfoTooltip";
import { loadProjectMeta, saveProjectMeta } from "../lib/storage";
import type { ProjectMeta } from "../lib/storage";
import type { AnyItem, ItemDøreVinduer } from "./renovationTypes";
import {
  BASE_DATE,
  ANNUAL_ADJUSTMENT,
  newUID,
  perM2,
  formatKr,
  smartRound,
} from "./renovationTypes";
import {
  loadPricingFromExcel,
  qualityToLabel,
  calcBaseTotal,
  calcExtrasTotal,
  UI_TO_EXCEL_KEY,
} from "../pricing/excel";
import type { BaseMap, ExtrasMap } from "../pricing/excel";

// ---------- Komponent ----------
export default function RenovationWithList() {
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [entered, setEntered] = useState(false);

  // Lokal kopi når man redigerer
  const [draftMeta, setDraftMeta] = useState<ProjectMeta | null>(null);

  // Manuel prisjustering i %
  const [manualAdjustment, setManualAdjustment] = useState(0);

  // Projekt liste med individuelle poster
  const [items, setItems] = useState<AnyItem[]>([]);

  // Excel pricing
  const [excelBase, setExcelBase] = useState<BaseMap | null>(null);
  const [excelExtras, setExcelExtras] = useState<ExtrasMap | null>(null);
  // no explicit ready flag; we treat null base/extras as not-yet-loaded

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { base, extras } = await loadPricingFromExcel();
        if (!mounted) return;
        setExcelBase(base);
        setExcelExtras(extras);
      } catch (e) {
        console.warn("Failed to load Excel pricing:", e);
        setExcelBase({});
        setExcelExtras({});
      } finally {
        // noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Hent meta (areal, kælder, 1. sal)
  useEffect(() => {
    const m = loadProjectMeta();
    if (m) {
      const normalized: ProjectMeta = {
        ...m,
        postcode: typeof m.postcode === "string" ? m.postcode : "",
      };
      setMeta(normalized);
    } else {
      setMeta(null);
    }
    // trigger mount animation next tick
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const AREA = meta ? Math.max(60, Math.min(300, meta.sizeM2 || 0)) : 0;

  // Kort / muligheder (bruges til UI og "Fra"-pris på kortene)
  const options = [
    {
      id: "maling",
      label: "Maling",
      icon: <FaPaintRoller />,
      info: "Maling: Overfladebehandling af vægge/lofter inkl. evt. ekstra detaljer.",
    },
    {
      id: "gulv",
      label: "Gulv",
      icon: <RiLayoutGridLine size={22} />,
      info: "Gulv: Udskiftning / renovering af gulv – kvalitet og gulvvarme.",
    },
    {
      id: "bad",
      label: "Bad",
      icon: <FaBath />,
      info: "Bad: Renovering eller flytning af badeværelse.",
    },
    {
      id: "døreOgVinduer",
      label: "Døre/vinduer",
      icon: <FaDoorOpen className="w-5 h-5" />,
      info: "Døre/Vinduer: Udskiftning eller etablering af nye åbninger.",
    },
    {
      id: "terrasse",
      label: "Terrasse",
      icon: <MdBalcony size={22} />,
      info: "Terrasse: Opbygning inkl. ekstra som hævet dæk, trappe og værn.",
    },
    {
      id: "roof",
      label: "Tag",
      icon: <MdOutlineRoofing size={22} />,
      info: "Tag: Nyt tag / materialeskifte og evt. efterisolering.",
    },
    {
      id: "Facade",
      label: "Facade",
      icon: <MdHouseSiding size={22} />,
      info: "Facade: Overfladebehandling eller ny beklædning + efterisolering.",
    },
    {
      id: "walls",
      label: "Vægge",
      icon: <GiBrickWall />,
      info: "Vægge: Nedrivning af vægge og opbygning af nye.",
    },
    {
      id: "heating",
      label: "Varme",
      icon: <FaHouseFire size={22} />,
      info: "Varme: Valg af varmesystem (fjernvarme/radiator).",
    },
    {
      id: "el",
      label: "Elinstallation",
      icon: <MdOutlineElectricalServices size={22} />,
      info: "El: Nye stikkontakter, tavle og skjulte føringer.",
    },
    {
      id: "køkken",
      label: "Køkken",
      icon: <MdKitchen size={22} />,
      info: "Køkken: Standard renovering eller flytning til ny placering.",
    },
  ] as const;

  // Auto + manuel prisjustering
  const yearsSinceBase = () =>
    (new Date().getTime() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const autoFactor = Math.pow(1 + ANNUAL_ADJUSTMENT, yearsSinceBase());
  const manualFactor =
    1 + (isNaN(manualAdjustment) ? 0 : manualAdjustment) / 100;

  // Tilføj en ny post ud fra kortvalg
  const addItem = (typeId: AnyItem["typeId"]) => {
    const label = options.find((o) => o.id === typeId)?.label || typeId;
    let item: AnyItem;
    switch (typeId) {
      case "maling":
        item = {
          uid: newUID(),
          typeId,
          label,
          paintQuality: 1,
          extras: {},
          coveragePercent: 100,
        };
        break;
      case "gulv":
        item = {
          uid: newUID(),
          typeId,
          label,
          floorQuality: 1,
          hasFloorHeating: false,
        };
        break;
      case "bad":
        item = {
          uid: newUID(),
          typeId,
          label,
          bathPlacement: "same",
          count: 1,
          bathQuality: 1,
        };
        break;
      case "døreOgVinduer":
        item = {
          uid: newUID(),
          typeId,
          label,
          choice: "door",
          operation: "replacement",
          newInstall: "door",
          count: 1,
          quality: 1,
          sizeScale: 50,
        } as any;
        break;
      case "terrasse":
        item = {
          uid: newUID(),
          typeId,
          label,
          area: 0,
          extra: {},
        } as any;
        break;
      case "roof":
        item = {
          uid: newUID(),
          typeId,
          label,
          roofPitch: 0,
          roofQuality: 0,
          extras: {
            saddeltag: false,
            valm: false,
            undertag: false,
            efterisolering: false,
            kviste: 0,
          },
        } as any;
        break;
      case "Facade":
        item = {
          uid: newUID(),
          typeId,
          label,
          finish: "male",
          afterIso: false,
        } as any;
        break;
      case "walls":
        item = {
          uid: newUID(),
          typeId,
          label,
          demoLet: false,
          demoBærende: false,
          demoIndvendig: false,
          nyLet: false,
          nyBærende: false,
        } as any;
        break;
      case "heating":
        item = {
          uid: newUID(),
          typeId,
          label,
          system: "radiator",
        } as any;
        break;
      case "el":
        item = {
          uid: newUID(),
          typeId,
          label,
          outletCount: 0,
          stikCount: 0,
          newPanel: false,
          hiddenRuns: false,
          evCharger: false,
        } as any;
        break;
      case "køkken":
        item = {
          uid: newUID(),
          typeId,
          label,
          placement: "same",
          quality: 1,
        } as any;
        break;
      default:
        return;
    }

    setItems((prev) => [...prev, item]);
  };

  // Fjern en enkelt post
  const removeItem = (uid: string) =>
    setItems((prev) => prev.filter((i) => i.uid !== uid));

  // Opdater en post (immutable)
  const updateItem = (uid: string, key: string, val: unknown) => {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? ({ ...i, [key]: val } as AnyItem) : i))
    );
  };

  // Pris for én post (før auto + manuel)
  const calcItemBasePrice = (it: AnyItem): number => {
    const basementFactor = meta?.basement ? 1.2 : 1;
    const firstFloorFactor = meta?.firstFloor ? 1.1 : 1;

    let price = 0;

    switch (it.typeId) {
      case "maling": {
        // Excel-driven painting: base scaled by coverage and quality
        const coverage =
          Math.max(0, Math.min(100, (it as any).coveragePercent ?? 100)) / 100;
        const areaCovered = AREA * coverage;
        const row = excelBase?.[UI_TO_EXCEL_KEY.maling || "maling"];
        if (!row)
          console.warn("No Excel row for painting", {
            key: UI_TO_EXCEL_KEY.maling,
          });
        const qLbl = qualityToLabel((it.paintQuality ?? 1) as 0 | 1 | 2);
        price += calcBaseTotal(row, areaCovered, qLbl);

        // Independent tasks: Høje paneler and Stuk use their own area & quality
        const baseMap = excelBase || {};
        const getRow = (name: string) => {
          const normLocal = (s: string) =>
            String(s || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/\p{Diacritic}/gu, "")
              .replace(/\s+/g, "")
              .replace(/[^a-z0-9_.-]/g, "");
          return baseMap[normLocal(name)];
        };

        // Træværk as a simple extra proportional to painted area (kept as before)
        if (it.extras?.træværk) {
          const rowTv = getRow("Træværk");
          if (rowTv) price += calcBaseTotal(rowTv, areaCovered, qLbl);
        }

        // Høje paneler: pris beregnes uafhængigt af coverage, med fuldt areal og samme kvalitet som maling
        if (it.extras?.paneler) {
          const rowP = getRow("Høje paneler") || getRow("Paneler");
          if (rowP) price += calcBaseTotal(rowP, AREA, qLbl);
        }

        // Stuk
        if (it.extras?.stuk) {
          const rowS = getRow("Stuk");
          // Stuk often priced per m2 of ceiling/walls; default to full AREA
          if (rowS) price += calcBaseTotal(rowS, AREA, qLbl);
        }
        break;
      }
      case "gulv": {
        const floorFactor =
          it.floorQuality === 0 ? 1 : it.floorQuality === 1 ? 1.2 : 1.5;
        price += Math.round(AREA * perM2.gulv * floorFactor);
        if (it.hasFloorHeating) price += 5000;
        break;
      }
      case "bad": {
        // Bathroom pricing: start 250,000, quality factors (0.8/1.0/1.2); no m² component
        const n = Math.max(0, Math.min(5, (it as any).count ?? 1));
        const q = (it as any).bathQuality ?? 1; // 0|1|2
        const factor = q === 0 ? 0.8 : q === 2 ? 1.2 : 1.0;
        const baseOne = Math.max(0, Math.round(250000 * factor));
        price += baseOne * n;
        if (it.bathPlacement === "new") {
          // Fixed extra 25,000 per bathroom for new placement
          price += 25000 * n;
        }
        break;
      }
      case "døreOgVinduer": {
        // Per unit: 20.000 kr. pr. stk med kvalitetsfaktor (lav 0,8 | mid 1,0 | høj 2,0) + evt. 'nyt hul' ekstra
        const doorWin = it as unknown as Partial<ItemDøreVinduer> & {
          count: number;
          choice: "door" | "window";
        };
        // choice not used in fixed 'nyt hul' model
        let operation = doorWin.operation;
        let newInstall = doorWin.newInstall;
        const legacyVariant = doorWin.variant as
          | "doorWindowReplacement"
          | "newHole"
          | "newDoor"
          | "newWindow"
          | undefined;
        if (!operation && legacyVariant) {
          if (legacyVariant === "doorWindowReplacement")
            operation = "replacement";
          if (legacyVariant === "newHole") operation = "newHole";
        }
        if (!newInstall && legacyVariant) {
          if (legacyVariant === "newDoor") newInstall = "door";
          if (legacyVariant === "newWindow") newInstall = "window";
        }
        // installType no longer needed since 'nyt hul' is a fixed amount
        const q = ((it as any).quality ?? 1) as 0 | 1 | 2;
        const factor = q === 0 ? 0.8 : q === 2 ? 2.0 : 1.0;
        let unit = Math.round(20000 * factor);
        if (operation === "newHole") {
          // Fast tillæg ved nyt hul: 40.000 kr pr. enhed
          unit += 40000;
        }
        // Pris pr. stk: 20.000 × kvalitetsfaktor × antal (uden størrelsesfaktor)
        price += Math.round(unit) * Math.max(0, doorWin.count || 0);
        break;
      }
      case "terrasse": {
        const base = 12000;
        const area = Math.max(0, it.area) * 500; // areaPrice
        const extras =
          (it.extra.hævet ? 3000 : 0) +
          (it.extra.trappe ? 2500 : 0) +
          (it.extra.værn ? 2000 : 0);
        price += base + area + extras;
        break;
      }
      case "roof": {
        // Roof pricing: base (fladt) start 30.000 + 2.500 kr/m² with quality factors (lav 0,7 | mid 1,0 | høj 2,0)
        // Extras explicitly per spec: saddeltag ×1.2, valmtag ×1.2, efterisolering +2000/m², kviste +80.000/stk.
        const q: 0 | 1 | 2 = ((it as any).roofQuality ?? 0) as 0 | 1 | 2;
        const ex = (it as any).extras || {};
        const baseRow = {
          key: "tag",
          startpris: 30000,
          m2pris: 2500,
          faktorLav: 0.7,
          faktorHøj: 2.0,
        } as const;
        let subtotal = calcBaseTotal(baseRow as any, AREA, qualityToLabel(q));
        // multiplicative extras
        let mult = 1;
        if (ex.saddeltag) mult *= 1.2;
        if (ex.valm) mult *= 1.2;
        subtotal *= mult;
        // additive extras
        let add = 0;
        if (ex.efterisolering) add += 2000 * AREA;
        const dormers = Number(ex.kviste || 0);
        if (dormers > 0) add += 80000 * dormers;
        // Pitch factor: 0° -> 1.0, 45° -> 2.0 (linear)
        const pitch = Math.max(0, Math.min(45, (it as any).roofPitch || 0));
        const pitchFactor = 1 + (pitch / 45) * (2 - 1);
        price += Math.round((subtotal + add) * pitchFactor);
        break;
      }
      case "Facade": {
        // finishRate: male 250, pudse 200, træ 300 + optionel efterisolering 200
        const finishRate =
          it.finish === "male" ? 250 : it.finish === "pudse" ? 200 : 300;
        const afterIsoRate = it.afterIso ? 200 : 0;
        price += AREA * (finishRate + afterIsoRate);
        break;
      }
      case "walls": {
        // Nedrivning
        if ((it as any).demoLet) price += 7000;
        if ((it as any).demoBærende) price += 15000;
        if ((it as any).demoIndvendig) price += 6000;
        // Nye vægge
        if ((it as any).nyLet) price += 9000;
        if ((it as any).nyBærende) price += 18000;
        if (price === 0) price += perM2.walls; // baseline badge/fallback
        break;
      }
      case "heating": {
        price += it.system === "fjernvarme" ? 12000 : 8000;
        break;
      }
      case "el": {
        // Electrician: fixed base 20,000; 'Ny tavle' fixed 30,000; keep other extras from Excel if present
        price += 20000;
        if (it.newPanel) price += 30000;
        const elExtras = excelExtras?.[UI_TO_EXCEL_KEY.el || "elektriker"]; // try category
        const picked: string[] = [];
        // Exclude 'Ny tavle' here to avoid double counting as we add it fixed above
        if ((it as any).evCharger) picked.push("Bil lader");
        if (it.hiddenRuns) picked.push("Skjulte føringer");
        if (elExtras && picked.length)
          price += calcExtrasTotal(elExtras, AREA, picked);
        break;
      }
      case "køkken": {
        const q: 0 | 1 | 2 = ((it as any).quality ?? 1) as 0 | 1 | 2;
        const factor = q === 0 ? 0.3 : q === 2 ? 2.0 : 1.0;
        price += Math.round(300000 * factor);
        if (it.placement === "new") {
          // Fixed extra 25,000 for new placement (same rule as bathroom)
          price += 25000;
        }
        break;
      }
    }

    price = Math.round(price * basementFactor * firstFloorFactor);
    return Math.max(0, price);
  };

  // Antal pr. type til badge på kort
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) map[it.typeId] = (map[it.typeId] || 0) + 1;
    return map;
  }, [items]);

  // Badge "Fra"-pris til kort (grove defaults)
  const getCardFromPrice = (typeId: AnyItem["typeId"]): number => {
    switch (typeId) {
      case "maling":
        // fixed "Fra" price for painting
        return 5000;
      case "gulv":
        // not finalized yet
        return 0;
      case "bad":
        // new model: base per bathroom
        return 250000;
      case "døreOgVinduer":
        // new model: per unit baseline (mid quality)
        return 20000;
      case "terrasse":
        // not finalized yet
        return 0;
      case "roof":
        // new model baseline (mid quality, pitch 0)
        return Math.max(0, 30000 + 2500 * AREA);
      case "Facade":
        // not finalized yet
        return 0;
      case "walls":
        // not finalized yet
        return 0;
      case "heating":
        // not finalized yet
        return 0;
      case "el":
        // new model base
        return 20000;
      case "køkken":
        // new model base
        return 300000;
      default:
        return 0;
    }
  };

  const calcItemAdjusted = (base: number) =>
    Math.max(0, Math.round(base * autoFactor * manualFactor));

  const sumAdjusted = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + calcItemAdjusted(calcItemBasePrice(it)),
        0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, autoFactor, manualFactor, meta]
  );

  // smartRound & formatKr importeret

  return (
    <div
      className={`min-h-screen flex flex-col bg-gray-50 transition-all duration-[400ms] ease-out ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <main
        className={`flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 ${
          items.length > 0 ? "pb-24 sm:pb-8" : "pb-8"
        }`}
      >
        {/* Grunddata */}
        {meta && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 flex items-center justify-between">
            <div className="text-sm">
              <strong className="mr-2">Grunddata:</strong>
              {meta.propertyType === "house"
                ? "Hus"
                : meta.propertyType === "apartment"
                ? "Lejlighed"
                : "Sommerhus"}{" "}
              - {meta.sizeM2} m² - Postnr: {meta.postcode || "—"} - Kælder:{" "}
              {meta.basement ? "Ja" : "Nej"} - 1. sal:{" "}
              {meta.firstFloor ? "Ja" : "Nej"}
            </div>
            <button
              onClick={() => {
                setDraftMeta(meta);
                setShowMetaEditor(true);
              }}
              className="text-xs bg-white border border-blue-300 rounded px-3 py-1 hover:bg-blue-100"
            >
              Rediger
            </button>
          </div>
        )}

        {/* Meta editor modal */}
        {showMetaEditor && draftMeta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMetaEditor(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-4"
            >
              <h2 className="text-lg font-semibold">Rediger grunddata</h2>
              <form
                className="space-y-3 text-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draftMeta) return;
                  const clamped = {
                    ...draftMeta,
                    sizeM2: Math.max(
                      60,
                      Math.min(300, Number(draftMeta.sizeM2) || 0)
                    ),
                    createdAt: draftMeta.createdAt || new Date().toISOString(),
                  };
                  saveProjectMeta(clamped);
                  setMeta(clamped);
                  setShowMetaEditor(false);
                }}
              >
                {/* Type */}
                <div className="space-y-1">
                  <label className="font-medium block">Type</label>
                  <div className="flex gap-2 text-xs">
                    {(
                      [
                        ["house", "Hus"],
                        ["apartment", "Lejlighed"],
                        ["summerhouse", "Sommerhus"],
                      ] as [ProjectMeta["propertyType"], string][]
                    ).map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setDraftMeta((m) =>
                            m ? { ...m, propertyType: val } : m
                          )
                        }
                        className={`px-3 py-1 rounded border transition ${
                          draftMeta.propertyType === val
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white border-gray-300 text-gray-700"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Størrelse */}
                <div className="space-y-1">
                  <label className="font-medium block" htmlFor="sizeM2">
                    Størrelse (m²)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      id="sizeM2"
                      type="number"
                      min={60}
                      max={300}
                      value={draftMeta.sizeM2}
                      onChange={(e) =>
                        setDraftMeta((m) =>
                          m
                            ? {
                                ...m,
                                sizeM2: Math.max(
                                  0,
                                  parseInt(e.target.value) || 0
                                ),
                              }
                            : m
                        )
                      }
                      className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300"
                    />
                    <div>
                      <input
                        type="range"
                        min={60}
                        max={300}
                        step={1}
                        value={Math.max(60, Math.min(300, draftMeta.sizeM2))}
                        onChange={(e) =>
                          setDraftMeta((m) =>
                            m ? { ...m, sizeM2: parseInt(e.target.value) } : m
                          )
                        }
                        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
                        aria-label="Størrelse (m²)"
                        title="Størrelse (m²)"
                      />
                      <div className="relative h-4 mt-1 text-[11px] text-gray-500 select-none">
                        <span className="absolute left-0">60 m²</span>
                        <span className="absolute right-0">300 m²</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Postnummer */}
                <div className="space-y-1">
                  <label className="font-medium block" htmlFor="postcode">
                    Postnummer
                  </label>
                  <input
                    id="postcode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={draftMeta.postcode}
                    onChange={(e) =>
                      setDraftMeta((m) =>
                        m
                          ? {
                              ...m,
                              postcode: e.target.value
                                .replace(/[^0-9]/g, "")
                                .slice(0, 4),
                            }
                          : m
                      )
                    }
                    className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 tracking-widest"
                    placeholder="0000"
                  />
                </div>
                {/* Checkbokse */}
                <div className="flex items-center gap-4 text-xs">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftMeta.basement}
                      onChange={(e) =>
                        setDraftMeta((m) =>
                          m ? { ...m, basement: e.target.checked } : m
                        )
                      }
                    />
                    <span>Kælder</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftMeta.firstFloor}
                      onChange={(e) =>
                        setDraftMeta((m) =>
                          m ? { ...m, firstFloor: e.target.checked } : m
                        )
                      }
                    />
                    <span>1. sal</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMetaEditor(false)}
                    className="px-3 py-1.5 rounded border text-xs bg-white border-gray-300 hover:bg-gray-50"
                  >
                    Annuller
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                  >
                    Gem
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          Renovering - Tilvalg
        </h1>
        <p className="text-center text-xs sm:text-sm text-gray-600 px-1">
          Klik på et kort for at tilføje til projektlisten. Hvert klik laver en
          ny, redigerbar post.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] gap-5 lg:gap-6 items-start">
          {/* Venstre: KORT (klik = tilføj) */}
          <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {options.map((opt) => {
              const fromPrice = getCardFromPrice(opt.id as AnyItem["typeId"]);
              const count = typeCounts[opt.id] || 0;
              return (
                <div
                  key={opt.id}
                  className={`relative group bg-white rounded-xl border shadow-sm hover:shadow transition-all cursor-pointer active:bg-blue-50 active:ring-1 active:ring-blue-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[.985] overflow-hidden ${
                    count ? "border-blue-400" : "border-gray-200"
                  }`}
                  onClick={() => addItem(opt.id as AnyItem["typeId"])}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      addItem(opt.id as AnyItem["typeId"]);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Tilføj ${opt.label}${
                    count ? ` (valgt ${count})` : ""
                  }`}
                  title="Klik for at tilføje til projektlisten"
                >
                  {count > 0 && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-blue-500" />
                  )}
                  <div className="p-2.5 sm:p-4 flex flex-col min-h-[100px] sm:min-h-[130px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium leading-snug">
                        {opt.icon}
                        <span className="break-words" title={opt.label}>
                          {opt.label}
                        </span>
                        <InfoTooltip text={opt.info} />
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 group-active:bg-blue-100 text-gray-700 group-active:text-blue-700 text-[10px] sm:text-[11px] font-semibold tabular-nums transition-colors">
                          Fra {formatKr(fromPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] sm:text-[11px] text-gray-500 group-active:text-blue-600 transition-colors">
                        Tilføj til projektlisten
                      </span>
                      <span className="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] sm:text-xs border-gray-300 bg-white text-gray-700 group-active:border-blue-300 group-active:text-blue-700 transition-colors select-none">
                        <span className="text-base sm:text-lg leading-none mr-1">
                          +
                        </span>
                        Tilføj
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Højre: PROJEKT LISTE */}
          <aside className="lg:sticky lg:top-6 h-fit bg-white rounded-xl shadow p-4 w-full max-w-full lg:max-w-sm xl:max-w-[420px] mx-auto lg:mx-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-semibold">
                Projektliste
              </h2>
              {items.length > 0 && (
                <button
                  className="text-[11px] sm:text-xs text-gray-600 underline"
                  onClick={() => setItems([])}
                >
                  Ryd projektliste
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500">
                Ingen poster i projektlisten endnu.
              </p>
            ) : (
              <div
                className="space-y-4 overflow-y-auto pr-1 max-h-[55vh] md:max-h-[420px]"
                aria-label="Projekt liste elementer (scroll)"
              >
                {items.map((it) => {
                  const itemBase = calcItemBasePrice(it);
                  const itemAdj = calcItemAdjusted(itemBase);

                  return (
                    <div
                      key={it.uid}
                      className="rounded-lg border border-gray-200 p-3 bg-gray-50"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 font-medium">
                          <span>
                            {options.find((o) => o.id === it.typeId)?.icon}
                          </span>
                          <span className="flex items-center gap-1 text-sm sm:text-base">
                            {it.label}
                            <InfoTooltip
                              text={
                                options.find((o) => o.id === it.typeId)?.info
                              }
                            />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            Før justering: {formatKr(itemBase)}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold">
                            {formatKr(itemAdj)}
                          </span>
                          <button
                            className="text-[10px] sm:text-[11px] text-gray-600 hover:text-gray-800"
                            title="Fjern denne post"
                            onClick={() => removeItem(it.uid)}
                          >
                            Fjern
                          </button>
                        </div>
                      </div>

                      {/* Editor – pr. post */}
                      <div className="mt-3 rounded-lg bg-white border border-gray-200 px-4 py-4 space-y-5 text-sm leading-relaxed">
                        {it.typeId === "maling" && (
                          <PaintingEditor
                            item={it as Extract<AnyItem, { typeId: "maling" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "gulv" && (
                          <FloorEditor
                            item={it as Extract<AnyItem, { typeId: "gulv" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "bad" && (
                          <BathEditor
                            item={it as Extract<AnyItem, { typeId: "bad" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "døreOgVinduer" && (
                          <DoorWindowEditor
                            item={it as ItemDøreVinduer}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "terrasse" && (
                          <TerraceEditor
                            item={
                              it as Extract<AnyItem, { typeId: "terrasse" }>
                            }
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "roof" && (
                          <RoofEditor
                            item={it as Extract<AnyItem, { typeId: "roof" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "Facade" && (
                          <FacadeEditor
                            item={it as Extract<AnyItem, { typeId: "Facade" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "walls" && (
                          <WallsEditor
                            item={it as Extract<AnyItem, { typeId: "walls" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "heating" && (
                          <HeatingEditor
                            item={it as Extract<AnyItem, { typeId: "heating" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "el" && (
                          <ElectricityEditor
                            item={it as Extract<AnyItem, { typeId: "el" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                        {it.typeId === "køkken" && (
                          <KitchenEditor
                            item={it as Extract<AnyItem, { typeId: "køkken" }>}
                            update={(k, v) => updateItem(it.uid, k, v)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sum */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm sm:text-base">
              <span className="text-xs sm:text-sm text-gray-600">Samlet</span>
              <span className="text-sm sm:text-base font-bold text-blue-700">
                {formatKr(smartRound(sumAdjusted))}
              </span>
            </div>

            {/* Manuel justering */}
            <div className="mt-4">
              <label className="text-[11px] sm:text-xs text-gray-600">
                Manuel prisjustering (%)
              </label>
              <input
                type="number"
                value={manualAdjustment}
                onChange={(e) =>
                  setManualAdjustment(parseInt(e.target.value) || 0)
                }
                className="mt-1 w-24 text-center border rounded p-1 text-xs sm:text-sm"
                placeholder="0"
              />
            </div>
          </aside>
        </div>
      </main>
      {/* Sticky mobil bund-bar (kun små skærme / kun når der er poster) */}
      {items.length > 0 && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-2 pb-2 pb-safe-bottom flex items-center justify-between shadow-lg"
          aria-label="Samlet pris sticky bar"
        >
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide text-gray-500">
              Samlet
            </span>
            <span className="text-base font-semibold text-blue-700">
              {formatKr(smartRound(sumAdjusted))}
            </span>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 active:scale-[.97] transition"
          >
            Til top
          </button>
        </div>
      )}
    </div>
  );
}
