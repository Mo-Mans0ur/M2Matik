import React from "react";
import type { ItemGulv } from "../../pages/renovationTypes";

interface Props {
  item: ItemGulv;
  update: (key: string, val: unknown) => void;
}
export const FloorEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="block text-sm text-gray-600">Kvalitet</label>
    <input
      type="range"
      min={0}
      max={1}
      step={1}
      value={item.floorQuality}
      onChange={(e) =>
        update("floorQuality", parseInt(e.target.value, 10) as 0 | 1)
      }
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
      title="Vælg gulvkvalitet"
    />
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
