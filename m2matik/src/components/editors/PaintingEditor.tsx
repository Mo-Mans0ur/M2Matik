import React from "react";
import type { ItemMaling } from "../../pages/renovationTypes";

interface Props {
  item: ItemMaling;
  update: (key: string, val: unknown) => void;
}

export const PaintingEditor: React.FC<Props> = ({ item, update }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-600">Kvalitet</label>
      <input
        type="range"
        min={0}
        max={1}
        step={1}
        value={item.paintQuality}
        onChange={(e) =>
          update("paintQuality", parseInt(e.target.value, 10) as 0 | 1)
        }
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
        aria-label="Vælg malerkvalitet"
      />
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
    </div>
  );
};

export default PaintingEditor;
