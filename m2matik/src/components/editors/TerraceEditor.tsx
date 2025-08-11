import React from "react";
import type { ItemTerrasse } from "../../pages/renovationTypes";

interface Props {
  item: ItemTerrasse;
  update: (key: string, val: unknown) => void;
}
export const TerraceEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="text-sm">
      Størrelse (m²):
      <input
        type="number"
        min={0}
        value={item.area}
        onChange={(e) => update("area", Math.max(0, Number(e.target.value)))}
        className="ml-2 w-20 p-1 border rounded"
        placeholder="m²"
      />
    </label>
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
          checked={!!item.extra[ex.key]}
          onChange={(e) =>
            update("extra", { ...item.extra, [ex.key]: e.target.checked })
          }
        />
        {ex.label}
      </label>
    ))}
  </div>
);
export default TerraceEditor;
