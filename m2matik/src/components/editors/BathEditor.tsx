import React from "react";
import type { ItemBad } from "../../pages/renovationTypes";

interface Props {
  item: ItemBad;
  update: (key: string, val: unknown) => void;
}
export const BathEditor: React.FC<Props> = ({ item, update }) => (
  <div className="space-y-2">
    <div className="flex gap-4 text-sm">
      {(
        [
          { key: "bad", label: "Bad" },
          { key: "toilet", label: "Toilet" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`bathKind_${item.uid}`}
            value={opt.key}
            checked={item.roomKind === opt.key}
            onChange={() => update("roomKind", opt.key)}
            className="w-4 h-4 accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
    <div className="flex gap-4 text-sm">
      {(
        [
          { key: "same", label: "Samme placering" },
          { key: "new", label: "Ny placering" },
        ] as const
      ).map((opt) => (
        <label key={opt.key} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={`bathPlacement_${item.uid}`}
            value={opt.key}
            checked={item.bathPlacement === opt.key}
            onChange={() => update("bathPlacement", opt.key)}
            className="w-4 h-4 accent-blue-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
    {/* Kvalitet moved up; count removed */}
    <div className="h-px bg-gray-200 my-2" />
    {(() => {
      const q = Math.max(0, Math.min(4, item.bathQuality ?? 2));
      const qName = ["Budget", "Standard", "Standard", "Standard", "Eksklusiv"][
        q
      ];
      return (
        <label className="block text-sm text-gray-600">
          Kvalitet ({qName})
        </label>
      );
    })()}
    <input
      type="range"
      min={0}
      max={4}
      step={1}
      value={item.bathQuality ?? 2}
      onChange={(e) => update("bathQuality", parseInt(e.target.value, 10))}
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
      aria-label="Vælg badkvalitet"
    />
    <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
      <span>Budget</span>
      <span className="mx-auto">Standard</span>
      <span>Eksklusiv</span>
    </div>
    <label className="block text-sm text-gray-600">
      Størrelse: {Math.max(2, Math.min(12, item.sizeM2 ?? 6))} m²
    </label>
    <input
      type="range"
      min={2}
      max={12}
      step={1}
      value={item.sizeM2 ?? 6}
      onChange={(e) => update("sizeM2", parseInt(e.target.value, 10))}
      className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
      aria-label="Størrelse i m2"
    />
    <div className="h-px bg-gray-200 my-2" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-500"
          checked={!!item.addons?.bruseniche}
          onChange={(e) =>
            update("addons", {
              ...(item.addons || {}),
              bruseniche: e.target.checked,
            })
          }
        />
        Bruseniche
      </label>
    </div>
    {/* Quality slider moved above; removed duplicate here */}
  </div>
);
export default BathEditor;
