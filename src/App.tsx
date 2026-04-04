import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus } from "lucide-react";
import "./App.css";

function App() {
  const [amount, setAmount] = useState<string>("100");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when window appears
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <main className="flex-1 flex flex-col w-full h-full bg-base-900/60 backdrop-blur-2xl rounded-xl border border-border shadow-2xl overflow-hidden p-4 gap-4">
      
      {/* Box 1: Currency Converter */}
      <div className="flex items-center gap-4 bg-base-800/80 p-3 rounded-2xl border border-border shadow-inner">
        
        {/* Left Section: Toggle + Input */}
        <div className="flex items-center bg-base-900/80 rounded-xl p-2.5 flex-shrink-0 w-1/3 min-w-[140px] shadow-sm border border-base-700">
          <button className="flex items-center gap-1 text-gray-400 hover:text-white font-medium pr-3 border-r border-base-700 transition-colors cursor-pointer">
            <span>MYR</span>
            <ChevronDown size={14} />
          </button>
          <input
            ref={inputRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-right text-xl font-medium text-white outline-none ml-3 placeholder:text-gray-600 w-full"
            autoFocus
          />
        </div>

        {/* Right Section: Target Currencies */}
        <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="bg-base-700/60 hover:bg-base-600/50 transition-colors px-4 py-2 rounded-xl flex items-baseline gap-2 border border-base-600/30 cursor-default">
            <span className="text-gray-400 text-xs font-semibold tracking-wider">USD</span>
            <span className="text-white font-medium text-lg">21.50</span>
          </div>
          <div className="bg-base-700/60 hover:bg-base-600/50 transition-colors px-4 py-2 rounded-xl flex items-baseline gap-2 border border-base-600/30 cursor-default">
            <span className="text-gray-400 text-xs font-semibold tracking-wider">INR</span>
            <span className="text-white font-medium text-lg">1,780.40</span>
          </div>
        </div>

        {/* Extreme Right: + Button */}
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-base-700 hover:bg-base-600 text-gray-300 hover:text-white transition-all flex-shrink-0 border border-base-600/50 shadow-sm cursor-pointer active:scale-95">
          <Plus size={18} />
        </button>
      </div>

    </main>
  );
}

export default App;
