import React from "react";
import type { ItemDemolition } from "../../pages/renovationTypes";

interface Props {
  item: ItemDemolition;
  update: (key: string, val: unknown) => void;
}
export const DemolitionEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-3 text-sm">
    <div className="font-medium">Nedrivning</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={!!item.demoLet}
          onChange={(e) => update("demoLet", e.target.checked)}
        />
        Let skillevæg
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={!!item.demoBærende}
          onChange={(e) => update("demoBærende", e.target.checked)}
        />
        Bærende væg
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={!!item.demoIndvendig}
          onChange={(e) => update("demoIndvendig", e.target.checked)}
        />
        Nedrivning af indvendig væg
      </label>
    </div>
  </div>
);
export default DemolitionEditor;
