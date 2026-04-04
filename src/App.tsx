import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Moon, Sun } from "lucide-react";
import "./App.css";

function App() {
  const [amount, setAmount] = useState<string>("100");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when window appears
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update HTML class for toggling dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <main className="flex-1 flex flex-col w-full h-full bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-4 gap-4 transition-colors duration-200">
      
      {/* Top Header Row: Theme Toggle */}
      <div className="flex justify-end w-full">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Box 1: Currency Converter */}
      <div className="flex items-center gap-4 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
        
        {/* Left Section: Toggle + Input */}
        <div className="flex items-center bg-gray-100/80 dark:bg-neutral-900/80 rounded-xl p-2.5 flex-shrink-0 w-1/3 min-w-[140px] border border-gray-200 dark:border-neutral-800 transition-colors duration-200">
          <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium pr-3 border-r border-gray-300 dark:border-neutral-700 transition-colors cursor-pointer outline-none">
            <span>MYR</span>
            <ChevronDown size={14} />
          </button>
          <input
            ref={inputRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-right text-xl font-medium text-black dark:text-white outline-none ml-3 placeholder:text-gray-400 w-full"
            autoFocus
          />
        </div>

        {/* Right Section: Target Currencies */}
        <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 px-4 py-2 rounded-xl flex items-baseline gap-2 border border-gray-200 dark:border-neutral-800 cursor-default">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold tracking-wider">USD</span>
            <span className="text-black dark:text-white font-medium text-lg">21.50</span>
          </div>
          <div className="bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 px-4 py-2 rounded-xl flex items-baseline gap-2 border border-gray-200 dark:border-neutral-800 cursor-default">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold tracking-wider">INR</span>
            <span className="text-black dark:text-white font-medium text-lg">1,780.40</span>
          </div>
        </div>

        {/* Extreme Right: + Button */}
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all duration-200 flex-shrink-0 border border-gray-200 dark:border-neutral-700 shadow-sm cursor-pointer active:scale-95">
          <Plus size={18} />
        </button>
      </div>

    </main>
  );
}

export default App;
