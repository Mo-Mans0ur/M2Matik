import React from "react";
import type { ItemGulv } from "../../pages/renovationTypes";

interface Props {
  item: ItemGulv;
  update: (key: string, val: unknown) => void;
}
export const FloorEditor: React.FC<Props> = ({ item, update }) => {
  const q = Math.max(0, Math.min(4, item.floorQuality));
  const qualityName = [
    "Budget",
    "Standard",
    "Standard",
    "Standard",
    "Eksklusiv",
  ][q];
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
        <span className="mx-auto">Standard</span>
        <span>Eksklusiv</span>
      </div>
      <div className="text-[11px] text-gray-600/90 mt-1 space-y-0.5">
        <p>
          <strong>Budget:</strong> Slibning og lakering af eksisterende gulve.
        </p>
        <p>
          <strong>Eksklusiv:</strong> Optagning af de gamle gulve, evt.
          opretning og lægning af et dyrere gulv som fx et sildebensparket.
        </p>
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
      {item.hasFloorHeating && (
        <div
          role="note"
          className="mt-2 text-[12px] sm:text-[13px] bg-amber-50 border border-amber-200 text-amber-800 rounded px-3 py-2"
        >
          vær opmærksom på at etablering af gulvvarme kræver udskiftning af
          gulve.
        </div>
      )}
    </div>
  );
};
export default FloorEditor;
