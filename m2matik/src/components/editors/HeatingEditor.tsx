import React from "react";
import type { ItemHeating } from "../../pages/renovationTypes";

interface Props {
  item: ItemHeating;
  update: (key: string, val: unknown) => void;
}
export const HeatingEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    {(
      [
        { key: "fjernvarme", label: "Fjernvarme" },
        { key: "radiator", label: "Radiator" },
      ] as const
    ).map((opt) => (
      <label key={opt.key} className="inline-flex items-center gap-2 text-s">
        <input
          type="radio"
          name={`heating_${item.uid}`}
          value={opt.key}
          checked={item.system === opt.key}
          onChange={() => update("system", opt.key)}
          className="mr-1"
        />
        {opt.label}
      </label>
    ))}
  </div>
);
export default HeatingEditor;
