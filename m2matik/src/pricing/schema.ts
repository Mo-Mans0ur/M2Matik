// priser

export type OptionId =
  | "maling"
  | "gulv"
  | "bad"
  | "døreOgVinduer"
  | "terrasse"
  | "dormer"
  | "Facade"
  | "walls"
  | "heating"
  | "el";

export type SubId =
  | "overfladisk"
  | "fuld" // avanceret maling
  | "slibning"
  | "sildeben" // avanceret gulv
  | "fjernvarme"
  | "radiator" // heating
  | "door"
  | "window"
  | "newHole" // døre/vinduer (kun til logik)
  | "behandle"
  | "efterisolering" // facade
  | "nedrivning"
  | "nyVæg" // vægge
  | "hævet"
  | "trappe"
  | "værn"; // terrasse




export interface PricingContext {
  sqm: number; // størrelse i m² fra forsiden
  terraceArea: number; // terrasse areal i m²
  counts: {
    dormers?: number; // antal kviste
    doorWindow?: number; // antal døre/vinduer
  };
  flags: {
    hasFloorHeating?: boolean; // om der er gulvvarme
    terraceHævet?: boolean; // om terrassen er hævet
    terraceTrappe?: boolean;
    terraceVærn?: boolean;
  };
  choices: {
    doorOrWindow?: "door" | "window";
    doorWindowType?: "doorWindowReplacement" | "newHole";
    facadeType?: "behandle" | "efterisolering";
    wallOption?: "nedrivning" | "nyVæg";
    heatingType?: "fjernvarme" | "radiator";
  };
}




export interface PricingTable {
  sqm: {
    maling: number;
    gulv: number;
    facade: number;
  };
  fixed: Partial<Record<OptionId, number>>;
  extras: {
    floorHeating: number;
    dormerPerPiece: number;
    terrace: {
      base: number;
      perM2: number;
      hævet: number;
      trappe: number;
      værn: number;
    };
    doorWindow: {
      doorReplace: number;
      windowReplace: number;
      newHoleDoor: number;
      newHoleWindow: number;
    };
    facade: {
      behandle: number;
      efterisolering: number;
    };
    walls: {
      nedrivning: number;
      nyVæg: number;
    };
    heating: {
      fjernvarme: number;
      radiator: number;
    };
  };
}
