import { useNavigate } from "react-router-dom";

export default function House() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8"> Hvad vil du have lavet?</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate("/house/renovation")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl"
        >
          Renovering
        </button>
        <button
          onClick={() => navigate("/house/addition")} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl"
        >
          Bygge til
        </button>
        <button
          onClick={() => navigate("/house/new")} className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg text-xl"
        >
          Nybyggeri
        </button>
      </div>
    </div>
  );

}
