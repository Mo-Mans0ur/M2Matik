import React from "react";
import type { ItemRoof } from "../../pages/renovationTypes";

interface Props {
  item: ItemRoof;
  update: (key: string, val: unknown) => void;
}
export const RoofEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-xs font-medium">Tagtype</label>
      <select
        aria-label="Vælg tagtype"
        value={item.roofType}
        onChange={(e) =>
          update("roofType", e.target.value as ItemRoof["roofType"])
        }
        className="border rounded px-3 py-2 text-sm w-full"
      >
        <option value="">Vælg tagtype</option>
        <option value="fladt">Fladt tag</option>
        <option value="saddel">Saddeltag</option>
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-xs font-medium">Hældning (grader)</label>
      <input
        type="number"
        min={0}
        max={60}
        step={1}
        value={item.roofPitch}
        onChange={(e) =>
          update("roofPitch", Math.min(60, Math.max(0, Number(e.target.value))))
        }
        className="border rounded px-3 py-2 w-28 text-sm"
        placeholder="0"
      />
    </div>
    <div className="space-y-2">
      <label className="text-xs font-medium">Belægning</label>
      <select
        aria-label="Vælg belægning"
        value={item.roofMaterial}
        onChange={(e) =>
          update("roofMaterial", e.target.value as ItemRoof["roofMaterial"])
        }
        className="border rounded px-3 py-2 text-sm w-full"
      >
        <option value="">Vælg belægning</option>
        <option value="tagpap">Tagpap</option>
        <option value="betontegl">Betontegl</option>
        <option value="alm-tegl">Alm. tegl</option>
      </select>
    </div>
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={item.afterInsulation}
        onChange={(e) => update("afterInsulation", e.target.checked)}
        className="w-4 h-4 accent-blue-500"
      />
      Efterisolering
    </label>
    <div className="space-y-2">
      <label className="text-xs font-medium">Antal kviste</label>
      <input
        aria-label="Antal kviste"
        type="number"
        min={0}
        value={item.dormerCount}
        onChange={(e) =>
          update("dormerCount", Math.max(0, Number(e.target.value)))
        }
        className="border rounded px-3 py-2 w-28 text-sm"
      />
    </div>
  </div>
);
export default RoofEditor;
