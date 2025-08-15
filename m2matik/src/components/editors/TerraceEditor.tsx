import React from "react";
import type { ItemTerrasse } from "../../pages/renovationTypes";

interface Props {
  item: ItemTerrasse;
  update: (key: string, val: unknown) => void;
}
export const TerraceEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm text-gray-600">
        Størrelse (m²): <span className="font-medium">{item.area}</span>
      </label>
      <input
        id={`terrace_area_${item.uid}`}
        type="range"
        min={0}
        max={200}
        step={1}
        value={item.area}
        onChange={(e) => update("area", Math.max(0, parseInt(e.target.value, 10)))}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer mt-1"
        title="Vælg terrasse størrelse i m²"
      />
    </div>
    <div className="flex flex-wrap gap-4 text-sm">
      {(
        [
          { key: "hævet", label: "Hævet" },
          { key: "trappe", label: "Trappe" },
          { key: "værn", label: "Værn" },
        ] as const
      ).map((ex) => (
        <label key={ex.key} className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 accent-blue-500"
            checked={!!item.extra[ex.key]}
            onChange={(e) =>
              update("extra", { ...item.extra, [ex.key]: e.target.checked })
            }
          />
          {ex.label}
        </label>
      ))}
    </div>
  </div>
);
export default TerraceEditor;
