import React from "react";
import type { ItemBad } from "../../pages/renovationTypes";

interface Props {
  item: ItemBad;
  update: (key: string, val: unknown) => void;
}
export const BathEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <div className="flex gap-4 text-sm">
      {(
        [
          { key: "same", label: "Samme placering" },
          { key: "new", label: "Ny placering (+2.500)" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`bathPlacement_${item.uid}`}
            value={opt.key}
            checked={item.bathPlacement === opt.key}
            onChange={() => update("bathPlacement", opt.key)}
            className="w-4 h-4 accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
  </div>
);
export default BathEditor;
