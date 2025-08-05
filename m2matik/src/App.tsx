import React from "react";

export default function App() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">M²matik</h1>
        <p className="text-gray-600 mb-6">
          Få et hurtigt prisoverslag på dit byggeprojekt
        </p>
        <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
          Start beregning
        </button>
      </div>
    </div>
  );
}
