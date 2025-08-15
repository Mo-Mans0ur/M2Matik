import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

describe("køkken lowest price formula", () => {
  it("(startpris * lav faktor) + (m2pris * 80 m²) = 210.000 kr", () => {
    const jsonPath = path.join(__dirname, "../../../public/data/priser.json");
    const raw = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(raw);
    const k = data.base["køkken"]; // { startpris, m2pris, faktorLav }
    const area = 80;
    const total = Math.round(k.startpris * k.faktorLav + k.m2pris * area);
    expect(total).toBe(210000);
  });
});
