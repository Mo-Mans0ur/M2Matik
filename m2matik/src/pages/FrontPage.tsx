// m2matik/src/pages/FrontPage.tsx
import logoSrc from "../assets/pictures/m2matik-logo.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadProjectMeta, saveProjectMeta } from "../lib/storage";
import type { PropertyType, ProjectMeta } from "../lib/storage";
// ...existing code...

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

/**
 * FrontPage component: collects basic property info, pre-fills from storage,
 * and starts the calculation flow by saving metadata and navigating onward.
 */
export default function FrontPage() {
  // constants
  const navigate = useNavigate();

  const [propertyType, setPropertyType] = useState<PropertyType>("house");
  const [sizeM2, setSizeM2] = useState<number>(0);
  const [basement, setBasement] = useState<boolean>(false);
  const [firstFloor, setFirstFloor] = useState<boolean>(false);
  const [postcode, setPostcode] = useState<string>("");

  /**
   * On mount: load any previously saved project metadata and prefill form state.
   */
  useEffect(() => {
    const prev = loadProjectMeta();
    if (prev) {
      setPropertyType(prev.propertyType);
      setSizeM2(prev.sizeM2);
      setBasement(prev.basement);
      setFirstFloor(prev.firstFloor);
      setPostcode(prev.postcode || "");
    }
  }, []);

  const canContinue = sizeM2 > 0;

  /**
   * Save current form data to storage and navigate to ground type selection.
   */
  const onStart = () => {
    const payload: ProjectMeta = {
      propertyType,
      sizeM2,
      basement,
      firstFloor,
      postcode,
      createdAt: new Date().toISOString(),
    };
    saveProjectMeta(payload);
    // Go to the choice screen (GroundType) instead of directly to Renovation
    navigate("/groundtype");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4 py-6">
  <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-5 sm:p-6 space-y-6">
        <div className="flex flex-col items-center mb-2">
          <img src={logoSrc} alt="m2matik logo" className="mb-4 w-40 mx-auto" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Start beregning
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm text-gray-600">
              Ejendomstype
            </span>
            <Select
              value={propertyType}
              onValueChange={(v) => setPropertyType(v as PropertyType)}
            >
              <SelectTrigger className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base font-semibold text-slate-800 bg-white">
                <SelectValue placeholder="Vælg ejendomstype" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-lg shadow-lg border border-gray-200 mt-1">
                <SelectItem
                  value="house"
                  className="flex items-center px-4 py-2 cursor-pointer text-base rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                >
                  <span className="font-medium text-slate-800">Hus</span>
                </SelectItem>
                <SelectItem
                  value="apartment"
                  className="flex items-center px-4 py-2 cursor-pointer text-base rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                >
                  <span className="font-medium text-slate-800">Lejlighed</span>
                </SelectItem>
                <SelectItem
                  value="summerhouse"
                  className="flex items-center px-4 py-2 cursor-pointer text-base rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                >
                  <span className="font-medium text-slate-800">Sommerhus</span>
                </SelectItem>
              </SelectContent>
            </Select>
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

          <label className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm text-gray-600">Postnummer</span>
            <div className="flex flex-row items-center gap-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className="border rounded-lg px-3 py-2 tracking-widest flex-1"
                value={postcode}
                onChange={(e) =>
                  setPostcode(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="0000"
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm min-w-[80px]">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-blue-600"
                    checked={basement}
                    onChange={(e) => setBasement(e.target.checked)}
                  />
                  <span className="leading-5">Kælder</span>
                </label>
                <label className="flex items-center gap-2 text-sm min-w-[80px]">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-blue-600"
                    checked={firstFloor}
                    onChange={(e) => setFirstFloor(e.target.checked)}
                  />
                  <span className="leading-5">1. sal</span>
                </label>
              </div>
            </div>
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
            Videre
          </button>
        </div>
      </div>
    </div>
  );
}
