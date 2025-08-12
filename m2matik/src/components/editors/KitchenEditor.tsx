import React from "react";
import type { ItemKitchen } from "../../pages/renovationTypes";

interface Props {
  item: ItemKitchen;
  update: (key: string, val: unknown) => void;
}
export const KitchenEditor: React.FC<Props> = ({ item, update }) => (
  <fieldset className="space-y-3">
    <legend className="text-sm text-gray-600 font-medium">Placering</legend>
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm">
      {(
        [
          { key: "same", label: "Samme placering" },
          { key: "new", label: "Ny placering (+20.000 kr.)" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`kitchen_${item.uid}`}
            value={opt.key}
            checked={item.placement === opt.key}
            onChange={() => update("placement", opt.key)}
            className="w-4 h-4 accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
  </fieldset>
);
export default KitchenEditor;
