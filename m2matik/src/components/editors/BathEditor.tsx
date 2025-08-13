import React from "react";
import type { ItemBad } from "../../pages/renovationTypes";

interface Props {
  item: ItemBad;
  update: (key: string, val: unknown) => void;
}
export const BathEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <div className="flex gap-4 text-sm">
      {(
        [
          { key: "same", label: "Samme placering" },
          { key: "new", label: "Ny placering (+25.000 pr. bad)" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`bathPlacement_${item.uid}`}
            value={opt.key}
            checked={item.bathPlacement === opt.key}
            onChange={() => update("bathPlacement", opt.key)}
            className="w-4 h-4 accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
    <label className="block text-sm text-gray-600">
      Antal badeværelser: {Math.max(0, Math.min(5, (item as any).count ?? 1))}
    </label>
    <input
      type="range"
      min={0}
      max={5}
      step={1}
      value={(item as any).count ?? 1}
      onChange={(e) => update("count", parseInt(e.target.value, 10))}
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
      aria-label="Antal badeværelser"
      title="Antal badeværelser"
    />
    <div className="h-px bg-gray-200 my-2" />
    <label className="block text-sm text-gray-600">
      Kvalitet (
      {item.bathQuality === 0
        ? "Billig"
        : item.bathQuality === 1
        ? "Middel"
        : "Dyr"}
      )
    </label>
    <input
      type="range"
      min={0}
      max={2}
      step={1}
      value={item.bathQuality ?? 1}
      onChange={(e) =>
        update("bathQuality", parseInt(e.target.value, 10) as 0 | 1 | 2)
      }
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
      aria-label="Vælg badkvalitet"
    />
    <div className="relative h-4 mt-1 text-[11px] text-gray-500 select-none">
      <span className="absolute left-0">Billig</span>
      <span className="absolute left-1/2 -translate-x-1/2">Middel</span>
      <span className="absolute right-0">Dyr</span>
    </div>
  </div>
);
export default BathEditor;
