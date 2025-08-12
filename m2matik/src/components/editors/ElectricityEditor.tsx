import React from "react";
import type { ItemEl } from "../../pages/renovationTypes";
import InfoTooltip from "../InfoTooltip";

interface Props {
  item: ItemEl;
  update: (key: string, val: unknown) => void;
}
export const ElectricityEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <label className="block text-sm text-gray-600 flex items-center gap-2">
      <span>Antal afbrydere + udtag: {item.outletCount}</span>
      <InfoTooltip text="Et udtag er et tilslutningspunkt i væg/loft til fx lampe eller stikkontakt." />
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
    <label className="block text-sm text-gray-600">Antal stik: {(item as any).stikCount ?? 0}</label>
    <input
      title="Antal stik"
      type="range"
      min={0}
      max={50}
      step={1}
      value={(item as any).stikCount ?? 0}
      onChange={(e) => update("stikCount", parseInt(e.target.value, 10))}
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
          checked={!!item.evCharger}
          onChange={(e) => update("evCharger", e.target.checked)}
        />
        Bil lader
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
