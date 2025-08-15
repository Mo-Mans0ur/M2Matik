import React from "react";
import type { ItemRoof } from "../../pages/renovationTypes";

interface Props {
  item: ItemRoof;
  update: (key: string, val: unknown) => void;
}

export const RoofEditor: React.FC<Props> = ({ item, update }) => {
  const pitch = Math.max(0, Math.min(45, item.roofPitch || 0));
  const q = (item.roofQuality ?? 2) as number;
  const extras = item.extras || {};

  const updateExtra = (k: keyof ItemRoof["extras"], v: boolean | number) => {
    const next = { ...(extras as any) };
    (next as any)[k] = v as any;
    update("extras", next);
  };

  return (
    <div className="space-y-4">
      {/* Hældning */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Hældning: {pitch}°</label>
        <input
          type="range"
          min={0}
          max={45}
          step={1}
          value={pitch}
          onChange={(e) =>
            update(
              "roofPitch",
              Math.min(45, Math.max(0, Number(e.target.value)))
            )
          }
          className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
          aria-label="Hældning (grader)"
          title="Hældning (grader)"
        />
        <div className="relative h-4 mt-1 text-[11px] text-gray-500 select-none">
          <span className="absolute left-0">Fladt</span>
          <span className="absolute right-0">45°</span>
        </div>
      </div>

      {/* Kvalitet */}
      <div className="space-y-2">
        {(() => {
          const name = ["Budget", "Basis", "Standard", "Premium", "Eksklusiv"][Math.max(0, Math.min(4, q))];
          return <label className="text-xs font-medium">Kvalitet ({name})</label>;
        })()}
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={q}
          onChange={(e) => update("roofQuality", parseInt(e.target.value, 10))}
          className="w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer"
          aria-label="Kvalitet"
          title="Kvalitet"
        />
        <div className="mt-1 hidden sm:flex text-[11px] text-gray-500 select-none justify-between px-0.5">
          <span>Budget</span>
          <span>Basis</span>
          <span>Standard</span>
          <span>Premium</span>
          <span>Eksklusiv</span>
        </div>
      </div>

      {/* Tilvalg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!extras.saddeltag}
            onChange={(e) => updateExtra("saddeltag", e.target.checked)}
          />
          Saddeltag
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!extras.valm}
            onChange={(e) => updateExtra("valm", e.target.checked)}
          />
          Valm
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!extras.undertag}
            onChange={(e) => updateExtra("undertag", e.target.checked)}
          />
          Fast undertag
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!extras.efterisolering}
            onChange={(e) => updateExtra("efterisolering", e.target.checked)}
          />
          Efterisolering
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium flex items-center gap-2">
          Antal kviste
          <input
            aria-label="Antal kviste"
            type="number"
            min={0}
            value={extras.kviste ?? 0}
            onChange={(e) =>
              updateExtra("kviste", Math.max(0, Number(e.target.value)))
            }
            className="border rounded px-3 py-2 w-28 text-sm"
          />
        </label>
      </div>
    </div>
  );
};

export default RoofEditor;
