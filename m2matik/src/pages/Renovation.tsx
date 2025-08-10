import { useEffect, useMemo, useState } from "react";
import {
  FaPaintRoller,
  FaRulerCombined,
  FaBath,
  FaDoorOpen,
} from "react-icons/fa";
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
import { loadProjectMeta, type ProjectMeta } from "../lib/storage";

// Pris-justering
const BASE_DATE = new Date("2025-01-01");
const ANNUAL_ADJUSTMENT = 0.03;

// ---------- Typer ----------
type ItemBase = {
  uid: string;        // unik pr. post (så hver kan redigeres individuelt)
  typeId:
    | "maling"
    | "gulv"
    | "bad"
    | "døreOgVinduer"
    | "terrasse"
    | "roof"
    | "Facade"
    | "walls"
    | "heating"
    | "el"
    | "køkken";
  label: string;
};

// pr. type felter:
type ItemMaling = ItemBase & {
  typeId: "maling";
  paintQuality: 0 | 1;
  extras: { træværk?: boolean; paneler?: boolean; stuk?: boolean };
};

type ItemGulv = ItemBase & {
  typeId: "gulv";
  floorQuality: 0 | 1;
  hasFloorHeating: boolean;
};

type ItemBad = ItemBase & {
  typeId: "bad";
  bathPlacement: "same" | "new";
};

type ItemDoereVinduer = ItemBase & {
  typeId: "døreOgVinduer";
  choice: "door" | "window";
  variant: "doorWindowReplacement" | "newHole" | "newDoor" | "newWindow";
  count: number;
};

type ItemTerrasse = ItemBase & {
  typeId: "terrasse";
  area: number;
  extra: { hævet?: boolean; trappe?: boolean; værn?: boolean };
};

type ItemRoof = ItemBase & {
  typeId: "roof";
  roofType: "" | "fladt" | "valm" | "saddel";
  roofMaterial: "" | "tagpap" | "betontegl" | "alm-tegl";
  afterInsulation: boolean;
  dormerCount: number;
};

type ItemFacade = ItemBase & {
  typeId: "Facade";
  finish: "male" | "pudse" | "træ";
  afterIso: boolean;
};

type ItemWalls = ItemBase & {
  typeId: "walls";
  demo: "" | "let" | "bærende";
  newWall: boolean;
};

type ItemHeating = ItemBase & {
  typeId: "heating";
  system: "fjernvarme" | "radiator";
};

type ItemEl = ItemBase & {
  typeId: "el";
  outletCount: number;
  newPanel: boolean;
  hiddenRuns: boolean;
};

type ItemKitchen = ItemBase & {
  typeId: "køkken";
  placement: "same" | "new";
};

type AnyItem =
  | ItemMaling
  | ItemGulv
  | ItemBad
  | ItemDoereVinduer
  | ItemTerrasse
  | ItemRoof
  | ItemFacade
  | ItemWalls
  | ItemHeating
  | ItemEl
  | ItemKitchen;

// ---------- Komponent ----------
export default function RenovationWithList() {
  const [meta, setMeta] = useState<ProjectMeta | null>(null);

  // Manuel prisjustering i %
  const [manualAdjustment, setManualAdjustment] = useState(0);

  // Projekt liste med individuelle poster
  const [items, setItems] = useState<AnyItem[]>([]);

  // Hent meta (areal, kælder, 1. sal)
  useEffect(() => {
    setMeta(loadProjectMeta());
  }, []);

  const AREA = meta?.sizeM2 ?? 0;

  // Kort / muligheder (bruges til UI og "Fra"-pris på kortene)
  const options = [
    { id: "maling", label: "Maling", icon: <FaPaintRoller /> },
    { id: "gulv", label: "Gulv", icon: <RiLayoutGridLine size={22} /> },
    { id: "bad", label: "Bad", icon: <FaBath /> },
    {
      id: "døreOgVinduer",
      label: "Døre/vinduer",
      icon: <FaDoorOpen className="w-5 h-5" />,
    },
    { id: "terrasse", label: "Terrasse", icon: <MdBalcony size={22} /> },
    { id: "roof", label: "Tag", icon: <MdOutlineRoofing size={22} /> },
    { id: "Facade", label: "Facade", icon: <MdHouseSiding size={22} /> },
    { id: "walls", label: "Vægge", icon: <GiBrickWall /> },
    { id: "heating", label: "Varme", icon: <FaHouseFire size={22} /> },
    {
      id: "el",
      label: "Elinstallation",
      icon: <MdOutlineElectricalServices size={22} />,
    },
    { id: "køkken", label: "Køkken", icon: <MdKitchen size={22} /> },
  ] as const;

  // Standard satser
  const perM2: Record<string, number> = {
    maling: 100,
    gulv: 150,
    bad: 0, // håndteres særskilt
    døreOgVinduer: 0, // særskilt
    terrasse: 120,
    dormer: 100,
    facade: 250,
    walls: 7000,
  };

  const doorWindowBase = {
    door: 5000,
    window: 4000,
    extraForNewHoleDoor: 3000,
    extraForNewHoleWindow: 2500,
  };

  const kitchenBase = 15000;
  const kitchenExtraNewPlacement = 20000;

  // Auto + manuel prisjustering
  const yearsSinceBase = () =>
    (new Date().getTime() - BASE_DATE.getTime()) /
    (1000 * 60 * 60 * 24 * 365);

  const autoFactor = Math.pow(1 + ANNUAL_ADJUSTMENT, yearsSinceBase());
  const manualFactor =
    1 + (isNaN(manualAdjustment) ? 0 : manualAdjustment) / 100;

  // Unik id helper
  const newUID = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
          variant: "doorWindowReplacement",
          count: 1,
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
          demo: "",
          newWall: false,
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
        };
        break;
      case "køkken":
        item = {
          uid: newUID(),
          typeId,
          label,
          placement: "same",
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

  // Opdater en post (immutabelt)
  const updateItem = <K extends keyof AnyItem>(uid: string, key: K, val: AnyItem[K]) => {
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, [key]: val } : i)));
  };

  // Pris for én post (før auto + manuel)
  const calcItemBasePrice = (it: AnyItem): number => {
    const basementFactor = meta?.basement ? 1.2 : 1;
    const firstFloorFactor = meta?.firstFloor ? 1.1 : 1;

    let price = 0;

    switch (it.typeId) {
      case "maling": {
        const qFactor = it.paintQuality === 1 ? 1.2 : 1;
        price += Math.round(AREA * perM2.maling * qFactor);
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
        const unit =
          it.choice === "door" ? doorWindowBase.door : doorWindowBase.window;
        const holeExtra =
          it.variant === "newHole"
            ? it.choice === "door"
              ? doorWindowBase.extraForNewHoleDoor
              : doorWindowBase.extraForNewHoleWindow
            : 0;
        price += (unit + holeExtra) * Math.max(1, it.count);
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
        if (it.roofType === "valm") price += AREA * 1200;
        if (it.roofType === "saddel") price += AREA * 1400;

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
        const finishRate = it.finish === "male" ? 250 : it.finish === "pudse" ? 200 : 300;
        const afterIsoRate = it.afterIso ? 200 : 0;
        price += AREA * (finishRate + afterIsoRate);
        break;
      }
      case "walls": {
        // Nedrivning + ny væg
        if (it.demo === "let") price += 7000;
        if (it.demo === "bærende") price += 15000;
        if (it.newWall) price += 12000;
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
        price += Math.max(elBase, 8000); // baseline
        break;
      }
      case "køkken": {
        price += kitchenBase + (it.placement === "new" ? kitchenExtraNewPlacement : 0);
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
    () => items.reduce((acc, it) => acc + calcItemAdjusted(calcItemBasePrice(it)), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, autoFactor, manualFactor, meta]
  );

  const smartRound = (price: number) =>
    price < 100000 ? Math.round(price / 5000) * 5000 : Math.round(price / 1000) * 1000;

  const formatKr = (n: number) => `${Math.max(n, 0).toLocaleString("da-DK")} kr.`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
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
              - {meta.sizeM2} m² - Kælder: {meta.basement ? "Ja" : "Nej"} - 1. sal:{" "}
              {meta.firstFloor ? "Ja" : "Nej"}
            </div>
            <button className="text-xs bg-white border border-blue-300 rounded px-3 py-1 hover:bg-blue-100">
              Rediger
            </button>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center mb-2">Renovering - Tilvalg</h1>
        <p className="text-center text-sm text-gray-600">
          Klik på kort for at tilføje til projekt listen. Hver klik laver en ny, redigerbar post.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
          {/* Venstre: KORT (klik = tilføj) */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {options.map((opt) => {
              const fromPrice = getCardFromPrice(opt.id as AnyItem["typeId"]);
              return (
                <div
                  key={opt.id}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-5 flex flex-col min-h-[150px] cursor-pointer"
                  onClick={() => addItem(opt.id as AnyItem["typeId"])}
                  title="Klik for at tilføje til projekt listen"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex items-center gap-2 text-lg font-medium leading-tight">
                      {opt.label}
                      {opt.icon}
                    </span>
                    <span className="inline-flex items-center justify-end min-w-[92px] px-2 py-1 rounded whitespace-nowrap tabular-nums leading-none bg-gray-100 text-gray-700 text-[11px] font-semibold">
                      Fra {formatKr(fromPrice)}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Klik for at tilføje</span>
                    <button
                      className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(opt.id as AnyItem["typeId"]);
                      }}
                    >
                      <span className="text-base leading-none mr-1">+</span>
                      Tilføj
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Højre: PROJEKT LISTE */}
          <aside className="lg:sticky lg:top-6 h-fit bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Projekt liste</h2>
              {items.length > 0 && (
                <button
                  className="text-xs text-gray-600 underline"
                  onClick={() => setItems([])}
                >
                  Ryd liste
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500">Ingen elementer på listen endnu.</p>
            ) : (
              <div className="space-y-4">
                {items.map((it) => {
                  const itemBase = calcItemBasePrice(it);
                  const itemAdj = calcItemAdjusted(itemBase);

                  return (
                    <div key={it.uid} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-medium">
                          <span>
                            {
                              options.find((o) => o.id === it.typeId)?.icon
                            }
                          </span>
                          <span>{it.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            (før justering: {formatKr(itemBase)})
                          </span>
                          <span className="text-sm font-semibold">
                            {formatKr(itemAdj)}
                          </span>
                          <button
                            className="text-[11px] text-gray-600 hover:text-gray-800"
                            title="Fjern denne post"
                            onClick={() => removeItem(it.uid)}
                          >
                            Fjern
                          </button>
                        </div>
                      </div>

                      {/* Editor – pr. post */}
                      <div className="bg-white rounded-md p-3 shadow-inner">
                        {it.typeId === "maling" && (
                          <div className="space-y-2">
                            <label className="block text-sm text-gray-600">
                              Kvalitet
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={1}
                              value={it.paintQuality}
                              onChange={(e) =>
                                updateItem(it.uid, "paintQuality", parseInt(e.target.value, 10) as 0 | 1)
                              }
                              className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex flex-wrap gap-4 text-sm">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-blue-500"
                                  checked={!!it.extras.træværk}
                                  onChange={(e) =>
                                    updateItem(it.uid, "extras", {
                                      ...it.extras,
                                      træværk: e.target.checked,
                                    })
                                  }
                                />
                                Træværk
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-blue-500"
                                  checked={!!it.extras.paneler}
                                  onChange={(e) =>
                                    updateItem(it.uid, "extras", {
                                      ...it.extras,
                                      paneler: e.target.checked,
                                    })
                                  }
                                />
                                Høje paneler
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-blue-500"
                                  checked={!!it.extras.stuk}
                                  onChange={(e) =>
                                    updateItem(it.uid, "extras", {
                                      ...it.extras,
                                      stuk: e.target.checked,
                                    })
                                  }
                                />
                                Stuk
                              </label>
                            </div>
                          </div>
                        )}

                        {it.typeId === "gulv" && (
                          <div className="space-y-2">
                            <label className="block text-sm text-gray-600">
                              Kvalitet
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={1}
                              value={it.floorQuality}
                              onChange={(e) =>
                                updateItem(it.uid, "floorQuality", parseInt(e.target.value, 10) as 0 | 1)
                              }
                              className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
                            />
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-500"
                                checked={it.hasFloorHeating}
                                onChange={(e) =>
                                  updateItem(it.uid, "hasFloorHeating", e.target.checked)
                                }
                              />
                              Gulvvarme
                            </label>
                          </div>
                        )}

                        {it.typeId === "bad" && (
                          <div className="space-y-2">
                            <div className="flex gap-4 text-sm">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`bathPlacement_${it.uid}`}
                                  value="same"
                                  checked={it.bathPlacement === "same"}
                                  onChange={() => updateItem(it.uid, "bathPlacement", "same")}
                                  className="w-4 h-4 accent-blue-500"
                                />
                                Samme placering
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`bathPlacement_${it.uid}`}
                                  value="new"
                                  checked={it.bathPlacement === "new"}
                                  onChange={() => updateItem(it.uid, "bathPlacement", "new")}
                                  className="w-4 h-4 accent-blue-500"
                                />
                                Ny placering (+2.500)
                              </label>
                            </div>
                          </div>
                        )}

                        {it.typeId === "døreOgVinduer" && (
                          <div className="space-y-2">
                            <div className="flex gap-3">
                              <label className="inline-flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`doorOrWindow_${it.uid}`}
                                  value="door"
                                  checked={it.choice === "door"}
                                  onChange={() => updateItem(it.uid, "choice", "door")}
                                  className="mr-1"
                                />
                                Dør
                              </label>
                              <label className="inline-flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`doorOrWindow_${it.uid}`}
                                  value="window"
                                  checked={it.choice === "window"}
                                  onChange={() => updateItem(it.uid, "choice", "window")}
                                  className="mr-1"
                                />
                                Vindue
                              </label>
                            </div>

                            <div className="flex gap-3">
                              <label className="inline-flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`variant1_${it.uid}`}
                                  value="doorWindowReplacement"
                                  checked={it.variant === "doorWindowReplacement"}
                                  onChange={() =>
                                    updateItem(it.uid, "variant", "doorWindowReplacement")
                                  }
                                />
                                Udskiftning
                              </label>
                              <label className="inline-flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`variant1_${it.uid}`}
                                  value="newHole"
                                  checked={it.variant === "newHole"}
                                  onChange={() => updateItem(it.uid, "variant", "newHole")}
                                />
                                Nyt hul
                              </label>
                              <label className="inline-flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`variant2_${it.uid}`}
                                  value="newDoor"
                                  checked={it.variant === "newDoor"}
                                  onChange={() => updateItem(it.uid, "variant", "newDoor")}
                                />
                                Ny dør
                              </label>
                              <label className="inline-flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`variant2_${it.uid}`}
                                  value="newWindow"
                                  checked={it.variant === "newWindow"}
                                  onChange={() => updateItem(it.uid, "variant", "newWindow")}
                                />
                                Nyt vindue
                              </label>
                            </div>

                            <label className="text-sm font-medium flex items-center gap-2">
                              Antal:
                              <input
                                type="number"
                                min={1}
                                value={it.count}
                                onChange={(e) =>
                                  updateItem(it.uid, "count", Math.max(1, Number(e.target.value)))
                                }
                                className="w-16 px-1 py-0.5 border rounded text-sm"
                                title="Antal døre eller vinduer"
                              />
                            </label>
                          </div>
                        )}

                        {it.typeId === "terrasse" && (
                          <div className="space-y-2">
                            <label className="text-sm">
                              Størrelse (m²):
                              <input
                                type="number"
                                min="0"
                                value={it.area}
                                onChange={(e) =>
                                  updateItem(it.uid, "area", Math.max(0, Number(e.target.value)))
                                }
                                className="ml-2 w-20 p-1 border rounded"
                              />
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!it.extra.hævet}
                                onChange={(e) =>
                                  updateItem(it.uid, "extra", {
                                    ...it.extra,
                                    hævet: e.target.checked,
                                  })
                                }
                              />
                              Hævet
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!it.extra.trappe}
                                onChange={(e) =>
                                  updateItem(it.uid, "extra", {
                                    ...it.extra,
                                    trappe: e.target.checked,
                                  })
                                }
                              />
                              Trappe
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!it.extra.værn}
                                onChange={(e) =>
                                  updateItem(it.uid, "extra", {
                                    ...it.extra,
                                    værn: e.target.checked,
                                  })
                                }
                              />
                              Værn
                            </label>
                          </div>
                        )}

                        {it.typeId === "roof" && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Tagtype:</label>
                            <select
                              value={it.roofType}
                              onChange={(e) =>
                                updateItem(it.uid, "roofType", e.target.value as ItemRoof["roofType"])
                              }
                              className="border rounded p-2 text-sm w-full"
                            >
                              <option value="">Vælg tagtype</option>
                              <option value="fladt">Fladt tag</option>
                              <option value="saddel">Skråt tag</option>
                              <option value="valm">Valm tag</option>
                            </select>

                            <label className="text-xs font-medium">Belægning:</label>
                            <select
                              value={it.roofMaterial}
                              onChange={(e) =>
                                updateItem(
                                  it.uid,
                                  "roofMaterial",
                                  e.target.value as ItemRoof["roofMaterial"]
                                )
                              }
                              className="border rounded p-2 text-sm w-full"
                            >
                              <option value="">Vælg belægning</option>
                              <option value="tagpap">Tagpap</option>
                              <option value="betontegl">Betontegl</option>
                              <option value="alm-tegl">Alm. tegl</option>
                            </select>

                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={it.afterInsulation}
                                onChange={(e) =>
                                  updateItem(it.uid, "afterInsulation", e.target.checked)
                                }
                                className="accent-blue-500"
                              />
                              Efterisolering
                            </label>

                            <label className="text-xs font-medium">Antal kviste:</label>
                            <input
                              type="number"
                              min="0"
                              value={it.dormerCount}
                              onChange={(e) =>
                                updateItem(it.uid, "dormerCount", Math.max(0, Number(e.target.value)))
                              }
                              className="border rounded p-2 w-24 text-sm"
                            />
                          </div>
                        )}

                        {it.typeId === "Facade" && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Overflade:</label>
                            <select
                              value={it.finish}
                              onChange={(e) =>
                                updateItem(
                                  it.uid,
                                  "finish",
                                  e.target.value as ItemFacade["finish"]
                                )
                              }
                              className="border rounded p-2 text-sm w-full"
                            >
                              <option value="male">Male</option>
                              <option value="pudse">Puds</option>
                              <option value="træ">Træbeklædning</option>
                            </select>

                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={it.afterIso}
                                onChange={(e) => updateItem(it.uid, "afterIso", e.target.checked)}
                                className="w-4 h-4 accent-blue-500"
                              />
                              Efterisolering
                            </label>
                          </div>
                        )}

                        {it.typeId === "walls" && (
                          <div className="space-y-2">
                            <div className="text-s font-medium">Nedrivning:</div>
                            <div className="flex flex-col gap-1 text-s">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`wallDemoType_${it.uid}`}
                                  value="let"
                                  checked={it.demo === "let"}
                                  onChange={() => updateItem(it.uid, "demo", "let")}
                                  className="accent-blue-500"
                                />
                                Let skillevæg
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`wallDemoType_${it.uid}`}
                                  value="bærende"
                                  checked={it.demo === "bærende"}
                                  onChange={() => updateItem(it.uid, "demo", "bærende")}
                                  className="accent-blue-500"
                                />
                                Bærende væg
                              </label>
                            </div>

                            <label className="inline-flex items-center gap-2 text-s">
                              <input
                                type="checkbox"
                                checked={it.newWall}
                                onChange={(e) => updateItem(it.uid, "newWall", e.target.checked)}
                                className="accent-blue-500"
                              />
                              Nye vægge
                            </label>
                          </div>
                        )}

                        {it.typeId === "heating" && (
                          <div className="space-y-2">
                            <label className="inline-flex items-center gap-2 text-s">
                              <input
                                type="radio"
                                name={`heating_${it.uid}`}
                                value="fjernvarme"
                                checked={it.system === "fjernvarme"}
                                onChange={() => updateItem(it.uid, "system", "fjernvarme")}
                                className="mr-1"
                              />
                              Fjernvarme
                            </label>
                            <label className="inline-flex items-center gap-2 text-s">
                              <input
                                type="radio"
                                name={`heating_${it.uid}`}
                                value="radiator"
                                checked={it.system === "radiator"}
                                onChange={() => updateItem(it.uid, "system", "radiator")}
                                className="mr-1"
                              />
                              Radiator
                            </label>
                          </div>
                        )}

                        {it.typeId === "el" && (
                          <div className="space-y-2">
                            <label className="block text-sm text-gray-600">
                              Antal stikkontakter: {it.outletCount}
                            </label>
                            <input
                              title="Antal stikkontakter"
                              type="range"
                              min={0}
                              max={50}
                              step={1}
                              value={it.outletCount}
                              onChange={(e) =>
                                updateItem(it.uid, "outletCount", parseInt(e.target.value, 10))
                              }
                              className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-blue-500"
                                  checked={it.newPanel}
                                  onChange={(e) => updateItem(it.uid, "newPanel", e.target.checked)}
                                />
                                Ny tavle
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-blue-500"
                                  checked={it.hiddenRuns}
                                  onChange={(e) =>
                                    updateItem(it.uid, "hiddenRuns", e.target.checked)
                                  }
                                />
                                Skjulte føringer
                              </label>
                            </div>
                          </div>
                        )}

                        {it.typeId === "køkken" && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Placering:</label>
                            <label className="inline-flex items-center gap-2 text-xs">
                              <input
                                type="radio"
                                name={`kitchen_${it.uid}`}
                                value="same"
                                checked={it.placement === "same"}
                                onChange={() => updateItem(it.uid, "placement", "same")}
                                className="mr-1"
                              />
                              Samme placering
                            </label>
                            <label className="inline-flex items-center gap-2 text-xs">
                              <input
                                type="radio"
                                name={`kitchen_${it.uid}`}
                                value="new"
                                checked={it.placement === "new"}
                                onChange={() => updateItem(it.uid, "placement", "new")}
                                className="mr-1"
                              />
                              Ny placering (+20.000 kr.)
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sum */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-600">Samlet</span>
              <span className="text-base font-bold text-blue-700">
                {formatKr(smartRound(sumAdjusted))}
              </span>
            </div>

            {/* Manuel justering */}
            <div className="mt-4">
              <label className="text-xs text-gray-600">Manuel prisjustering (%)</label>
              <input
                type="number"
                value={manualAdjustment}
                onChange={(e) => setManualAdjustment(parseInt(e.target.value) || 0)}
                className="mt-1 w-24 text-center border rounded p-1 text-sm"
                placeholder="0"
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
