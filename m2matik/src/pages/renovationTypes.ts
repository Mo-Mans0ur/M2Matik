// Centraliserede typer og konstanter for Renovering siden

export const BASE_DATE = new Date("2025-01-01");
export const ANNUAL_ADJUSTMENT = 0.03;

// Basis item type
export type ItemBase = {
  uid: string;
  typeId:
    | "maling"
    | "gulv"
    | "bad"
    | "døreOgVinduer"
    | "terrasse"
    | "roof"
    | "Facade"
    | "walls"
    | "demolition"
    | "heating"
    | "el"
    | "køkken";
  label: string;
};

export type ItemMaling = ItemBase & {
  typeId: "maling";
  paintQuality: 0 | 1 | 2 | 3 | 4; // 5-stop slider: 0..4 (Budget..Eksklusiv)
  extras: { træværk?: boolean; paneler?: boolean; stuk?: boolean };
  // procent af boligen der skal males (0-100)
  coveragePercent?: number;
};

export type ItemGulv = ItemBase & {
  typeId: "gulv";
  floorQuality: 0 | 1 | 2 | 3 | 4; // 5-stop slider
  hasFloorHeating: boolean;
};

export type ItemBad = ItemBase & {
  typeId: "bad";
  bathPlacement: "same" | "new";
  count: number; // antal badeværelser (0-5)
  bathQuality?: 0 | 1 | 2 | 3 | 4; // 5-stop slider
  roomKind?: "bad" | "toilet"; // type af rum
  sizeM2?: number; // 2-12 m2 (UI)
  addons?: { bruseniche?: boolean; badekar?: boolean };
};

export type ItemDøreVinduer = ItemBase & {
  typeId: "døreOgVinduer";
  choice: "door" | "window"; // Linje 1
  operation: "replacement" | "newHole"; // Linje 2
  newInstall: "door" | "window"; // Linje 3
  variant?: "doorWindowReplacement" | "newHole" | "newDoor" | "newWindow"; // legacy
  count: number;
  // Nye felter
  quality?: 0 | 1 | 2 | 3 | 4; // 5-stop slider
  sizeScale?: number; // 0-100 cm (UI slider). Baseline 50 cm = normal størrelse
};

export type ItemTerrasse = ItemBase & {
  typeId: "terrasse";
  area: number;
  // 5-trins kvalitet (Budget..Eksklusiv)
  terraceQuality?: 0 | 1 | 2 | 3 | 4;
  extra: { hævet?: boolean; trappe?: boolean; værn?: boolean };
};

export type ItemRoof = ItemBase & {
  typeId: "roof";
  // Ny model: én tagtype med hældning, kvalitet og tilvalg
  roofPitch: number; // hældning i grader (0-45)
  roofQuality: 0 | 1 | 2 | 3 | 4; // 5-stop slider
  extras: {
    saddeltag?: boolean;
    valm?: boolean;
    undertag?: boolean; // fast undertag
    efterisolering?: boolean;
    kviste?: number; // antal kviste
  };
};

export type ItemFacade = ItemBase & {
  typeId: "Facade";
  finish: "male" | "pudse" | "træ";
  afterIso: boolean;
};

export type ItemWalls = ItemBase & {
  typeId: "walls";
  // Nye vægge
  nyLet?: boolean; // ny letskillevæg
  nyBærende?: boolean; // ny bærende væg
};

export type ItemDemolition = ItemBase & {
  typeId: "demolition";
  // Nedrivning
  demoLet?: boolean; // let skillevæg
  demoBærende?: boolean; // bærende væg
  demoIndvendig?: boolean; // nedrivning af indvendig væg
};

export type ItemHeating = ItemBase & {
  typeId: "heating";
  system: "fjernvarme" | "radiator";
};

export type ItemEl = ItemBase & {
  typeId: "el";
  outletCount: number;
  stikCount?: number; // antal stik (0-50)
  newPanel: boolean;
  hiddenRuns: boolean;
  evCharger?: boolean; // bil lader
};

export type ItemKitchen = ItemBase & {
  typeId: "køkken";
  placement: "same" | "new";
  quality?: 0 | 1 | 2 | 3 | 4; // 5-stop slider
};

export type AnyItem =
  | ItemMaling
  | ItemGulv
  | ItemBad
  | ItemDøreVinduer
  | ItemTerrasse
  | ItemRoof
  | ItemFacade
  | ItemWalls
  | ItemDemolition
  | ItemHeating
  | ItemEl
  | ItemKitchen;

// Standard satser og konstanter
export const perM2: Record<string, number> = {
  maling: 100,
  gulv: 150,
  bad: 0,
  døreOgVinduer: 0,
  terrasse: 120,
  dormer: 100,
  facade: 250,
  walls: 7000,
};

export const doorWindowBase = {
  door: 5000,
  window: 4000,
  extraForNewHoleDoor: 3000,
  extraForNewHoleWindow: 2500,
};

export const kitchenBase = 15000;
export const kitchenExtraNewPlacement = 20000;

// Hjælpere
export const newUID = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const formatKr = (n: number) =>
  `${Math.max(n, 0).toLocaleString("da-DK")} kr.`;
export const smartRound = (price: number) => Math.ceil(price / 1000) * 1000; // round up to nearest 1000
