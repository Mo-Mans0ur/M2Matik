import React from "react";
import type { ItemTerrasse } from "../../pages/renovationTypes";

interface Props {
  item: ItemTerrasse;
  update: (key: string, val: unknown) => void;
}
export const TerraceEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-4">
    <div>
      <label
        htmlFor={`terrace_area_${item.uid}`}
        className="text-sm text-gray-600 flex items-center gap-2"
      >
        Størrelse (m²)
        <input
          id={`terrace_area_${item.uid}`}
          type="number"
          min={0}
          value={item.area}
          onChange={(e) => update("area", Math.max(0, Number(e.target.value)))}
          className="w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="0"
        />
      </label>
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
