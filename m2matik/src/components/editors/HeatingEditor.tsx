import React from "react";
import type { ItemHeating } from "../../pages/renovationTypes";

interface Props {
  item: ItemHeating;
  update: (key: string, val: unknown) => void;
}
export const HeatingEditor: React.FC<Props> = ({ item, update }) => (
  <fieldset className="space-y-3">
    <legend className="text-sm text-gray-600 font-medium">Varmeanlæg</legend>
    <div className="flex flex-wrap gap-6 text-sm">
      {(
        [
          { key: "fjernvarme", label: "Fjernvarme" },
          { key: "radiator", label: "Radiator" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`heating_${item.uid}`}
            value={opt.key}
            checked={item.system === opt.key}
            onChange={() => update("system", opt.key)}
            className="w-4 h-4 accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
  </fieldset>
);
export default HeatingEditor;
