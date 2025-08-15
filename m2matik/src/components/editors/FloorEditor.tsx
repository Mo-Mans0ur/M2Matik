import React from "react";
import type { ItemGulv } from "../../pages/renovationTypes";

interface Props {
  item: ItemGulv;
  update: (key: string, val: unknown) => void;
}
export const FloorEditor: React.FC<Props> = ({ item, update }) => {
  const q = Math.max(0, Math.min(4, item.floorQuality));
  const qualityName = ["Budget", "Basis", "Standard", "Premium", "Eksklusiv"][
    q
  ];
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-600">
        Kvalitet ({qualityName})
      </label>
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={item.floorQuality}
        onChange={(e) => update("floorQuality", parseInt(e.target.value, 10))}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
        title="Vælg gulvkvalitet"
      />
      <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
        <span>Budget</span>
        <span>Basis</span>
        <span>Standard</span>
        <span>Premium</span>
        <span>Eksklusiv</span>
      </div>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-500"
          checked={item.hasFloorHeating}
          onChange={(e) => update("hasFloorHeating", e.target.checked)}
        />
        Gulvvarme
      </label>
    </div>
  );
};
export default FloorEditor;
