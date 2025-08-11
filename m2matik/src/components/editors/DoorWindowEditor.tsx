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
          min={1}
          value={item.count}
          onChange={(e) => update("count", Math.max(1, Number(e.target.value)))}
          className="w-16 px-1 py-0.5 border rounded text-sm"
          title="Antal døre eller vinduer"
        />
      </label>
    </div>
  );
};

export default DoorWindowEditor;
