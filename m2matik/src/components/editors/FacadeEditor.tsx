import React from "react";
import type { ItemFacade } from "../../pages/renovationTypes";

interface Props {
  item: ItemFacade;
  update: (key: string, val: unknown) => void;
}
export const FacadeEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="text-xs font-medium">Overflade:</label>
    <select
      aria-label="Vælg overflade"
      value={item.finish}
      onChange={(e) => update("finish", e.target.value as ItemFacade["finish"])}
      className="border rounded p-2 text-sm w-full"
    >
      <option value="male">Male</option>
      <option value="pudse">Puds</option>
      <option value="træ">Træbeklædning</option>
    </select>
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={item.afterIso}
        onChange={(e) => update("afterIso", e.target.checked)}
        className="w-4 h-4 accent-blue-500"
      />
      Efterisolering
    </label>
  </div>
);
export default FacadeEditor;
