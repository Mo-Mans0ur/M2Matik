import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaintRoller, FaBath, FaDoorOpen } from "react-icons/fa";
import { GiBrickWall } from "react-icons/gi";
import {
  MdBalcony,
  MdOutlineRoofing,
  MdHouseSiding,
  MdKitchen,
  MdOutlineElectricalServices,
  MdHome,
} from "react-icons/md";
import { RiLayoutGridLine } from "react-icons/ri";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FaHouseFire } from "react-icons/fa6";
import PaintingEditor from "../components/editors/PaintingEditor";
import FloorEditor from "../components/editors/FloorEditor";
import BathEditor from "../components/editors/BathEditor";
import DoorWindowEditor from "../components/editors/DoorWindowEditor";
import TerraceEditor from "../components/editors/TerraceEditor";
import RoofEditor from "../components/editors/RoofEditor";
import FacadeEditor from "../components/editors/FacadeEditor";
import WallsEditor from "../components/editors/WallsEditor";
import DemolitionEditor from "../components/editors/DemolitionEditor";
import HeatingEditor from "../components/editors/HeatingEditor";
import ElectricityEditor from "../components/editors/ElectricityEditor";
import KitchenEditor from "../components/editors/KitchenEditor";
import InfoTooltip from "../components/InfoTooltip";
import { loadProjectMeta, saveProjectMeta } from "../lib/storage";
import type { ProjectMeta } from "../lib/storage";
import type { AnyItem, ItemDøreVinduer } from "./renovationTypes";
import novaPoint from "../assets/pictures/nova_point.png";
import { newUID, formatKr, smartRound } from "./renovationTypes";
import {
  loadPricesJson,
  type JsonData,
  type JsonPrice,
  extrasTotal,
  applyPostnr,
  applyEscalation,
} from "../pricing/json";

// ---------- Komponent ----------
export default function RenovationWithList() {
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [entered, setEntered] = useState(false);

  // Lokal kopi når man redigerer
  const [draftMeta, setDraftMeta] = useState<ProjectMeta | null>(null);

  // Manuel prisjustering (fjernet)

  // Projekt liste med individuelle poster
  const [items, setItems] = useState<AnyItem[]>([]);

  // JSON pricing
  const [pricing, setPricing] = useState<JsonData | null>(null);
  // no explicit ready flag; we treat null base/extras as not-yet-loaded

  // Track last added item to scroll into view in the project list
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await loadPricesJson();
        if (!mounted) return;
        setPricing(data);
      } catch (e) {
        console.warn("Failed to load priser.json:", e);
        setPricing({ base: {}, extras: {} });
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

  // Map 5-stop quality (0..4) to 3-stop (lav/normal/høj)

  // Kort / muligheder (bruges til UI og "Fra"-pris på kortene)
  const options = [
    {
      id: "maling",
      label: "Indvendigt malerarbejde",
      icon: <FaPaintRoller />,
      info: "Maling: Overfladebehandling af vægge/lofter inkl. evt. ekstra detaljer.",
    },
    {
      id: "gulv",
      label: "Gulve",
      icon: <RiLayoutGridLine size={22} />,
      info: "Gulv: Udskiftning / renovering af gulv – kvalitet og gulvvarme.",
    },
    {
      id: "bad",
      label: "Bad/Toilet",
      icon: <FaBath />,
      info: "Bad/Toilet: Renovering eller flytning af bad/toilet.",
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
      label: "Facader",
      icon: <MdHouseSiding size={22} />,
      info: "Facade: Overfladebehandling eller ny beklædning + efterisolering.",
    },
    {
      id: "walls",
      label: "Vægge",
      icon: <GiBrickWall />,
      info: "Vægge: Opbygning af nye vægge (nedrivning er separat).",
    },
    {
      id: "demolition",
      label: "Nedrivning",
      icon: <GiBrickWall />,
      info: "Nedrivning for sig – let, bærende og indvendige vægge.",
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

  // Escalation handled via priser.json global.escalation later (no local autoFactor)

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
          paintQuality: 2,
          extras: {},
          coveragePercent: 100,
        };
        break;
      case "gulv":
        item = {
          uid: newUID(),
          typeId,
          label,
          floorQuality: 2,
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
          bathQuality: 2,
          roomKind: "bad",
          sizeM2: 6,
          addons: { bruseniche: false },
        };
        break;
      case "døreOgVinduer":
        item = {
          uid: newUID(),
          typeId: "døreOgVinduer",
          label,
          choice: "door",
          operation: "replacement",
          newInstall: "door",
          count: 1,
          quality: 2,
          sizeScale: 50,
        };
        break;
      case "terrasse":
        item = {
          uid: newUID(),
          typeId: "terrasse",
          label,
          area: 0,
          terraceQuality: 2,
          extra: {},
        };
        break;
      case "roof":
        item = {
          uid: newUID(),
          typeId: "roof",
          label,
          roofPitch: 0,
          roofQuality: 2,
          extras: {
            saddeltag: false,
            valm: false,
            undertag: false,
            efterisolering: false,
            kviste: 0,
          },
        };
        break;
      case "Facade":
        item = {
          uid: newUID(),
          typeId: "Facade",
          label,
          finish: "male",
          afterIso: false,
        };
        break;
      case "walls":
        item = {
          uid: newUID(),
          typeId: "walls",
          label,
          nyLet: false,
          nyBærende: false,
        };
        break;
      case "demolition":
        item = {
          uid: newUID(),
          typeId: "demolition",
          label,
          demoLet: false,
          demoBærende: false,
          demoIndvendig: false,
        };
        break;
      case "heating":
        item = {
          uid: newUID(),
          typeId: "heating",
          label,
          system: "radiator",
        };
        break;
      case "el":
        item = {
          uid: newUID(),
          typeId: "el",
          label,
          outletCount: 0,
          stikCount: 0,
          newPanel: false,
          hiddenRuns: false,
          evCharger: false,
        };
        break;
      case "køkken":
        item = {
          uid: newUID(),
          typeId: "køkken",
          label,
          placement: "same",
          quality: 2,
        };
        break;
      default:
        return;
    }

    setItems((prev) => [...prev, item]);
    setLastAddedId(item.uid);
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

  // Pris for én post (subtotal: base + extras; globals/postnr/escalation applied later)
  const calcItemSubtotal = (it: AnyItem): number => {
    const globalMult = pricing?.global?.multipliers ?? {};
    const basementFactor = meta?.basement ? globalMult.basement ?? 1 : 1;
    const firstFloorFactor = meta?.firstFloor ? globalMult.firstFloor ?? 1 : 1;

    let price = 0;
    let applyStoreyFactors = true; // disable for exterior where not relevant

    // 5-step quality factor helper: index 0..4 → [lav..1..høj]
    const fiveStepFactor = (idx: number, lav: number, høj: number) => {
      const i = Math.max(0, Math.min(4, Math.round(idx)));
      if (i <= 2) {
        // interpolate from lav at 0 to 1.0 at 2
        const t = i / 2;
        return lav + (1 - lav) * t;
      } else {
        // interpolate from 1.0 at 2 to høj at 4
        const t = (i - 2) / 2;
        return 1 + (høj - 1) * t;
      }
    };

    // Interpolate faktor directly from a JsonPrice row using the 5-step index
    const interpFaktor = (idx: number, row?: JsonPrice) =>
      fiveStepFactor(idx, row?.faktorLav ?? 1, row?.faktorHøj ?? 1);

    // Compute base price with explicit faktor value respecting beregning mode
    const baseWith = (
      row: JsonPrice | undefined,
      area: number,
      faktor: number
    ) => {
      const r =
        row ||
        ({
          startpris: 0,
          m2pris: 0,
          faktorLav: 1,
          faktorNormal: 1,
          faktorHøj: 1,
          beregning: "faktor_pa_m2_og_start",
        } as JsonPrice);
      const sqm = Math.max(0, area);
      let total = 0;
      switch (r.beregning) {
        case "faktor_kun_pa_start":
          total = (r.startpris || 0) * (faktor || 1) + (r.m2pris || 0) * sqm;
          break;
        case "kun_start_med_faktor":
          total = (r.startpris || 0) * (faktor || 1);
          break;
        case "kun_start":
          total = r.startpris || 0;
          break;
        case "kun_m2":
          total = (r.m2pris || 0) * sqm;
          break;
        default:
          total = ((r.startpris || 0) + (r.m2pris || 0) * sqm) * (faktor || 1);
      }
      return Math.max(0, Math.round(total));
    };

    switch (it.typeId) {
      case "maling": {
        const m = it as Extract<AnyItem, { typeId: "maling" }>;
        // Base scaled by coverage and quality (from priser.json)
        const coverage =
          Math.max(0, Math.min(100, m.coveragePercent ?? 100)) / 100;
        const areaCovered = AREA * coverage;
        const qIdx = (m.paintQuality ?? 2) as number;
        const malRow = pricing?.base?.["maling"];
        price += baseWith(malRow, areaCovered, interpFaktor(qIdx, malRow));

        // Independent lines handled as extras below

        // Træværk: add as additive extra if selected (fixed and/or per m² lines in JSON)
        if (m.extras?.["træværk"]) {
          const addTv = extrasTotal(
            pricing?.extras?.["maling"],
            areaCovered,
            ["træværk"],
            "maling:træværk"
          );
          price += addTv;
        }

        const extraNames: string[] = [];
        if (m.extras?.paneler) extraNames.push("høje", "paneler");
        if (m.extras?.stuk) extraNames.push("stuk");
        if (extraNames.length) {
          const add = extrasTotal(
            pricing?.extras?.["maling"],
            AREA,
            extraNames,
            "maling:extras"
          );
          price += add;
        }
        break;
      }
      case "gulv": {
        const qIdx = Math.max(0, Math.min(4, (it.floorQuality ?? 2) as number));
        const row = pricing?.base?.["gulv"];
        price += baseWith(row, AREA, interpFaktor(qIdx, row));
        if (it.hasFloorHeating) {
          const addVarme = extrasTotal(
            pricing?.extras?.["gulv"],
            AREA,
            ["gulvvarme"],
            "gulv:varme"
          );
          price += addVarme;
        }
        break;
      }
      case "bad": {
        const b = it as Extract<AnyItem, { typeId: "bad" }>;
        const qIdx = b.bathQuality ?? 2;
        const row =
          b.roomKind === "toilet"
            ? pricing?.base?.["toilet"]
            : pricing?.base?.["badeværelse"];
        const sz = Math.max(2, Math.min(12, b.sizeM2 ?? 6));
        const n = Math.max(1, Math.min(5, b.count ?? 1));
        const faktor = interpFaktor(qIdx, row);
        const baseUnfactored = baseWith(row, sz, 1);
        let base = Math.round(baseUnfactored * faktor) * n;
        const picks: string[] = [];
        if (b.bathPlacement === "new") picks.push("placering");
        if (b.addons?.bruseniche) picks.push("bruseniche");
        if (picks.length) {
          base = extrasTotal(
            pricing?.extras?.["badeværelse"],
            sz,
            picks,
            "bad:extras",
            n,
            undefined,
            base
          );
        }
        price += base;
        break;
      }
      case "døreOgVinduer": {
        // Per unit base × 5-trins interpoleret faktor (lav..høj) + evt. 'nyt hul' ekstra
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
        const qIdx = (doorWin.quality ?? 2) as number;
        const cnt = Math.max(0, doorWin.count || 0);
        const row = pricing?.base?.["døreOgVinduer"];
        let unit = baseWith(row, 1, interpFaktor(qIdx, row));
        const picks: string[] = [];
        if (operation === "newHole") picks.push("nyt", "hul");
        if (picks.length) {
          unit = extrasTotal(
            pricing?.extras?.["døre og vinduer"],
            1,
            picks,
            "døre/vinduer:extras",
            1,
            undefined,
            unit
          );
        }
        price += Math.round(unit) * cnt;
        break;
      }
      case "terrasse": {
        const t = it as Extract<AnyItem, { typeId: "terrasse" }>;
        const areaM2 = Math.max(0, t.area);
        const qIdx = (t.terraceQuality ?? 2) as number;
        const row = pricing?.base?.["terrasse"];
        let base = baseWith(row, areaM2, interpFaktor(qIdx, row));
        const picks: string[] = [];
        if (t.extra?.hævet) picks.push("hævet");
        if (t.extra?.værn) picks.push("værn");
        if (t.extra?.trappe) picks.push("trappe");
        if (picks.length) {
          base = extrasTotal(
            pricing?.extras?.["terrasse"],
            areaM2,
            picks,
            "terrasse:extras",
            1,
            undefined,
            base
          );
        }
        price += base;
        break;
      }
      case "roof": {
        applyStoreyFactors = false;
        const r = it as Extract<AnyItem, { typeId: "roof" }>;
        const qIdx = (r.roofQuality ?? 2) as number;
        const toggles = r.extras || {};
        const tagRow = pricing?.base?.["tag"];
        let base = baseWith(tagRow, AREA, interpFaktor(qIdx, tagRow));
        const picks: string[] = [];
        if (toggles.efterisolering) picks.push("efterisolering");
        if (toggles.undertag) picks.push("undertag");
        if (toggles.saddeltag) picks.push("saddeltag");
        if (toggles.valm) picks.push("valm");
        if ((toggles.kviste || 0) > 0) picks.push("kvist");
        const slope = Math.max(0, Math.min(90, r.roofPitch || 0));
        if (picks.length) {
          base = extrasTotal(
            pricing?.extras?.["tag"],
            AREA,
            picks,
            "tag:extras",
            Math.max(0, Number(toggles.kviste || 0)),
            slope,
            base
          );
        }
        price += base;
        break;
      }
      case "Facade": {
        const picks: string[] = [];
        if (it.finish === "male") picks.push("male");
        if (it.finish === "pudse") picks.push("pudse");
        if (it.finish === "træ") picks.push("træ");
        if (it.afterIso) picks.push("efterisolering");
        price += extrasTotal(
          pricing?.extras?.["facade"],
          AREA,
          picks,
          "facade:extras"
        );
        break;
      }
      case "walls": {
        const w = it as Extract<AnyItem, { typeId: "walls" }>;
        const baseRow = pricing?.base?.["walls"];
        let base = baseWith(baseRow, AREA, 1);
        const picks: string[] = [];
        if (w.nyLet) picks.push("nyLet");
        if (w.nyBærende) picks.push("nyBærende");
        if (picks.length) {
          base = extrasTotal(
            pricing?.extras?.["walls"],
            AREA,
            picks,
            "walls:extras",
            1,
            undefined,
            base
          );
        }
        price += base;
        break;
      }
      case "demolition": {
        const d = it as Extract<AnyItem, { typeId: "demolition" }>;
        const picks: string[] = [];
        if (d.demoLet) picks.push("let");
        if (d.demoBærende) picks.push("bærende");
        if (d.demoIndvendig) picks.push("indvendig");
        price += extrasTotal(
          pricing?.extras?.["demolition"],
          1,
          picks,
          "demolition:extras"
        );
        break;
      }
      case "heating": {
        const picks = [it.system];
        price += extrasTotal(
          pricing?.extras?.["heating"],
          1,
          picks,
          "heating:extras"
        );
        break;
      }
      case "el": {
        const e = it as Extract<AnyItem, { typeId: "el" }>;
        const elRow = pricing?.base?.["elektriker"];
        price += Math.max(0, Math.round(elRow?.startpris ?? 0));
        const sticks = Math.max(0, Number(e.stikCount ?? 0));
        const picks: string[] = [];
        if (sticks > 0) picks.push("stik");
        if (e.newPanel) picks.push("ny", "tavle");
        if (e.evCharger) picks.push("bil", "lader");
        if (e.hiddenRuns) picks.push("skjulte", "føringer");
        if (picks.length) {
          price = extrasTotal(
            pricing?.extras?.["elektriker"],
            1,
            picks,
            "elektriker:extras",
            sticks,
            undefined,
            price
          );
        }
        break;
      }
      case "køkken": {
        const k = it as Extract<AnyItem, { typeId: "køkken" }>;
        const qIdx = (k.quality ?? 2) as number;
        const row = pricing?.base?.["køkken"];
        const faktor = interpFaktor(qIdx, row);
        const start = (row?.startpris ?? 0) * (faktor || 1);
        const areaPart = (row?.m2pris ?? 0) * AREA;
        let base = Math.max(0, Math.round(start + areaPart));
        const picks: string[] = [];
        if (k.placement === "new") picks.push("placering");
        if (picks.length) {
          base = extrasTotal(
            pricing?.extras?.["køkken"],
            1,
            picks,
            "køkken:extras",
            1,
            undefined,
            base
          );
        }
        price += base;
        break;
      }
    }

    if (applyStoreyFactors) {
      price = Math.round(price * basementFactor * firstFloorFactor);
    }
    return Math.max(0, price);
  };

  // Antal pr. type til badge på kort
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) map[it.typeId] = (map[it.typeId] || 0) + 1;
    return map;
  }, [items]);

  const hasSelected = useMemo(
    () => Object.values(typeCounts).some((n) => n > 0),
    [typeCounts]
  );

  // No more "Fra" prices on cards

  const finalizePrice = (subtotal: number): number => {
    let t = subtotal;
    // Apply global (basement/firstFloor already applied per-item in subtotal above)
    // Apply postnummer factor
    const postnr = Number(meta?.postcode || 0) || undefined;
    t = applyPostnr(t, postnr, pricing?.postnrFaktorer || []);
    // Apply escalation from global
    t = applyEscalation(t, pricing?.global?.escalation);
    return Math.max(0, Math.round(t));
  };

  const sumAdjusted = useMemo(() => {
    return items.reduce(
      (acc, it) => acc + finalizePrice(calcItemSubtotal(it)),
      0
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, meta, pricing]);

  // smartRound & formatKr importeret

  // After adding an item, scroll the project list to show the newest
  useEffect(() => {
    if (!lastAddedId) return;
    const el = document.getElementById(`proj-${lastAddedId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    const t = setTimeout(() => setLastAddedId(null), 400);
    return () => clearTimeout(t);
  }, [lastAddedId]);

  // Measure sticky bar height to set bottom padding dynamically (mobile only)
  useEffect(() => {
    const applyPadding = () => {
      if (!mainRef.current) return;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (isDesktop) {
        mainRef.current.style.removeProperty("--bottom-bar-h");
        return;
      }
      const h = barRef.current?.offsetHeight || 0;
      // Add safe area inset for iOS
      const safe = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "env(safe-area-inset-bottom)"
        ) || "0"
      );
      const total = Math.max(64, h) + (isNaN(safe) ? 0 : safe);
      mainRef.current.style.setProperty("--bottom-bar-h", `${total}px`);
    };
    applyPadding();
    window.addEventListener("resize", applyPadding);
    return () => window.removeEventListener("resize", applyPadding);
  }, [items.length]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-gray-50 transition-all duration-[400ms] ease-out ${
        entered ? "opacity-100" : "opacity-0 translate-y-3"
      }`}
    >
      <main
        ref={mainRef}
        className={`flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 ${
          items.length > 0 ? "pb-dynamic md:pb-0" : "pb-8"
        }`}
      >
        {/* Grunddata */}
        {meta && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 min-w-0">
              <MdHome className="text-blue-700 text-lg sm:text-xl" />
              <strong className="mr-1">Grunddata:</strong>
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-[11px] sm:text-xs">
                  {meta.propertyType === "house"
                    ? "Hus"
                    : meta.propertyType === "apartment"
                    ? "Lejlighed"
                    : "Sommerhus"}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-[11px] sm:text-xs">
                  {meta.sizeM2} m²
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-[11px] sm:text-xs">
                  Postnr: {meta.postcode || "—"}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-[11px] sm:text-xs">
                  Kælder: {meta.basement ? "Ja" : "Nej"}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-[11px] sm:text-xs">
                  1. sal: {meta.firstFloor ? "Ja" : "Nej"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setDraftMeta(meta);
                setShowMetaEditor(true);
              }}
              className="text-[11px] sm:text-xs bg-white border border-blue-300 rounded px-2.5 py-1 hover:bg-blue-100"
            >
              Rediger
            </button>
          </div>
        )}

        {/* Meta editor modal */}
        {showMetaEditor && draftMeta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMetaEditor(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-4"
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
          {/* Venstre: KORT opdelt i kolonner (ikke-valgte / valgte) */}
          <section
            className={`grid ${
              hasSelected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            } gap-3 items-start`}
          >
            {/* Ikke valgte */}
            <div>
              <div className="text-[11px] text-gray-500 mb-1.5">Øvrige</div>
              <div className="grid gap-2 sm:gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                {options
                  .filter((o) => !(typeCounts[o.id] > 0))
                  .map((opt) => {
                    const count = typeCounts[opt.id] || 0;
                    return (
                      <div
                        key={opt.id}
                        className={`relative group bg-white rounded-lg border shadow-sm hover:shadow transition-all cursor-pointer active:bg-blue-50 active:ring-1 active:ring-blue-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[.985] overflow-visible ${
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
                        <div className="p-1.5 sm:p-2 flex flex-col min-h-[68px] sm:min-h-[84px]">
                          <div>
                            <div className="flex items-center gap-1 text-[12px] sm:text-[13px] font-medium leading-snug">
                              {opt.icon}
                              <span
                                className="flex items-center gap-1 whitespace-nowrap"
                                title={opt.label}
                              >
                                <span>{opt.label}</span>
                                <InfoTooltip text={opt.info} />
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] sm:text-[10px] text-gray-500 group-active:text-blue-600 transition-colors">
                              Klik for at tilføje
                            </span>
                            <span />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Valgte */}
            {hasSelected && (
              <div>
                <div className="text-[11px] text-gray-500 mb-1.5">Valgte</div>
                <div className="grid gap-3 sm:gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                  {options
                    .filter((o) => typeCounts[o.id] > 0)
                    .map((opt) => {
                      const count = typeCounts[opt.id] || 0;
                      return (
                        <div
                          key={opt.id}
                          className={`relative group bg-white rounded-lg border shadow-sm hover:shadow transition-all cursor-pointer active:bg-blue-50 active:ring-1 active:ring-blue-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[.985] overflow-visible border-blue-400`}
                          onClick={() => addItem(opt.id as AnyItem["typeId"])}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              addItem(opt.id as AnyItem["typeId"]);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Tilføj ${opt.label} (valgt ${count})`}
                          title="Klik for at tilføje til projektlisten"
                        >
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-blue-500" />
                          <span className="pointer-events-none absolute bottom-2 right-1 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] w-5 h-5 shadow-sm">
                            {count}
                          </span>
                          <div className="p-2.5 sm:p-3 flex flex-col min-h-[92px] sm:min-h-[112px]">
                            <div>
                              <div className="flex items-center gap-1.5 text-[13px] sm:text-sm font-medium leading-snug">
                                {opt.icon}
                                <span
                                  className="flex items-center gap-1 whitespace-nowrap"
                                  title={opt.label}
                                >
                                  <span>{opt.label}</span>
                                  <InfoTooltip text={opt.info} />
                                </span>
                                <span className="ml-auto" />
                              </div>
                            </div>
                            <div className="mt-auto pt-1.5 flex items-center justify-between gap-2">
                              <span className="text-[10px] sm:text-[11px] text-gray-500 group-active:text-blue-600 transition-colors">
                                Klik for at tilføje
                              </span>
                              <span />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </section>

          {/* Højre: PROJEKT LISTE */}
          <aside className="lg:sticky lg:top-6 h-fit bg-white rounded-xl shadow p-4 w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-sm xl:max-w-[420px] mx-auto lg:mx-0">
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
                ref={listRef}
                className="space-y-4 overflow-y-auto overflow-x-hidden touch-pan-y pr-1 max-h-[55vh] md:max-h-[420px] overscroll-contain"
                aria-label="Projekt liste elementer (scroll)"
              >
                {/* Mobile sticky total inside the scroll area */}
                <div className="md:hidden -mx-3 -mt-2 px-3 pt-2 pb-2 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    Samlet
                    <span className="ml-1 normal-case text-[10px] text-gray-500">
                      (inkl. moms)
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-blue-700">
                    {formatKr(smartRound(sumAdjusted))}
                  </span>
                </div>
                {items.map((it) => {
                  // Subtotal = base + extras (+ relevant storey multipliers)
                  const itemBase = calcItemSubtotal(it);
                  // Finalize = apply postnr factor and escalation
                  const itemAdj = finalizePrice(itemBase);

                  return (
                    <div
                      key={it.uid}
                      id={`proj-${it.uid}`}
                      className="relative rounded-lg border border-gray-200 p-3 bg-gray-50"
                    >
                      {/* Fjern button in top-right corner */}
                      <button
                        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs sm:text-sm"
                        title="Fjern denne post"
                        aria-label="Fjern denne post"
                        onClick={() => removeItem(it.uid)}
                      >
                        <span aria-hidden>×</span>
                        <span className="hidden sm:inline">Fjern</span>
                      </button>
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pr-12 sm:pr-20">
                        <div className="flex items-center gap-2 font-medium">
                          <span>
                            {options.find((o) => o.id === it.typeId)?.icon}
                          </span>
                          <span className="flex items-center gap-1 text-sm sm:text-base">
                            {options.find((o) => o.id === it.typeId)?.label ||
                              it.label}
                            <InfoTooltip
                              text={
                                options.find((o) => o.id === it.typeId)?.info
                              }
                            />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                          <span className="text-xs sm:text-sm font-semibold">
                            {formatKr(Math.round(itemAdj))}
                          </span>
                        </div>
                      </div>

                      {/* Editor – pr. post */}
                      <div className="mt-3 rounded-lg bg-white border border-gray-200 px-4 py-4 space-y-5 text-sm leading-relaxed overflow-x-visible">
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
                        {it.typeId === "demolition" && (
                          <DemolitionEditor
                            item={
                              it as Extract<AnyItem, { typeId: "demolition" }>
                            }
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
              <span className="text-xs sm:text-sm text-gray-600">
                Samlet{" "}
                <span className="text-[10px] text-gray-500">(inkl. moms)</span>
              </span>
              <span className="text-sm sm:text-base font-bold text-blue-700">
                {formatKr(smartRound(sumAdjusted))}
              </span>
            </div>

            {/* Manuel justering fjernet */}
          </aside>
        </div>
      </main>
      {/* Sticky mobil bund-bar (fast nederst) */}
      {items.length > 0 && (
        <div
          ref={barRef}
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-2 pb-2 pb-safe-bottom flex items-center justify-between shadow-lg"
          aria-label="Samlet pris sticky bar"
        >
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide text-gray-500">
              Samlet
            </span>
            <span className="text-[10px] text-gray-500">(inkl. moms)</span>
            <span className="text-base font-semibold text-blue-700">
              {formatKr(smartRound(sumAdjusted))}
            </span>
          </div>
          <button
            onClick={() => {
              // 1) Prefer scrolling to the footer to ensure disclaimer is visible
              const footer = document.getElementById("footer-disclaimer");
              if (footer) {
                footer.scrollIntoView({ behavior: "smooth", block: "end" });
                return;
              }
              // 2) Otherwise, try to scroll the project list to its last card
              const listEl = document.querySelector(
                '[aria-label="Projekt liste elementer (scroll)"]'
              ) as HTMLDivElement | null;
              if (listEl) {
                const last = listEl.lastElementChild as HTMLElement | null;
                if (last) {
                  last.scrollIntoView({ behavior: "smooth", block: "end" });
                  return;
                }
              }
              // 3) Fallback: scroll the window to the bottom
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
              });
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 active:scale-[.97] transition"
          >
            Til bunden
          </button>
        </div>
      )}
      {/* Footer disclaimer inside main to keep spacing tight */}
      <footer
        id="footer-disclaimer"
        role="contentinfo"
        className="mt-6 px-4 pb-24 md:pb-8 text-[11px] sm:text-xs text-gray-600 max-w-3xl mx-auto border-t border-gray-200 pt-4 relative"
      >
        {/* Mascot pointing to the disclaimer – sit just outside the left side on larger screens */}
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
    </div>
  );
}
