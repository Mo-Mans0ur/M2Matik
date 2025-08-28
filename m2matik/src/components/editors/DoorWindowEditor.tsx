import type { ItemDøreVinduer } from "../../pages/renovationTypes";
import React from "react";

interface Props {
  item: ItemDøreVinduer;
  update: (key: string, val: unknown) => void;
}

export const DoorWindowEditor: React.FC<Props> = ({ item, update }) => {
  return (
    <div className="space-y-2">
      <div
        role="note"
        className="text-[12px] sm:text-[13px] bg-blue-50 border border-blue-200 text-blue-800 rounded px-3 py-2"
      >
        Pris er for vindue/dør + montering.
      </div>
      {/* Linje 2: Udskiftning / Nyt hul */}
      <div className="flex gap-4 flex-wrap pt-1 border-t mt-1">
        {(
          [
            { key: "replacement", label: "Udskiftning" },
            { key: "newHole", label: "Nyt hul" },
          ] as const
        ).map((op) => (
          <label
            key={op.key}
            className="inline-flex items-center text-sm gap-1"
          >
            <input
              type="radio"
              name={`dw_operation_${item.uid}`}
              value={op.key}
              checked={item.operation === op.key}
              onChange={() => update("operation", op.key)}
            />
            {op.label}
          </label>
        ))}
      </div>
      {/* Ny dør/nyt vindue valg fjernet */}
      <label className="text-sm font-medium flex items-center gap-2">
        Antal:
        <input
          type="number"
          min={0}
          value={item.count}
          onChange={(e) => update("count", Math.max(0, Number(e.target.value)))}
          className="w-16 px-1 py-0.5 border rounded text-sm"
          title="Antal døre eller vinduer"
        />
      </label>

      {/* Kvalitet og Størrelse sliders */}
      <div className="space-y-3 pt-2 border-t">
        <div>
          {(() => {
            const q = Math.max(0, Math.min(4, item.quality ?? 2));
            const name = [
              "Budget",
              "Standard",
              "Standard",
              "Standard",
              "Eksklusiv",
            ][q];
            return (
              <label className="block text-xs text-gray-600">
                Kvalitet ({name})
              </label>
            );
          })()}
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={item.quality ?? 2}
            onChange={(e) => update("quality", parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
            aria-label="Kvalitet"
            title="Kvalitet"
          />
          <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
            <span>Budget</span>
            <span className="mx-auto">Standard</span>
            <span>Eksklusiv</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Størrelse</label>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={(item.sizeScale ?? 1) > 2 ? 1 : item.sizeScale ?? 1}
            onChange={(e) => update("sizeScale", parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
            aria-label="Størrelse"
            title="Størrelse"
          />
          <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
            <span>Små</span>
            <span className="mx-auto">Medium</span>
            <span>Store</span>
          </div>
        </div>
        {/* 1. sal tillæg styres via Grunddata og anvendes automatisk i beregningen */}
      </div>
    </div>
  );
};

export default DoorWindowEditor;
