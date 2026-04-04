import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Moon, Sun, HardDrive, Cpu, Layers, Settings, Bot } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

interface SysStats {
  ram: { total: number; used: number };
  swap: { total: number; used: number };
  disk: { total: number; available: number; used: number };
}

interface LocationConfig {
  city: string;
  tz: string;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function App() {
  const [sessionKey, setSessionKey] = useState("init");

  // Re-trigger animations automatically on focus change perfectly mapping to global hotkey 'Alt+Space'
  useEffect(() => {
    const unlisten = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) setSessionKey(Date.now().toString());
    });
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const [amount, setAmount] = useState<string>("100");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Currency States
  const [baseCurrency, setBaseCurrency] = useState<string>("MYR");
  const [targetCurrencies, setTargetCurrencies] = useState<string[]>(["USD", "INR"]);
  const [rates, setRates] = useState<Record<string, number>>({});
  
  // Location States
  const [locations, setLocations] = useState<LocationConfig[]>([
    { city: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur" },
    { city: "New Delhi", tz: "Asia/Kolkata" },
    { city: "New York", tz: "America/New_York" }
  ]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Settings States
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>("");
  
  const [storeLoaded, setStoreLoaded] = useState(false);
  const storeRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // System Stats State
  const [sysStats, setSysStats] = useState<SysStats | null>(null);

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
        
        const storedKey = await s.get<string>('anthropic_api_key');
        if (storedKey) setAnthropicApiKey(storedKey);
        
        setStoreLoaded(true);
      } catch (err) {
        console.error("Store error:", err);
      }
    };
    initStore();
  }, []);

  // Automatically start polling system stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats: SysStats = await invoke("get_system_stats");
        setSysStats(stats);
      } catch (err) {
        console.error("Failed to fetch sys stats", err);
      }
    };
    fetchStats(); // initial fetch
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus input automatically when window appears
  useEffect(() => {
    if (!showSettings) inputRef.current?.focus();
  }, [showSettings]);

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
      s.set('anthropic_api_key', anthropicApiKey);
      s.save();
    }
  }, [baseCurrency, targetCurrencies, isDarkMode, anthropicApiKey, storeLoaded]);

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
    <AnimatePresence mode="wait">
      {showSettings ? (
        <motion.main
          key={`${sessionKey}-settings`}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1 flex flex-col w-full h-full bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-6 transition-colors duration-200"
        >
          <div className="flex justify-between items-center mb-6">
          <h1 className="text-black dark:text-white font-semibold flex items-center gap-2 text-lg">
            <Settings size={18} /> Application Settings
          </h1>
          <button
            onClick={() => setShowSettings(false)}
            className="px-4 py-1.5 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer text-sm"
          >
            Done
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* External API Integration Box */}
          <div className="flex flex-col gap-2 bg-white/80 dark:bg-black/80 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <label className="text-gray-600 dark:text-gray-400 text-sm font-semibold tracking-wider uppercase">Anthropic API Key</label>
            <input
              type="password"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              placeholder="sk-ant-api..."
              className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-2.5 text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
            />
            <p className="text-gray-500 text-xs mt-1">Required to monitor your Claude token usage in the System Box.</p>
          </div>
        </div>
        </motion.main>
      ) : (
        <motion.main
          key={`${sessionKey}-dashboard`}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1 flex flex-col w-full h-full bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-4 gap-4 transition-colors duration-200"
        >
      
      {/* Top Header Row: Settings & Theme Toggle */}
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <Settings size={14} />
        </button>
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

      {/* Box 3: World Clocks */}
      <div className="flex items-center gap-4 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
        <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar">
          {locations.map((loc, idx) => (
            <div key={idx} className="bg-gray-100/60 dark:bg-neutral-800/60 transition-colors duration-200 px-4 py-2 rounded-xl flex flex-col border border-gray-200 dark:border-neutral-800 shadow-sm min-w-max cursor-default">
              <span className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold tracking-wider uppercase mb-0.5">{loc.city}</span>
              <span className="text-black dark:text-white font-medium text-lg leading-none">
                {new Intl.DateTimeFormat('en-US', { timeZone: loc.tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(currentTime)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Box 2: System Monitor */}
      <div className="flex items-center justify-between gap-4 bg-white/80 dark:bg-black/80 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 mt-auto">
        
        {/* RAM Usage */}
        <div className="flex flex-1 flex-col gap-1.5 border-r border-gray-200 dark:border-gray-800 pr-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><Cpu size={12}/> RAM</span>
            <span>{sysStats ? `${((sysStats.ram.used / sysStats.ram.total) * 100).toFixed(0)}%` : '--'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-black dark:bg-white h-full rounded-full transition-all duration-500" style={{ width: sysStats ? `${(sysStats.ram.used / sysStats.ram.total) * 100}%` : '0%' }}></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 font-medium">
             {sysStats ? `${formatBytes(sysStats.ram.used)} / ${formatBytes(sysStats.ram.total)}` : 'Loading...'}
          </div>
        </div>

        {/* Swap Usage */}
        <div className="flex flex-1 flex-col gap-1.5 border-r border-gray-200 dark:border-gray-800 pr-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><Layers size={12}/> Swap</span>
            <span>{sysStats && sysStats.swap.total > 0 ? `${((sysStats.swap.used / sysStats.swap.total) * 100).toFixed(0)}%` : '0%'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gray-500 dark:bg-gray-400 h-full rounded-full transition-all duration-500" style={{ width: sysStats && sysStats.swap.total > 0 ? `${(sysStats.swap.used / sysStats.swap.total) * 100}%` : '0%' }}></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 font-medium">
             {sysStats ? `${formatBytes(sysStats.swap.used)} / ${formatBytes(sysStats.swap.total)}` : 'Loading...'}
          </div>
        </div>

        {/* Disk Usage */}
        <div className="flex flex-1 flex-col gap-1.5 border-r border-gray-200 dark:border-gray-800 pr-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><HardDrive size={12}/> Disk</span>
            <span>{sysStats && sysStats.disk.total > 0 ? `${((sysStats.disk.used / sysStats.disk.total) * 100).toFixed(0)}%` : '--'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-black dark:bg-white h-full rounded-full transition-all duration-500" style={{ width: sysStats && sysStats.disk.total > 0 ? `${(sysStats.disk.used / sysStats.disk.total) * 100}%` : '0%' }}></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 font-medium">
             {sysStats ? `${formatBytes(sysStats.disk.available)} free` : 'Loading...'}
          </div>
        </div>

        {/* Claude API Usage */}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><Bot size={12}/> Claude</span>
            <span>{anthropicApiKey ? 'READY' : '----'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-orange-500/80 dark:bg-orange-400/80 h-full rounded-full transition-all duration-500" style={{ width: anthropicApiKey ? '100%' : '0%' }}></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
             {anthropicApiKey ? 'Key Linked' : 'No API Key'}
          </div>
        </div>

      </div>

        </motion.main>
      )}
    </AnimatePresence>
  );
}

export default App;
