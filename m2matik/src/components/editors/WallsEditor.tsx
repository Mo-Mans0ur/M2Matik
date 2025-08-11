import React from "react";
import type { ItemWalls } from "../../pages/renovationTypes";

interface Props {
  item: ItemWalls;
  update: (key: string, val: unknown) => void;
}
export const WallsEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <div className="text-s font-medium">Nedrivning:</div>
    <div className="flex flex-col gap-1 text-s">
      {(
        [
          { key: "let", label: "Let skillevæg" },
          { key: "bærende", label: "Bærende væg" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`wallDemoType_${item.uid}`}
            value={opt.key}
            checked={item.demo === opt.key}
            onChange={() => update("demo", opt.key)}
            className="accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
    <label className="inline-flex items-center gap-2 text-s">
      <input
        type="checkbox"
        checked={item.newWall}
        onChange={(e) => update("newWall", e.target.checked)}
        className="accent-blue-500"
      />
      Nye vægge
    </label>
  </div>
);
export default WallsEditor;
