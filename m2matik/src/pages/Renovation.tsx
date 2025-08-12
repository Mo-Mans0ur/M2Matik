import { useEffect, useMemo, useState } from "react";
import { FaPaintRoller, FaBath, FaDoorOpen } from "react-icons/fa";
import { GiBrickWall } from "react-icons/gi";
import {
  MdOutlineRoofing,
  MdBalcony,
  MdHouseSiding,
  MdOutlineElectricalServices,
  MdKitchen,
} from "react-icons/md";
import { RiLayoutGridLine } from "react-icons/ri";
import { FaHouseFire } from "react-icons/fa6";
import {
  loadProjectMeta,
  saveProjectMeta,
  type ProjectMeta,
} from "../lib/storage";
import {
  BASE_DATE,
  ANNUAL_ADJUSTMENT,
  perM2,
  doorWindowBase,
  kitchenBase,
  kitchenExtraNewPlacement,
  newUID,
  formatKr,
  smartRound,
} from "./renovationTypes";
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
import type { AnyItem, ItemDøreVinduer } from "./renovationTypes";

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

  const AREA = meta?.sizeM2 ?? 0;

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

  // Hvor mange af hver type er valgt
  const typeCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    items.forEach((it) => {
      acc[it.typeId] = (acc[it.typeId] || 0) + 1;
    });
    return acc;
  }, [items]);

  // Standard satser
  // (satser importeret fra renovationTypes)

  // Auto + manuel prisjustering
  const yearsSinceBase = () =>
    (new Date().getTime() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const autoFactor = Math.pow(1 + ANNUAL_ADJUSTMENT, yearsSinceBase());
  const manualFactor =
    1 + (isNaN(manualAdjustment) ? 0 : manualAdjustment) / 100;

  // newUID importeret

  // Når man klikker et kort -> opret en ny post med default værdier for den type
  const addItem = (typeId: AnyItem["typeId"]) => {
    const label = options.find((o) => o.id === typeId)?.label || typeId;

    let item: AnyItem;
    switch (typeId) {
      case "maling":
        item = {
          uid: newUID(),
          typeId,
          label,
          paintQuality: 0,
          extras: {},
          coveragePercent: 100,
        };
        break;
      case "gulv":
        item = {
          uid: newUID(),
          typeId,
          label,
          floorQuality: 0,
          hasFloorHeating: false,
        };
        break;
      case "bad":
        item = {
          uid: newUID(),
          typeId,
          label,
          bathPlacement: "same",
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
          quality: 50,
          sizeScale: 50,
        };
        break;
      case "terrasse":
        item = {
          uid: newUID(),
          typeId,
          label,
          area: 0,
          extra: {},
        };
        break;
      case "roof":
        item = {
          uid: newUID(),
          typeId,
          label,
          roofType: "",
          roofMaterial: "",
          roofPitch: 0,
          afterInsulation: false,
          dormerCount: 0,
        };
        break;
      case "Facade":
        item = {
          uid: newUID(),
          typeId,
          label,
          finish: "male",
          afterIso: false,
        };
        break;
      case "walls":
        item = {
          uid: newUID(),
          typeId,
          label,
          demoLet: false,
          demoBærende: false,
          demoIndvendig: false,
          nyeVægge: false,
          nyLet: false,
          nyBærende: false,
        };
        break;
      case "heating":
        item = {
          uid: newUID(),
          typeId,
          label,
          system: "radiator",
        };
        break;
      case "el":
        item = {
          uid: newUID(),
          typeId,
          label,
          outletCount: 0,
          newPanel: false,
          hiddenRuns: false,
          evCharger: false,
        };
        break;
      case "køkken":
        item = {
          uid: newUID(),
          typeId,
          label,
          placement: "same",
          quality: 0,
        };
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
  const qFactor = it.paintQuality === 1 ? 1.2 : 1;
  const coverage = Math.max(0, Math.min(100, (it as any).coveragePercent ?? 100)) / 100;
  price += Math.round(AREA * perM2.maling * qFactor * coverage);
        if (it.extras.træværk) price += 2000;
        if (it.extras.paneler) price += 1500;
        if (it.extras.stuk) price += 2500;
        break;
      }
      case "gulv": {
        const floorFactor = it.floorQuality === 1 ? 1.2 : 1;
        price += Math.round(AREA * perM2.gulv * floorFactor);
        if (it.hasFloorHeating) price += 5000;
        break;
      }
      case "bad": {
        const BASE_BATH = 50000;
        const RELOC = 2500;
        price += BASE_BATH + (it.bathPlacement === "new" ? RELOC : 0);
        break;
      }
      case "døreOgVinduer": {
        // Backwards compatibility: map legacy variant -> new fields if present
        const doorWin = it as unknown as Partial<ItemDøreVinduer> & {
          count: number;
          choice: "door" | "window";
        };
        const { choice } = doorWin;
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
        // Pris skal følge LINJE 3 (det nye der monteres). Fallback til LINJE 1 hvis LINJE 3 mangler.
        const installType = newInstall || choice;
        const unit =
          installType === "door" ? doorWindowBase.door : doorWindowBase.window;
        // Ekstra for nyt hul afhænger af hvad der skabes hul til (installType)
        const holeExtra =
          operation === "newHole"
            ? installType === "door"
              ? doorWindowBase.extraForNewHoleDoor
              : doorWindowBase.extraForNewHoleWindow
            : 0;
        // Juster for kvalitet og størrelse (0-100) som ±20% hver
        const q = (it as any).quality ?? 50;
        const s = (it as any).sizeScale ?? 50;
        const qualityFactor = 1 + ((q - 50) / 50) * 0.2; // 0..100 -> 0.8..1.2
        const sizeFactor = 1 + ((s - 50) / 50) * 0.2; // 0..100 -> 0.8..1.2
        price += Math.round((unit + holeExtra) * qualityFactor * sizeFactor) *
          Math.max(1, doorWin.count);
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
        if (it.roofType === "fladt") price += AREA * 1000;
        if (it.roofType === "saddel") price += AREA * 1400; // inkluderer tidligere 'valm'
        // lille justering baseret på hældning (pitch) – +1% pr. 5 grader
        if (it.typeId === "roof" && typeof it.roofPitch === "number") {
          const pitch = Math.min(60, Math.max(0, it.roofPitch || 0));
          price *= 1 + pitch / 500; // 60° => +12%
        }

        if (it.roofMaterial === "tagpap") price += AREA * 500;
        if (it.roofMaterial === "betontegl") price += AREA * 700;
        if (it.roofMaterial === "alm-tegl") price += AREA * 900;

        if (it.afterInsulation) price += AREA * 150;
        if (it.dormerCount > 0) price += it.dormerCount * 1000;

        // fallback hvis intet valgt:
        if (price === 0) price += AREA * 1000 + AREA * 500;
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
  if ((it as any).nyeVægge) price += 8000;
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
        let elBase = it.outletCount * 350;
        if (it.newPanel) elBase += 5000;
        if (it.hiddenRuns) elBase += Math.round(elBase * 1.25);
        if ((it as any).evCharger) elBase += 9000;
        price += Math.max(elBase, 8000); // baseline
        break;
      }
      case "køkken": {
        const quality = (it as any).quality ?? 0; // 0 IKEA, 1 Hack, 2 Snedker
        const qualityFactor = quality === 0 ? 1 : quality === 1 ? 1.3 : 1.8;
        price +=
          Math.round(kitchenBase * qualityFactor) +
          (it.placement === "new" ? kitchenExtraNewPlacement : 0);
        break;
      }
    }

    price = Math.round(price * basementFactor * firstFloorFactor);
    return Math.max(0, price);
  };

  // Badge "Fra"-pris til kort (grove defaults)
  const getCardFromPrice = (typeId: AnyItem["typeId"]): number => {
    switch (typeId) {
      case "maling":
        return Math.round(AREA * perM2.maling);
      case "gulv":
        return Math.round(AREA * perM2.gulv);
      case "bad":
        return 50000;
      case "døreOgVinduer":
        return doorWindowBase.door;
      case "terrasse":
        return 12000;
      case "roof":
        return AREA * 1000 + AREA * 500; // fladt + tagpap baseline
      case "Facade":
        return AREA * 250 + 5000;
      case "walls":
        return 7000;
      case "heating":
        return 8000;
      case "el":
        return 8000;
      case "køkken":
        return kitchenBase;
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
      className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-[400ms] ease-out ${
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
              className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4"
            >
              <h2 className="text-lg font-semibold">Rediger grunddata</h2>
              <form
                className="space-y-3 text-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draftMeta) return;
                  saveProjectMeta({
                    ...draftMeta,
                    createdAt: draftMeta.createdAt || new Date().toISOString(),
                  });
                  setMeta(draftMeta);
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
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
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
                  <input
                    id="sizeM2"
                    type="number"
                    min={0}
                    value={draftMeta.sizeM2}
                    onChange={(e) =>
                      setDraftMeta((m) =>
                        m ? { ...m, sizeM2: parseInt(e.target.value) || 0 } : m
                      )
                    }
                    className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
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
                    className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 tracking-widest"
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
                    className="px-3 py-1.5 rounded border text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
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
                  className={`relative group bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow transition-all cursor-pointer active:bg-blue-50 dark:active:bg-blue-900/30 active:ring-1 active:ring-blue-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[.985] overflow-hidden ${
                    count
                      ? "border-blue-400 dark:border-blue-500"
                      : "border-gray-200 dark:border-gray-700"
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
          <aside className="lg:sticky lg:top-6 h-fit bg-white dark:bg-gray-800 rounded-xl shadow p-4 w-full max-w-full lg:max-w-sm xl:max-w-[420px] mx-auto lg:mx-0">
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
                      <div className="mt-3 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 px-4 py-4 space-y-5 text-sm leading-relaxed">
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
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 pt-2 pb-2 pb-safe-bottom flex items-center justify-between shadow-lg"
          aria-label="Samlet pris sticky bar"
        >
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Samlet
            </span>
            <span className="text-base font-semibold text-blue-700 dark:text-blue-400">
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
