import React from "react";
import type { ItemGulv } from "../../pages/renovationTypes";

interface Props {
  item: ItemGulv;
  update: (key: string, val: unknown) => void;
}
export const FloorEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="block text-sm text-gray-600">Kvalitet ({item.floorQuality === 0 ? "IKEA" : item.floorQuality === 1 ? "Hack" : "Snedker"})</label>
    <input
      type="range"
      min={0}
      max={2}
      step={1}
      value={item.floorQuality}
      onChange={(e) =>
        update("floorQuality", parseInt(e.target.value, 10) as 0 | 1 | 2)
      }
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
      title="Vælg gulvkvalitet"
    />
    <div className="relative h-4 mt-1 text-[11px] text-gray-500 select-none">
      <span className="absolute left-0">IKEA</span>
      <span className="absolute left-1/2 -translate-x-1/2">Hack</span>
      <span className="absolute right-0">Snedker</span>
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
export default FloorEditor;
