import React from "react";
import type { ItemEl } from "../../pages/renovationTypes";

interface Props {
  item: ItemEl;
  update: (key: string, val: unknown) => void;
}
export const ElectricityEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="block text-sm text-gray-600">
      Antal stikkontakter: {item.outletCount}
    </label>
    <input
      title="Antal stikkontakter"
      type="range"
      min={0}
      max={50}
      step={1}
      value={item.outletCount}
      onChange={(e) => update("outletCount", parseInt(e.target.value, 10))}
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-500"
          checked={item.newPanel}
          onChange={(e) => update("newPanel", e.target.checked)}
        />
        Ny tavle
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-500"
          checked={item.hiddenRuns}
          onChange={(e) => update("hiddenRuns", e.target.checked)}
        />
        Skjulte føringer
      </label>
    </div>
  </div>
);
export default ElectricityEditor;
