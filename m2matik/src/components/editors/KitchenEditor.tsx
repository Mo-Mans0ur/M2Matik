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
          { key: "new", label: "Ny placering" },
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
    <div className="h-px bg-gray-200 my-2" />
    <div className="space-y-1">
      {(() => {
        const q = Math.max(0, Math.min(4, item.quality ?? 2));
        const name = [
          "Budget",
          "Standard",
          "Standard",
          "Standard",
          "Eksklusiv",
        ][q];
        return (
          <label className="block text-sm text-gray-600">
            Kvalitet ({name})
          </label>
        );
      })()}
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={item.quality ?? 2}
        onChange={(e) => update("quality", parseInt(e.target.value, 10))}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
        aria-label="Køkkenkvalitet"
        title="Køkkenkvalitet"
      />
      <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
        <span>Budget</span>
        <span className="mx-auto">Standard</span>
        <span>Eksklusiv</span>
      </div>
    </div>
  </fieldset>
);
export default KitchenEditor;
