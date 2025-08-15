import React from "react";
import type { ItemMaling } from "../../pages/renovationTypes";

interface Props {
  item: ItemMaling;
  update: (key: string, val: unknown) => void;
}

export const PaintingEditor: React.FC<Props> = ({ item, update }) => {
  const q = Math.max(0, Math.min(4, item.paintQuality ?? 2));
  const qualityName = ["Budget", "Basis", "Standard", "Premium", "Eksklusiv"][
    q
  ];
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-600">
        Hvor meget af boligen skal males: {item.coveragePercent ?? 0}%
      </label>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={item.coveragePercent ?? 0}
        onChange={(e) =>
          update("coveragePercent", parseInt(e.target.value, 10))
        }
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
        aria-label="Maledækning i %"
        title="Maledækning i %"
      />
      <div className="h-px bg-gray-200 my-2" />
      <label className="block text-sm text-gray-600">
        Kvalitet ({qualityName})
      </label>
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={item.paintQuality}
        onChange={(e) => update("paintQuality", parseInt(e.target.value, 10))}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
        aria-label="Vælg malerkvalitet"
        title="Vælg malerkvalitet"
      />
      <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
        <span>Budget</span>
        <span>Basis</span>
        <span>Standard</span>
        <span>Premium</span>
        <span>Eksklusiv</span>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {(
          [
            { key: "træværk", label: "Træværk" },
            { key: "paneler", label: "Høje paneler" },
            { key: "stuk", label: "Stuk" },
          ] as const
        ).map((ex) => (
          <label key={ex.key} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-500"
              checked={!!item.extras[ex.key]}
              onChange={(e) =>
                update("extras", { ...item.extras, [ex.key]: e.target.checked })
              }
            />
            {ex.label}
          </label>
        ))}
      </div>
      {/* Høje paneler beregnes automatisk med samme kvalitet som maling og fuldt areal */}
    </div>
  );
};

export default PaintingEditor;
