import { useState } from "react";


export default function Renovation() {
  const [price, setPrice] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedMain, setSelectedMain] = useState<{ [key: string]: boolean }>({}); // track checkboxes
    const [selectedSubs, setSelectedSubs] = useState<{ [parentId: string]: { [subId: string]: boolean } }>({}); // track sub-options

  const options = [
    { id: "maling", label: "Maling", price: 10000 },
    { id: "gulv", label: "Gulv", price: 15000 },
    { id: "bad", label: "Bad", price: 20000 },
  ];

  const advancedOptions = [
    {id: "vægge", label: "Maling af vægge", price: 12000, subOptions:[{id: "overfladisk", label: "Overfladisk", price: 5000}, {id: "fuld", label: "Fuld", price: 10000}

    ]
},
    {id: "trægulv", label: "Gulvbelægning", price: 18000,},
    {id: "badeværelse", label: "Badeværelse renovering", price: 25000,}
  ];

    const handleToggle = (checked: boolean, opt: { id: string; label: string; price: number }) => {
        setSelectedMain((prev) => ({ ...prev, [opt.id]: checked }));
        setPrice((prev) => (checked ? prev + opt.price : prev - opt.price));
    };



  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">Renovering - Tilvalg</h1>
      
      {/* Hurtig metode */}
      <div className="w-full max-w-md space-y-4">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center justify-between bg-white shadow-md rounded-lg p-4 cursor-pointer"
          >
            <span className="text-lg">{opt.label}</span>
            <input
              type="checkbox"
              onChange={(e) => handleToggle(e.target.checked, opt)}
              className="w-5 h-5"
            />
          </label>
        ))}
      </div>
        {/* Avanceret metode */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          {showAdvanced ? "Skjul avancerede tilvalg" : "Vis avancerede tilvalg"}
        </button>


        {showAdvanced && (
          <div className="w-full max-w-md space-y-4 mb-6">
            {advancedOptions.map((opt) => (
              <div key={opt.id} className="bg-white shadow-md rounded-lg p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-lg">{opt.label}</span>
                  <input
                    type="checkbox"
                    onChange={(e) => handleToggle(e.target.checked, opt)}
                    className="w-5 h-5"
                  />
                </label>
                {/* Sub-options */}
                {opt.subOptions && selectedMain[opt.id] && (
                  <div className="ml-6 mt-2 space-y-2">
                    <input 
                        type="range"
                        min="0"
                        max="1"
                        step="1"
                        title="Vælg mellem overfladisk og fuld"
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            const selected = opt.subOptions[value];
                            // Update price based on selected sub-option
                            setPrice((prev) => {
                                // Find the previously selected sub-option id for this parent
                                const prevSelectedId = Object.keys(selectedSubs[opt.id] || {}).find(
                                    (subId) => selectedSubs[opt.id][subId]
                                );
                                const prevPrice =
                                    prevSelectedId && opt.subOptions
                                        ? opt.subOptions.find((s) => s.id === prevSelectedId)?.price || 0
                                        : 0;
                                return prev - prevPrice + selected.price;
                            });
                            setSelectedSubs((prev) => ({
                                ...prev,
                                [opt.id]: {
                                    [selected.id]: true,
                                },
                            }));
                        }}
                        className="w-full"
                    />
                    <div className="flex justify-between text-sm mt-1">
                        <span>Overfladisk</span>
                        <span>Fuld</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {/*Prisvisning*/}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-600 text-xl p-4 text-center shadow-lg">
        Total pris: {price.toLocaleString("da-DK")} kr.
      </div>
    </div>
  );
}
