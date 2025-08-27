import React from "react";
import type { ItemWalls } from "../../pages/renovationTypes";

interface Props {
  item: ItemWalls;
  update: (key: string, val: unknown) => void;
}
export const WallsEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-3 text-sm">
    <div className="font-medium">Indvendige vægge</div>
    <div>
      <label className="block text-gray-600 mb-1">Omfang</label>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={item.scope ?? 1}
        onChange={(e) => update("scope", parseInt(e.target.value, 10) as 0 | 1 | 2)}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
        aria-label="Omfang af indvendige vægge"
      />
      <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
        <span>Mindre</span>
        <span className="mx-auto">Standard</span>
        <span>Meget</span>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={!!item.nyLet}
          onChange={(e) => update("nyLet", e.target.checked)}
        />
        Ny let skillevæg
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={!!item.nyBærende}
          onChange={(e) => update("nyBærende", e.target.checked)}
        />
        Ny bærende væg
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={!!item.doorInWall}
          onChange={(e) => update("doorInWall", e.target.checked)}
        />
        Dør i væg
      </label>
    </div>
  </div>
);
export default WallsEditor;
