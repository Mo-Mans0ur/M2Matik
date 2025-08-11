import React from "react";
import type { ItemKitchen } from "../../pages/renovationTypes";

interface Props {
  item: ItemKitchen;
  update: (key: string, val: unknown) => void;
}
export const KitchenEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="text-xs font-medium">Placering:</label>
    {(
      [
        { key: "same", label: "Samme placering" },
        { key: "new", label: "Ny placering (+20.000 kr.)" },
      ] as const
    ).map((opt) => (
      <label key={opt.key} className="inline-flex items-center gap-2 text-xs">
        <input
          type="radio"
          name={`kitchen_${item.uid}`}
          value={opt.key}
          checked={item.placement === opt.key}
          onChange={() => update("placement", opt.key)}
          className="mr-1"
        />
        {opt.label}
      </label>
    ))}
  </div>
);
export default KitchenEditor;
