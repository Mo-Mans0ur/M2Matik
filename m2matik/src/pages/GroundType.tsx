import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function HouseOutline({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M12 50 L50 18 L88 50 V88 H12 Z" />
      <rect x="38" y="60" width="24" height="28" rx="2" />
    </svg>
  );
}

function RenovationIcon() {
  return (
    <div className="relative flex items-center justify-center text-gray-900">
      <HouseOutline />
      {/* tools */}
      <svg
        viewBox="0 0 100 100"
        className="absolute w-12 h-12"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
      >
        {/* hammer handle */}
        <path d="M20 75 L45 50" />
        {/* hammer head */}
        <path d="M42 45 L55 32" />
        {/* wrench */}
        <path d="M55 80 L80 55" />
        <path d="M80 55 A6 6 0 0 0 88 47" />
      </svg>
    </div>
  );
}

function AdditionIcon() {
  return (
    <div className="relative flex items-center justify-center text-gray-900">
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        {/* main house */}
        <path d="M36 50 L65 30 L90 50 V88 H36 Z" />
        <rect x="55" y="62" width="18" height="18" rx="2" />
        {/* side addition */}
        <path d="M10 60 L28 48 L36 54 V88 H10 Z" />
        <rect x="16" y="68" width="12" height="10" rx="2" />
      </svg>
    </div>
  );
}

function NewBuildIcon() {
  return (
    <div className="relative flex items-center justify-center text-gray-900">
      <HouseOutline />
      {/* plus */}
      <svg
        viewBox="0 0 24 24"
        className="absolute -top-1 -right-1 w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      >
        <path d="M12 5 v14 M5 12 h14" />
      </svg>
    </div>
  );
}

export default function GroundType() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="w-full max-w-4xl -mt-2 mb-2">
        <BackButton to="/" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">
        Hvad vil du have lavet?
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
        <button
          onClick={() => navigate("/groundtype/renovation")}
          className="group bg-white hover:bg-gray-50 text-gray-900 px-5 py-6 rounded-xl shadow border border-gray-200 text-lg sm:text-xl flex flex-col items-center gap-3"
        >
          <RenovationIcon />
          <span className="font-medium">Renovering</span>
        </button>
        <button
          onClick={() => navigate("/groundtype/addition")}
          className="group bg-white hover:bg-gray-50 text-gray-900 px-5 py-6 rounded-xl shadow border border-gray-200 text-lg sm:text-xl flex flex-col items-center gap-3"
        >
          <AdditionIcon />
          <span className="font-medium">Tilbyggeri</span>
        </button>
        <button
          onClick={() => navigate("/groundtype/newhouse")}
          className="group bg-white hover:bg-gray-50 text-gray-900 px-5 py-6 rounded-xl shadow border border-gray-200 text-lg sm:text-xl flex flex-col items-center gap-3"
        >
          <NewBuildIcon />
          <span className="font-medium">Nybyggeri</span>
        </button>
      </div>
    </div>
  );
}
