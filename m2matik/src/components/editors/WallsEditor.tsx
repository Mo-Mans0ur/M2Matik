import React from "react";
import type { ItemWalls } from "../../pages/renovationTypes";

interface Props {
  item: ItemWalls;
  update: (key: string, val: unknown) => void;
}
export const WallsEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-3 text-sm">
    <div className="font-medium">Nye vægge</div>
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
    </div>
  </div>
);
export default WallsEditor;
