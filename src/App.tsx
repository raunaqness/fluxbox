import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Moon, Sun, HardDrive, Cpu, Layers, Settings, Bot, Pin, FileText, Layout, GripVertical, Move } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface RecentData {
  apps: string[];
  files: string[];
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const getBaseName = (path: string) => path.split('/').pop()?.replace(".app", "") || path;

interface SortableRowProps {
  id: string;
  children: (props: { attributes: any; listeners: any }) => React.ReactNode;
}

function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative group">
        {children({ attributes, listeners })}
      </div>
    </div>
  );
}

function App() {
  const [amount, setAmount] = useState<string>("100");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Row Reordering State
  const [rowOrder, setRowOrder] = useState<string[]>(['rates', 'files', 'apps', 'clocks']);

  // Recent Items States
  const [recentApps, setRecentApps] = useState<string[]>([]);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [pinnedApps, setPinnedApps] = useState<string[]>([]);
  const [pinnedFiles, setPinnedFiles] = useState<string[]>([]);

  // Currency States
  const [baseCurrency, setBaseCurrency] = useState<string>("MYR");
  const [targetCurrencies, setTargetCurrencies] = useState<string[]>(["USD", "INR"]);
  const [rates, setRates] = useState<Record<string, number>>({});
  
  // Location States
  const [locations] = useState<LocationConfig[]>([
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

        const storedPinnedFiles = await s.get<string[]>('pinned_files');
        if (storedPinnedFiles) setPinnedFiles(storedPinnedFiles);

        const storedPinnedApps = await s.get<string[]>('pinned_apps');
        if (storedPinnedApps) setPinnedApps(storedPinnedApps);

        const storedRowOrder = await s.get<string[]>('row_order');
        if (storedRowOrder) setRowOrder(storedRowOrder);

        // Manual Size Persistence
        const storedWidth = await s.get<number>('window_width');
        const storedHeight = await s.get<number>('window_height');
        if (storedWidth && storedHeight) {
          const win = getCurrentWindow();
          await win.setSize(new LogicalSize(storedWidth, storedHeight));
        }
        
        setStoreLoaded(true);
      } catch (err) {
        console.error("Store error:", err);
      }
    };
    initStore();
  }, []);

  // Poll Recents every 30 seconds
  useEffect(() => {
    const fetchRecents = async () => {
      try {
        const data: RecentData = await invoke("get_recent_items");
        // Filter out items that are already pinned
        setRecentApps(data.apps.filter(path => !pinnedApps.includes(path)));
        setRecentFiles(data.files.filter(path => !pinnedFiles.includes(path)));
      } catch (err) {
        console.error("Failed to fetch recents", err);
      }
    };
    fetchRecents();
    const interval = setInterval(fetchRecents, 30000);
    return () => clearInterval(interval);
  }, [pinnedApps, pinnedFiles]);

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

  // Save row order when it changes
  useEffect(() => {
    if (storeLoaded && storeRef.current) {
      storeRef.current.set('row_order', rowOrder);
      storeRef.current.save();
    }
  }, [rowOrder, storeLoaded]);

  // Manual Window Size Persistence Listener
  useEffect(() => {
    if (!storeLoaded) return;
    
    let unlisten: any;
    const setupListener = async () => {
      const win = getCurrentWindow();
      unlisten = await win.onResized(async () => {
        const size = await win.innerSize();
        // size is physical, we should convert to logical or just store as is
        // innerSize() returns physical. setSize() takes logical or physical depending on what you pass.
        // For consistency on high-DPI screens, LogicalSize is better.
        const factor = await win.scaleFactor();
        const logicalWidth = size.width / factor;
        const logicalHeight = size.height / factor;
        
        if (storeRef.current) {
          await storeRef.current.set('window_width', logicalWidth);
          await storeRef.current.set('window_height', logicalHeight);
          await storeRef.current.save();
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [storeLoaded]);

  // Save changes to store dynamically
  useEffect(() => {
    if (!storeLoaded) return;
    const s = storeRef.current;
    if (s) {
      s.set('base_currency', baseCurrency);
      s.set('target_currencies', targetCurrencies);
      s.set('is_dark_mode', isDarkMode);
      s.set('anthropic_api_key', anthropicApiKey);
      s.set('pinned_files', pinnedFiles);
      s.set('pinned_apps', pinnedApps);
      s.set('row_order', rowOrder);
      s.save();
    }
  }, [baseCurrency, targetCurrencies, isDarkMode, anthropicApiKey, pinnedFiles, pinnedApps, rowOrder, storeLoaded]);

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

  const togglePinFile = (path: string) => {
    if (pinnedFiles.includes(path)) {
      setPinnedFiles(pinnedFiles.filter(p => p !== path));
    } else {
      setPinnedFiles([...pinnedFiles, path]);
    }
  };

  const togglePinApp = (path: string) => {
    if (pinnedApps.includes(path)) {
      setPinnedApps(pinnedApps.filter(p => p !== path));
    } else {
      setPinnedApps([...pinnedApps, path]);
    }
  };

  const handleLaunch = async (path: string) => {
    try {
      await openPath(path);
    } catch (err) {
      console.error("Failed to open", err);
    }
  };

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setRowOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const renderRow = (id: string) => {
    switch (id) {
      case 'rates':
        return (
          <SortableRow key="rates" id="rates">
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Rates</span>
                </div>
                
                <div className="flex items-center bg-gray-100/80 dark:bg-neutral-900/80 rounded-xl p-2.5 flex-shrink-0 w-1/3 min-w-[140px] border border-gray-200 dark:border-neutral-800 transition-colors duration-200">
                  <button onClick={changeBaseCurrency} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium pr-3 border-r border-gray-300 dark:border-neutral-700 transition-colors cursor-pointer outline-none text-sm">
                    <span>{baseCurrency}</span>
                    <ChevronDown size={12} />
                  </button>
                  <input
                    ref={inputRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent text-right text-lg font-medium text-black dark:text-white outline-none ml-2 placeholder:text-gray-400 w-full"
                    autoFocus
                  />
                </div>

                <div className="flex flex-1 items-center gap-2.5 overflow-x-auto no-scrollbar">
                  {targetCurrencies.map((currency) => (
                    <div key={currency} className="bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 px-3 py-1.5 rounded-xl flex items-baseline gap-2 border border-gray-200 dark:border-neutral-800 cursor-default shadow-sm min-w-max">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold tracking-wider">{currency}</span>
                      <span className="text-black dark:text-white font-medium text-base">{calculateConverted(currency)}</span>
                    </div>
                  ))}
                </div>

                <button onClick={addTargetCurrency} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all duration-200 flex-shrink-0 border border-gray-200 dark:border-neutral-700 shadow-sm cursor-pointer active:scale-95">
                  <Plus size={16} />
                </button>
              </div>
            )}
          </SortableRow>
        );
      case 'files':
        return (
          <SortableRow key="files" id="files">
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Files</span>
                </div>
                <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {[...pinnedFiles, ...recentFiles].map((path) => (
                    <div 
                      key={path} 
                      onClick={() => handleLaunch(path)}
                      className={`group relative bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/80 dark:hover:bg-neutral-700/80 transition-all duration-200 px-3 py-2 rounded-xl flex items-center gap-3 border border-gray-200 dark:border-neutral-800 shadow-sm min-w-max cursor-pointer ${pinnedFiles.includes(path) ? 'ring-1 ring-gray-400 dark:ring-gray-600' : ''}`}
                    >
                      <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-black dark:text-white font-medium text-xs leading-none">{getBaseName(path)}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePinFile(path); }}
                        className={`ml-1 p-1 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors ${pinnedFiles.includes(path) ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}
                      >
                        <Pin size={10} fill={pinnedFiles.includes(path) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SortableRow>
        );
      case 'apps':
        return (
          <SortableRow key="apps" id="apps">
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Apps</span>
                </div>
                <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {[...pinnedApps, ...recentApps].map((path) => (
                    <div 
                      key={path} 
                      onClick={() => handleLaunch(path)}
                      className={`group relative bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/80 dark:hover:bg-neutral-700/80 transition-all duration-200 px-3 py-2 rounded-xl flex items-center gap-3 border border-gray-200 dark:border-neutral-800 shadow-sm min-w-max cursor-pointer ${pinnedApps.includes(path) ? 'ring-1 ring-gray-400 dark:ring-gray-600' : ''}`}
                    >
                      <Layout size={16} className="text-gray-500 dark:text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-black dark:text-white font-medium text-xs leading-none">{getBaseName(path)}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePinApp(path); }}
                        className={`ml-1 p-1 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors ${pinnedApps.includes(path) ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}
                      >
                        <Pin size={10} fill={pinnedApps.includes(path) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SortableRow>
        );
      case 'clocks':
        return (
          <SortableRow key="clocks" id="clocks">
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Clocks</span>
                </div>
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
            )}
          </SortableRow>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {showSettings ? (
        <main
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
        </main>
      ) : (
        <main
          className="flex-1 flex flex-col w-full h-full bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-2 pt-1 gap-3 transition-colors duration-200"
        >
      
      <div className="flex justify-between items-center w-full px-2 mt-1">
        <div 
          onPointerDown={() => getCurrentWindow().startDragging()}
          className="p-1.5 rounded-lg bg-gray-200/40 dark:bg-neutral-800/40 hover:bg-gray-300/60 dark:hover:bg-neutral-700/60 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-all cursor-grab active:cursor-grabbing shadow-sm"
        >
          <Move size={12} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <Settings size={13} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      {/* Draggable Rows Container */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={rowOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {rowOrder.map(id => renderRow(id))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Fixed Bottom Row: System Monitor */}
      <div className="flex items-center justify-between gap-4 bg-white/80 dark:bg-black/80 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 mt-auto">
        
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

        </main>
      )}
    </>
  );
}

export default App;
