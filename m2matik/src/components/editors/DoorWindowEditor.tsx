import type { ItemDøreVinduer } from "../../pages/renovationTypes";
import React from "react";

interface Props {
  item: ItemDøreVinduer;
  update: (key: string, val: unknown) => void;
}

export const DoorWindowEditor: React.FC<Props> = ({ item, update }) => {
  return (
    <div className="space-y-2">
      {/* Linje 1: Dør / Vindue (eksisterende åbningstype) */}
      <div className="flex gap-4 flex-wrap">
        {(["door", "window"] as const).map((val) => (
          <label key={val} className="inline-flex items-center text-sm gap-1">
            <input
              type="radio"
              name={`dw_choice_${item.uid}`}
              value={val}
              checked={item.choice === val}
              onChange={() => update("choice", val)}
            />
            {val === "door" ? "Dør" : "Vindue"}
          </label>
        ))}
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
      {/* Linje 3: Ny dør / Nyt vindue */}
      <div className="flex gap-4 flex-wrap pt-1">
        {(["door", "window"] as const).map((val) => (
          <label key={val} className="inline-flex items-center text-sm gap-1">
            <input
              type="radio"
              name={`dw_newInstall_${item.uid}`}
              value={val}
              checked={item.newInstall === val}
              onChange={() => update("newInstall", val)}
            />
            {val === "door" ? "Ny dør" : "Nyt vindue"}
          </label>
        ))}
      </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
        <div>
          <label className="block text-xs text-gray-600">
            Kvalitet (
            {(item.quality ?? 1) === 0
              ? "IKEA"
              : (item.quality ?? 1) === 1
              ? "Hack"
              : "Snedker"}
            )
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={item.quality ?? 1}
            onChange={(e) =>
              update("quality", parseInt(e.target.value, 10) as 0 | 1 | 2)
            }
            className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
            aria-label="Kvalitet"
            title="Kvalitet"
          />
          <div className="relative h-4 mt-1 text-[11px] text-gray-500 select-none">
            <span className="absolute left-0">IKEA</span>
            <span className="absolute left-1/2 -translate-x-1/2">Hack</span>
            <span className="absolute right-0">Snedker</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600">
            Størrelse (cm): {item.sizeScale ?? 0} cm
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={item.sizeScale ?? 0}
            onChange={(e) => update("sizeScale", parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
            aria-label="Størrelse (cm)"
            title="Størrelse (cm)"
          />
          <div className="relative h-4 mt-1 text-[11px] text-gray-500 select-none">
            <span className="absolute left-0">0 cm</span>
            <span className="absolute left-1/2 -translate-x-1/2">50 cm</span>
            <span className="absolute right-0">100 cm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoorWindowEditor;
