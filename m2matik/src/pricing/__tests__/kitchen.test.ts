import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { baseTotal, type JsonPrice } from "../json";

describe("køkken lowest price formula", () => {
  it("applies 'faktor_kun_pa_start' correctly and adds m2-part un-factored", () => {
    const jsonPath = path.join(__dirname, "../../../public/data/priser.json");
    const raw = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(raw);
    const k: JsonPrice = data.base["køkken"]; // { startpris, m2pris, faktorLav, beregning }
    const area = 80;
    const got = baseTotal(k, area, "lav", "køkken:test");
    // Expect equals startpris*faktorLav + m2pris*area when beregning is 'faktor_kun_pa_start'
    const expected = Math.round(
      k.startpris * (k.faktorLav ?? 1) + k.m2pris * area
    );
    expect(got).toBe(expected);
  });
});
