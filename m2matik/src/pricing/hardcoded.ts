import type { PricingTable, PricingContext } from "./schema";

export const PRICES: PricingTable = {
  sqm: {
    maling: 120,
    gulv: 350,
    facade: 250,
  },
  fixed: {
    bad: 20000,
    Facade: 0,       // base 0 – vi bruger m² + tillæg
    døreOgVinduer: 0,// beregnes i extras.doorWindow
    terrasse: 0,     // beregnes under extras.terrace
    dormer: 0,       // per styk
    walls: 0,        // valgbaseret
    heating: 0,      // suboptions
    el: 8000,
  },
  extras: {
    floorHeating: 5000,
    dormerPerPiece: 10000,
    terrace: {
      base: 12000,
      perM2: 500,
      hævet: 3000,
      trappe: 2500,
      værn: 2000,
    },
    doorWindow: {
      doorReplace: 5000,
      windowReplace: 4000,
      newHoleDoor: 3000,
      newHoleWindow: 2500,
    },
    facade: {
      behandle: 5000,
      efterisolering: 10000,
    },
    walls: {
      nedrivning: 7000,
      nyVæg: 12000,
    },
    heating: {
      fjernvarme: 12000,
      radiator: 8000,
    },
  },
};

export function calcPriceForOption(
  optionId: string,
  ctx: PricingContext
): number {
  let total = 0;

  // m²-baserede
  if (optionId === "maling") total += ctx.sqm * PRICES.sqm.maling;
  if (optionId === "gulv") {
    total += ctx.sqm * PRICES.sqm.gulv;
    if (ctx.flags.hasFloorHeating) total += PRICES.extras.floorHeating;
  }
  if (optionId === "Facade") {
    total += ctx.sqm * PRICES.sqm.facade;
    if (ctx.choices.facadeType === "behandle") total += PRICES.extras.facade.behandle;
    if (ctx.choices.facadeType === "efterisolering") total += PRICES.extras.facade.efterisolering;
  }

  // faste (hvis nogen)
  if (PRICES.fixed[optionId as keyof typeof PRICES.fixed])
    total += PRICES.fixed[optionId as keyof typeof PRICES.fixed] ?? 0;

  // special: dør/vindue
  if (optionId === "døreOgVinduer" && (ctx.counts.doorWindow ?? 0) > 0) {
    const n = ctx.counts.doorWindow!;
    if (ctx.choices.doorOrWindow === "door") {
      total += n * PRICES.extras.doorWindow.doorReplace;
      if (ctx.choices.doorWindowType === "newHole")
        total += n * PRICES.extras.doorWindow.newHoleDoor;
    } else {
      total += n * PRICES.extras.doorWindow.windowReplace;
      if (ctx.choices.doorWindowType === "newHole")
        total += n * PRICES.extras.doorWindow.newHoleWindow;
    }
  }

  // special: terrasse
  if (optionId === "terrasse") {
    total += PRICES.extras.terrace.base;
    total += (ctx.terraceArea || 0) * PRICES.extras.terrace.perM2;
    if (ctx.flags.terraceHævet) total += PRICES.extras.terrace.hævet;
    if (ctx.flags.terraceTrappe) total += PRICES.extras.terrace.trappe;
    if (ctx.flags.terraceVærn) total += PRICES.extras.terrace.værn;
  }

  // special: kviste
  if (optionId === "dormer" && (ctx.counts.dormers ?? 0) > 0) {
    total += (ctx.counts.dormers || 0) * PRICES.extras.dormerPerPiece;
  }

  // special: vægge
  if (optionId === "walls") {
    if (ctx.choices.wallOption === "nedrivning") total += PRICES.extras.walls.nedrivning;
    if (ctx.choices.wallOption === "nyVæg") total += PRICES.extras.walls.nyVæg;
  }

  // special: heating
  if (optionId === "heating") {
    if (ctx.choices.heatingType === "fjernvarme") total += PRICES.extras.heating.fjernvarme;
    if (ctx.choices.heatingType === "radiator") total += PRICES.extras.heating.radiator;
  }

  return total;
}
