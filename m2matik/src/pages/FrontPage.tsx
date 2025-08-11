// m2matik/src/pages/FrontPage.tsx

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadProjectMeta, saveProjectMeta } from "../lib/storage";
import type { PropertyType, ProjectMeta } from "../lib/storage";

export default function FrontPage() {
  // constants
  const navigate = useNavigate();

  const [propertyType, setPropertyType] = useState<PropertyType>("house");
  const [sizeM2, setSizeM2] = useState<number>(0);
  const [basement, setBasement] = useState<boolean>(false);
  const [firstFloor, setFirstFloor] = useState<boolean>(false);

  // prefill hvis der findes data i localStorage
  useEffect(() => {
    const prev = loadProjectMeta();
    if (prev) {
      setPropertyType(prev.propertyType);
      setSizeM2(prev.sizeM2);
      setBasement(prev.basement);
      setFirstFloor(prev.firstFloor);
    }
  }, []);

  const canContinue = sizeM2 > 0;

  const onStart = () => {
    const payload: ProjectMeta = {
      propertyType,
      sizeM2,
      basement,
      firstFloor,
      createdAt: new Date().toISOString(),
    };
    saveProjectMeta(payload);
    navigate(`/${propertyType}/renovation`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4 py-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-5 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Start beregning
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm text-gray-600">
              Ejendomstype
            </span>
            <select
              className="border rounded-lg px-3 py-2"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            >
              <option value="house">Hus</option>
              <option value="apartment">Lejlighed</option>
              <option value="summerhouse">Sommerhus</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm text-gray-600">
              Størrelse (m²)
            </span>
            <input
              type="number"
              min={1}
              className="border rounded-lg px-3 py-2"
              value={sizeM2}
              onChange={(e) => setSizeM2(Number(e.target.value))}
              placeholder="fx 120"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-5 h-5 accent-blue-600"
              checked={basement}
              onChange={(e) => setBasement(e.target.checked)}
            />
            Kælder
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-5 h-5 accent-blue-600"
              checked={firstFloor}
              onChange={(e) => setFirstFloor(e.target.checked)}
            />
            1. sal
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onStart}
            disabled={!canContinue}
            className={`px-5 py-2 rounded-lg text-white shadow text-sm sm:text-base
              ${
                canContinue
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            Fortsæt til
          </button>
        </div>
      </div>
    </div>
  );
}
