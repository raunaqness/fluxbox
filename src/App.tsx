import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Moon, Sun } from "lucide-react";
import "./App.css";

function App() {
  const [amount, setAmount] = useState<string>("100");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Currency States
  const [baseCurrency, setBaseCurrency] = useState<string>("MYR");
  const [targetCurrencies, setTargetCurrencies] = useState<string[]>(["USD", "INR"]);
  const [rates, setRates] = useState<Record<string, number>>({});
  
  const [storeLoaded, setStoreLoaded] = useState(false);
  const storeRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Store and Theme
  useEffect(() => {
    const initStore = async () => {
      try {
        const { load } = await import('@tauri-apps/plugin-store');
        const s = await load('config.json');
        storeRef.current = s;
        
        const storedBase = await s.get<string>('base_currency');
        if (storedBase) setBaseCurrency(storedBase);
        
        const storedTargets = await s.get<string[]>('target_currencies');
        if (storedTargets) setTargetCurrencies(storedTargets);
        
        const storedTheme = await s.get<boolean>('is_dark_mode');
        if (storedTheme === true || storedTheme === false) setIsDarkMode(storedTheme);
        
        setStoreLoaded(true);
      } catch (err) {
        console.error("Store error:", err);
      }
    };
    initStore();
  }, []);

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

  // Save changes to store dynamically
  useEffect(() => {
    if (!storeLoaded) return;
    const s = storeRef.current;
    if (s) {
      s.set('base_currency', baseCurrency);
      s.set('target_currencies', targetCurrencies);
      s.set('is_dark_mode', isDarkMode);
      s.save();
    }
  }, [baseCurrency, targetCurrencies, isDarkMode, storeLoaded]);

  // Fetch Exchange Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await res.json();
        if (data.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.error("Failed to fetch rates", err);
      }
    };
    fetchRates();
  }, [baseCurrency]);

  const calculateConverted = (target: string): string => {
    if (!rates[target] || !amount) return "--";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "--";
    return (numAmount * rates[target]).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const changeBaseCurrency = () => {
    const newBase = window.prompt("Enter new Base Currency (e.g., MYR, USD):");
    if (newBase && newBase.length === 3) {
      setBaseCurrency(newBase.toUpperCase());
    }
  };

  const addTargetCurrency = () => {
    if (targetCurrencies.length >= 5) {
      window.alert("Maximum 5 target currencies allowed.");
      return;
    }
    const newTarget = window.prompt("Enter Target Currency Code (e.g., SGD, EUR):");
    if (newTarget && newTarget.length === 3 && !targetCurrencies.includes(newTarget.toUpperCase())) {
      setTargetCurrencies([...targetCurrencies, newTarget.toUpperCase()]);
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full h-full bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-4 gap-4 transition-colors duration-200">
      
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
          <button onClick={changeBaseCurrency} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium pr-3 border-r border-gray-300 dark:border-neutral-700 transition-colors cursor-pointer outline-none">
            <span>{baseCurrency}</span>
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
          {targetCurrencies.map((currency) => (
            <div key={currency} className="bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 px-4 py-2 rounded-xl flex items-baseline gap-2 border border-gray-200 dark:border-neutral-800 cursor-default shadow-sm min-w-max">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold tracking-wider">{currency}</span>
              <span className="text-black dark:text-white font-medium text-lg">{calculateConverted(currency)}</span>
            </div>
          ))}
        </div>

        {/* Extreme Right: + Button */}
        <button onClick={addTargetCurrency} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all duration-200 flex-shrink-0 border border-gray-200 dark:border-neutral-700 shadow-sm cursor-pointer active:scale-95">
          <Plus size={18} />
        </button>
      </div>

    </main>
  );
}

export default App;
