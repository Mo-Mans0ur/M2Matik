import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import {
  applyEscalation,
  applyPostnr,
  extrasTotal,
  loadPricesJson,
  type JsonData,
} from "../pricing/json";

type RoofKind = "fladt" | "saddeltag" | "valm";

export default function Addition() {
  const [pricing, setPricing] = useState<JsonData | null>(null);
  const [area, setArea] = useState<number>(40);
  const [firstFloor, setFirstFloor] = useState<boolean>(false);
  // Match Renovation: 5-step quality slider (0..4), where 2 ~ normal
  const [quality, setQuality] = useState<number>(2);
  const [roofKind, setRoofKind] = useState<RoofKind>("fladt");
  const [roofSlope, setRoofSlope] = useState<number>(15);
  const [kviste, setKviste] = useState<number>(0);
  const [gulvvarme, setGulvvarme] = useState<boolean>(false);
  const [sockets, setSockets] = useState<number>(6);
  const [hasKitchen, setHasKitchen] = useState<boolean>(false);
  const [kitchenArea, setKitchenArea] = useState<number>(10);
  const [hasBathroom, setHasBathroom] = useState<boolean>(false);
  const [bathHasShower, setBathHasShower] = useState<boolean>(true);
  const [postcode, setPostcode] = useState<string>("");

  useEffect(() => {
    loadPricesJson().then(setPricing).catch(console.error);
  }, []);

  // Helpers copied from Renovation to respect beregning modes with a 5-step quality
  const fiveStepFactor = (idx: number, lav: number, høj: number) => {
    const i = Math.max(0, Math.min(4, Math.round(idx)));
    if (i <= 2) {
      const t = i / 2;
      return lav + (1 - lav) * t;
    } else {
      const t = (i - 2) / 2;
      return 1 + (høj - 1) * t;
    }
  };
  const baseWith = (
    row: JsonData["base"][string] | undefined,
    areaM2: number,
    faktor: number
  ) => {
    const r = row || {
      startpris: 0,
      m2pris: 0,
      faktorLav: 1,
      faktorNormal: 1,
      faktorHøj: 1,
      beregning: "faktor_pa_m2_og_start",
    };
    const sqm = Math.max(0, areaM2);
    switch (r.beregning) {
      case "faktor_kun_pa_start":
        return Math.max(
          0,
          Math.round((r.startpris || 0) * (faktor || 1) + (r.m2pris || 0) * sqm)
        );
      case "faktor_kun_pa_m2":
        return Math.max(
          0,
          Math.round((r.startpris || 0) + (r.m2pris || 0) * sqm * (faktor || 1))
        );
      case "kun_start_med_faktor":
        return Math.max(0, Math.round((r.startpris || 0) * (faktor || 1)));
      case "kun_start":
        return Math.max(0, Math.round(r.startpris || 0));
      case "kun_m2":
        return Math.max(0, Math.round((r.m2pris || 0) * sqm));
      default:
        return Math.max(
          0,
          Math.round((r.startpris || 0) + (r.m2pris || 0) * sqm * (faktor || 1))
        );
    }
  };

  const breakdown = useMemo(() => {
    if (!pricing) return null;
    // Map 5-step quality to label if needed elsewhere
    // Interpolated faktor from the selected quality
    const faktorWalls = fiveStepFactor(
      quality,
      pricing.base["walls"]?.faktorLav ?? 1,
      pricing.base["walls"]?.faktorHøj ?? 1
    );
    const faktorRoof = fiveStepFactor(
      quality,
      pricing.base["tag"]?.faktorLav ?? 1,
      pricing.base["tag"]?.faktorHøj ?? 1
    );
    const faktorFloor = fiveStepFactor(
      quality,
      pricing.base["gulv"]?.faktorLav ?? 1,
      pricing.base["gulv"]?.faktorHøj ?? 1
    );
    const faktorEl = fiveStepFactor(
      quality,
      pricing.base["elektriker"]?.faktorLav ?? 1,
      pricing.base["elektriker"]?.faktorHøj ?? 1
    );
    const faktorKitchen = fiveStepFactor(
      quality,
      pricing.base["køkken"]?.faktorLav ?? 1,
      pricing.base["køkken"]?.faktorHøj ?? 1
    );
    const faktorBath = fiveStepFactor(
      quality,
      pricing.base["badeværelse"]?.faktorLav ?? 1,
      pricing.base["badeværelse"]?.faktorHøj ?? 1
    );
    const picksRoof: string[] = [];
    if (roofKind === "saddeltag") picksRoof.push("saddeltag");
    if (roofKind === "valm") picksRoof.push("valm");
    picksRoof.push("roofSlope");
    if (kviste > 0) picksRoof.push("kvist");

    // Walls (pure m²)
    const wallsBase = baseWith(pricing.base["walls"], area, faktorWalls);

    // Roof over footprint, include slope/kviste
    let roofBase = baseWith(pricing.base["tag"], area, faktorRoof);
    if (picksRoof.length) {
      roofBase = extrasTotal(
        pricing.extras["tag"],
        area,
        picksRoof,
        "tag:extras",
        Math.max(0, kviste),
        roofSlope,
        roofBase
      );
    }

    // Floors: ground + optional first floor
    const floorsArea = area * (firstFloor ? 2 : 1);
    let floorsBase = baseWith(pricing.base["gulv"], floorsArea, faktorFloor);
    if (gulvvarme) {
      floorsBase = extrasTotal(
        pricing.extras["gulv"],
        floorsArea,
        ["gulvvarme"],
        "gulv:extras",
        1,
        undefined,
        floorsBase
      );
    }

  // Electricity: base + per-socket; extras match Excel names
    let elBase = baseWith(pricing.base["elektriker"], floorsArea, faktorEl);
    if (sockets > 0) {
      elBase = extrasTotal(
        pricing.extras["elektriker"],
    1,
    ["stik"],
        "elektriker:extras",
        sockets,
        undefined,
        elBase
      );
    }

    // Kitchen (optional)
    let kitchenBase = 0;
    if (hasKitchen) {
      kitchenBase = baseWith(
        pricing.base["køkken"],
        Math.max(0, kitchenArea),
        faktorKitchen
      );
    }

    // Bathroom (optional)
    let bathBase = 0;
    if (hasBathroom) {
      bathBase = baseWith(pricing.base["badeværelse"], 1, faktorBath);
      if (bathHasShower) {
        bathBase = extrasTotal(
          pricing.extras["badeværelse"],
          1,
          ["bruseniche"],
          "badeværelse:extras",
          1,
          undefined,
          bathBase
        );
      }
    }

    const subtotal = Math.max(
      0,
      Math.round(
        wallsBase + roofBase + floorsBase + elBase + kitchenBase + bathBase
      )
    );
    const withPostnr = applyPostnr(
      subtotal,
      Number(postcode) || undefined,
      pricing.postnrFaktorer || []
    );
    const total = applyEscalation(withPostnr, pricing.global?.escalation);

    return {
      wallsBase,
      roofBase,
      floorsBase,
      elBase,
      kitchenBase,
      bathBase,
      subtotal,
      withPostnr,
      total,
    };
  }, [
    pricing,
    area,
    firstFloor,
    quality,
    roofKind,
    roofSlope,
    kviste,
    gulvvarme,
    sockets,
    hasKitchen,
    kitchenArea,
    hasBathroom,
    bathHasShower,
    postcode,
  ]);

  const fmt = (n: number | undefined) =>
    (n ?? 0).toLocaleString("da-DK", {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 0,
    });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <BackButton />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Tilbyggeri</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl shadow border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Areal (m²)</span>
              <input
                type="number"
                min={0}
                value={area}
                onChange={(e) => setArea(Number(e.target.value) || 0)}
                className="border rounded px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={firstFloor}
                onChange={(e) => setFirstFloor(e.target.checked)}
              />
              <span>Med 1. sal</span>
            </label>
            {/* 5-step quality slider like Renovation */}
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">
                Kvalitet (
                {quality <= 1 ? "Lav" : quality >= 3 ? "Høj" : "Normal"})
              </span>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Postnummer</span>
              <input
                type="text"
                inputMode="numeric"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="f.eks. 3700"
              />
            </label>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Tagtype</span>
              <select
                value={roofKind}
                onChange={(e) => setRoofKind(e.target.value as RoofKind)}
                className="border rounded px-3 py-2"
              >
                <option value="fladt">Fladt</option>
                <option value="saddeltag">Saddeltag</option>
                <option value="valm">Valm</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Taghældning (°)</span>
              <input
                type="range"
                min={0}
                max={45}
                value={roofSlope}
                onChange={(e) => setRoofSlope(Number(e.target.value) || 0)}
              />
              <span className="text-xs text-gray-500">{roofSlope}°</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Antal kviste</span>
              <input
                type="number"
                min={0}
                value={kviste}
                onChange={(e) =>
                  setKviste(Math.max(0, Number(e.target.value) || 0))
                }
                className="border rounded px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={gulvvarme}
                onChange={(e) => setGulvvarme(e.target.checked)}
              />
              <span>Gulvvarme</span>
            </label>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Antal stikkontakter</span>
              <input
                type="number"
                min={0}
                value={sockets}
                onChange={(e) =>
                  setSockets(Math.max(0, Number(e.target.value) || 0))
                }
                className="border rounded px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={hasKitchen}
                onChange={(e) => setHasKitchen(e.target.checked)}
              />
              <span>Inkl. køkken</span>
            </label>
            {hasKitchen && (
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Køkken areal (m²)</span>
                <input
                  type="number"
                  min={0}
                  value={kitchenArea}
                  onChange={(e) =>
                    setKitchenArea(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="border rounded px-3 py-2"
                />
              </label>
            )}
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={hasBathroom}
                onChange={(e) => setHasBathroom(e.target.checked)}
              />
              <span>Inkl. badeværelse</span>
            </label>
            {hasBathroom && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bathHasShower}
                  onChange={(e) => setBathHasShower(e.target.checked)}
                />
                <span>Bruseniche</span>
              </label>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-4 space-y-3">
          <h2 className="font-semibold">Oversigt</h2>
          {!pricing && (
            <div className="text-gray-500 text-sm">Indlæser priser…</div>
          )}
          {pricing && breakdown && (
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Vægge</span>
                <span>{fmt(breakdown.wallsBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tag</span>
                <span>{fmt(breakdown.roofBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gulve</span>
                <span>{fmt(breakdown.floorsBase)}</span>
              </div>
              <div className="flex justify-between">
                <span>El</span>
                <span>{fmt(breakdown.elBase)}</span>
              </div>
              {hasKitchen && (
                <div className="flex justify-between">
                  <span>Køkken</span>
                  <span>{fmt(breakdown.kitchenBase)}</span>
                </div>
              )}
              {hasBathroom && (
                <div className="flex justify-between">
                  <span>Badeværelse</span>
                  <span>{fmt(breakdown.bathBase)}</span>
                </div>
              )}
              <div className="border-t my-2" />
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>{fmt(breakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efter postnr</span>
                <span>{fmt(breakdown.withPostnr)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Estimat</span>
                <span>{fmt(breakdown.total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
