import { useNavigate } from "react-router-dom";

export default function House() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">
        {" "}
        Hvad vil du have lavet?
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
        <button
          onClick={() => navigate("/house/renovation")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-4 rounded-lg shadow-lg text-lg sm:text-xl"
        >
          Renovering
        </button>
        <button
          onClick={() => navigate("/house/addition")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-4 rounded-lg shadow-lg text-lg sm:text-xl"
        >
          Bygge til
        </button>
        <button
          onClick={() => navigate("/house/new")}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-4 rounded-lg shadow-lg text-lg sm:text-xl"
        >
          Nybyggeri
        </button>
      </div>
    </div>
  );
}
