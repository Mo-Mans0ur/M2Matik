import { describe, it, expect } from "vitest";
import { extrasTotal } from "../json";

describe("painting extras selection", () => {
  it("matches by substring and sums amounts", () => {
    const list = [
      { name: "Høje paneler (pr. m²)", kind: "per_m2" as const, amount: 150 },
      { name: "Stuk (fast)", kind: "fixed" as const, amount: 2500 },
    ];
    const area = 80;
    const sum = extrasTotal(list, area, ["paneler", "stuk"]);
    expect(sum).toBe(150 * area + 2500);
  });
});
