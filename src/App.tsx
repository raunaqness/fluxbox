import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Moon, Sun, HardDrive, Cpu, Layers, Settings, Bot, Pin, FileText, Layout, GripVertical, Move, X, Check, Cloud, CloudRain, CloudLightning, CloudSnow, Wind, Search, Image, Film, Music, Code, File, FileSpreadsheet, Archive, Presentation, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
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
  lat?: number;
  lon?: number;
}

interface RecentData {
  apps: string[];
  files: string[];
}

interface WatchlistItem {
  symbol: string;
  type: 'crypto' | 'stock';
  coingecko_id?: string;
  name: string;
}

interface TickerPrice {
  price: number;
  change_percent: number;
}

const POPULAR_TICKERS: WatchlistItem[] = [
  { symbol: 'BTC', type: 'crypto', coingecko_id: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'ETH', type: 'crypto', coingecko_id: 'ethereum', name: 'Ethereum' },
  { symbol: 'SOL', type: 'crypto', coingecko_id: 'solana', name: 'Solana' },
  { symbol: 'BNB', type: 'crypto', coingecko_id: 'binancecoin', name: 'BNB' },
  { symbol: 'XRP', type: 'crypto', coingecko_id: 'ripple', name: 'XRP' },
  { symbol: 'DOGE', type: 'crypto', coingecko_id: 'dogecoin', name: 'Dogecoin' },
  { symbol: 'ADA', type: 'crypto', coingecko_id: 'cardano', name: 'Cardano' },
  { symbol: 'DOT', type: 'crypto', coingecko_id: 'polkadot', name: 'Polkadot' },
  { symbol: 'AVAX', type: 'crypto', coingecko_id: 'avalanche-2', name: 'Avalanche' },
  { symbol: 'MATIC', type: 'crypto', coingecko_id: 'matic-network', name: 'Polygon' },
  { symbol: 'AAPL', type: 'stock', name: 'Apple' },
  { symbol: 'MSFT', type: 'stock', name: 'Microsoft' },
  { symbol: 'GOOGL', type: 'stock', name: 'Alphabet' },
  { symbol: 'AMZN', type: 'stock', name: 'Amazon' },
  { symbol: 'TSLA', type: 'stock', name: 'Tesla' },
  { symbol: 'NVDA', type: 'stock', name: 'NVIDIA' },
  { symbol: 'META', type: 'stock', name: 'Meta' },
  { symbol: 'NFLX', type: 'stock', name: 'Netflix' },
  { symbol: 'AMD', type: 'stock', name: 'AMD' },
  { symbol: 'DIS', type: 'stock', name: 'Disney' },
];

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const getBaseName = (path: string) => path.split('/').pop()?.replace(".app", "") || path;

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
  AUD: "Australian Dollar", CAD: "Canadian Dollar", CHF: "Swiss Franc",
  CNY: "Chinese Yuan", HKD: "Hong Kong Dollar", NZD: "New Zealand Dollar",
  SGD: "Singapore Dollar", INR: "Indian Rupee", MYR: "Malaysian Ringgit",
  THB: "Thai Baht", IDR: "Indonesian Rupiah", KRW: "South Korean Won",
  VND: "Vietnamese Dong", BRL: "Brazilian Real", ZAR: "South African Rand",
  SEK: "Swedish Krona", NOK: "Norwegian Krone", DKK: "Danish Krone",
  PLN: "Polish Zloty", TRY: "Turkish Lira", RUB: "Russian Ruble",
  AED: "UAE Dirham", SAR: "Saudi Riyal", PHP: "Philippine Peso",
  TWD: "Taiwan Dollar", PKR: "Pakistani Rupee", BDT: "Bangladeshi Taka",
  EGP: "Egyptian Pound", NGN: "Nigerian Naira", CLP: "Chilean Peso",
  COP: "Colombian Peso", ARS: "Argentine Peso", PEN: "Peruvian Sol",
  CZK: "Czech Koruna", HUF: "Hungarian Forint", RON: "Romanian Leu",
  ILS: "Israeli Shekel", KES: "Kenyan Shilling", GHS: "Ghanaian Cedi",
};

const getFileIcon = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf': return <FileText size={16} className="text-red-500" />;
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': case 'bmp': case 'ico': case 'tiff':
      return <Image size={16} className="text-purple-500" />;
    case 'mp4': case 'mov': case 'avi': case 'mkv': case 'webm':
      return <Film size={16} className="text-blue-500" />;
    case 'mp3': case 'wav': case 'aac': case 'flac': case 'ogg': case 'm4a':
      return <Music size={16} className="text-pink-500" />;
    case 'js': case 'ts': case 'jsx': case 'tsx': case 'py': case 'rs': case 'go': case 'java': case 'c': case 'cpp': case 'h': case 'css': case 'html': case 'json': case 'xml': case 'yaml': case 'yml': case 'sh': case 'bash': case 'md':
      return <Code size={16} className="text-green-500" />;
    case 'xls': case 'xlsx': case 'csv': case 'numbers':
      return <FileSpreadsheet size={16} className="text-emerald-600" />;
    case 'ppt': case 'pptx': case 'key':
      return <Presentation size={16} className="text-orange-500" />;
    case 'zip': case 'rar': case '7z': case 'tar': case 'gz':
      return <Archive size={16} className="text-yellow-600" />;
    case 'doc': case 'docx': case 'txt': case 'rtf': case 'pages':
      return <FileText size={16} className="text-blue-600" />;
    default:
      return <File size={16} className="text-gray-500 dark:text-gray-400" />;
  }
};

interface SortableRowProps {
  id: string;
  isDropdownActive?: boolean;
  children: (props: { attributes: any; listeners: any }) => React.ReactNode;
}

function SortableRow({ id, isDropdownActive, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : isDropdownActive ? 40 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
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
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingEmail, setOnboardingEmail] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  
  // Dropdown States
  const [activeDropdown, setActiveDropdown] = useState<"base" | "target" | "clock" | "ticker" | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const POPULAR_CURRENCIES = [
    "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "HKD", "NZD", "SGD", "INR", "MYR", "THB", "IDR", "KRW", "VND"
  ];
  
  // Row Reordering State
  const [rowOrder, setRowOrder] = useState<string[]>(['rates', 'ticker', 'files', 'apps', 'cities']);

  // Stats Visibility
  const [visibleStats, setVisibleStats] = useState<Record<string, boolean>>({
    ram: true, swap: true, disk: true, claude: true,
  });

  // Market Ticker States
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { symbol: 'BTC', type: 'crypto', coingecko_id: 'bitcoin', name: 'Bitcoin' },
    { symbol: 'ETH', type: 'crypto', coingecko_id: 'ethereum', name: 'Ethereum' },
    { symbol: 'AAPL', type: 'stock', name: 'Apple' },
    { symbol: 'MSFT', type: 'stock', name: 'Microsoft' },
  ]);
  const [tickerPrices, setTickerPrices] = useState<Record<string, TickerPrice>>({});
  const [tickerSearchResults, setTickerSearchResults] = useState<WatchlistItem[]>([]);
  const [tickerSearchLoading, setTickerSearchLoading] = useState(false);

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
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const POPULAR_LOCATIONS: LocationConfig[] = [
    { city: "London", tz: "Europe/London", lat: 51.51, lon: -0.13 },
    { city: "New York", tz: "America/New_York", lat: 40.71, lon: -74.01 },
    { city: "Tokyo", tz: "Asia/Tokyo", lat: 35.69, lon: 139.69 },
    { city: "Dubai", tz: "Asia/Dubai", lat: 25.21, lon: 55.27 },
    { city: "Singapore", tz: "Asia/Singapore", lat: 1.29, lon: 103.85 },
    { city: "Sydney", tz: "Australia/Sydney", lat: -33.87, lon: 151.21 },
    { city: "San Francisco", tz: "America/Los_Angeles", lat: 37.77, lon: -122.42 },
    { city: "Paris", tz: "Europe/Paris", lat: 48.85, lon: 2.35 },
    { city: "New Delhi", tz: "Asia/Kolkata", lat: 28.61, lon: 77.21 },
    { city: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur", lat: 3.14, lon: 101.69 }
  ];
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Settings States
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>("");
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [appIcons, setAppIcons] = useState<Record<string, string>>({});
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
        
        const hasSeenOnboarding = await s.get<boolean>('has_seen_onboarding');
        if (!hasSeenOnboarding) setShowOnboarding(true);
        
        const storedZoom = await s.get<number>('zoom_level');
        if (storedZoom) setZoomLevel(storedZoom);
        
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
        if (storedRowOrder) {
          // Migrate 'clocks' -> 'cities' if needed, add 'ticker' if missing
          let migrated = storedRowOrder.map(r => r === 'clocks' ? 'cities' : r);
          if (!migrated.includes('ticker')) {
            migrated = ['rates', 'ticker', ...migrated.filter(r => r !== 'rates')];
          }
          setRowOrder(migrated);
        }

        const storedWatchlist = await s.get<WatchlistItem[]>('watchlist');
        if (storedWatchlist && storedWatchlist.length > 0) setWatchlist(storedWatchlist);

        const storedVisibleStats = await s.get<Record<string, boolean>>('visible_stats');
        if (storedVisibleStats) setVisibleStats(storedVisibleStats);

        const storedLocations = await s.get<LocationConfig[]>('locations');
        if (storedLocations && storedLocations.length > 0) {
          setLocations(storedLocations);
        } else {
          setLocations([
            { city: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur", lat: 3.14, lon: 101.69 },
            { city: "New York", tz: "America/New_York", lat: 40.71, lon: -74.01 },
            { city: "London", tz: "Europe/London", lat: 51.51, lon: -0.13 }
          ]);
        }

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

  // Fetch Weather data
  useEffect(() => {
    if (locations.length === 0) return;

    const fetchWeather = async () => {
      const newWeatherData: Record<string, any> = {};
      await Promise.all(locations.map(async (loc) => {
        try {
          if (!loc.lat || !loc.lon) return;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`);
          const data = await res.json();
          if (data.current_weather) {
            newWeatherData[loc.city] = {
              temp: Math.round(data.current_weather.temperature),
              condition: data.current_weather.weathercode,
              id: data.current_weather.weathercode // Use weathercode as ID
            };
          }
        } catch (err) {
          console.error(`Weather fetch failed for ${loc.city}`, err);
        }
      }));
      setWeatherData(newWeatherData);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 mins
    return () => clearInterval(interval);
  }, [locations]);

  // Focus input automatically when window appears
  useEffect(() => {
    if (!showSettings && !activeDropdown) inputRef.current?.focus();
  }, [showSettings, activeDropdown]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setDropdownSearch("");
      }
    };
    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

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
      s.set('locations', locations);
      s.set('visible_stats', visibleStats);
      s.set('watchlist', watchlist);
      s.set('zoom_level', zoomLevel);
      s.save();
    }
  }, [baseCurrency, targetCurrencies, isDarkMode, anthropicApiKey, pinnedFiles, pinnedApps, rowOrder, locations, visibleStats, watchlist, zoomLevel, storeLoaded]);

  // Handle Zoom Keyboard Shortcuts (Cmd + / - / 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel(prev => Math.min(prev + 0.05, 1.5));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel(prev => Math.max(prev - 0.05, 0.7));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Fetch Market Ticker Prices
  useEffect(() => {
    const fetchTickerPrices = async () => {
      // Fetch crypto prices from CoinGecko
      const cryptoItems = watchlist.filter(w => w.type === 'crypto' && w.coingecko_id);
      if (cryptoItems.length > 0) {
        try {
          const ids = cryptoItems.map(c => c.coingecko_id).join(',');
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
          const data = await res.json();
          const newPrices: Record<string, TickerPrice> = {};
          for (const item of cryptoItems) {
            const d = data[item.coingecko_id!];
            if (d) {
              newPrices[item.symbol] = {
                price: d.usd,
                change_percent: d.usd_24h_change || 0,
              };
            }
          }
          setTickerPrices(prev => ({ ...prev, ...newPrices }));
        } catch (err) {
          console.error('CoinGecko fetch error', err);
        }
      }

      // Fetch stock prices from Rust backend (Yahoo Finance)
      const stockItems = watchlist.filter(w => w.type === 'stock');
      for (const stock of stockItems) {
        try {
          const result: any = await invoke('get_stock_quote', { symbol: stock.symbol });
          if (result && result.price > 0) {
            setTickerPrices(prev => ({
              ...prev,
              [stock.symbol]: {
                price: result.price,
                change_percent: result.change_percent,
              },
            }));
          }
        } catch (err) {
          console.error(`Stock fetch error for ${stock.symbol}`, err);
        }
      }
    };

    fetchTickerPrices();
    const interval = setInterval(fetchTickerPrices, 60000);
    return () => clearInterval(interval);
  }, [watchlist]);

  // Debounced ticker search via Yahoo Finance
  useEffect(() => {
    if (activeDropdown !== "ticker") {
      setTickerSearchResults([]);
      return;
    }

    const query = dropdownSearch.trim();
    if (query.length === 0) {
      // Show popular tickers when no search query
      setTickerSearchResults(POPULAR_TICKERS);
      setTickerSearchLoading(false);
      return;
    }

    setTickerSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result: any = await invoke('search_tickers', { query });
        if (result?.results) {
          const items: WatchlistItem[] = result.results.map((r: any) => ({
            symbol: r.symbol,
            type: r.type as 'crypto' | 'stock',
            name: r.name || r.symbol,
            coingecko_id: r.type === 'crypto' ? r.coingecko_id : undefined,
          }));
          setTickerSearchResults(items);
        }
      } catch (err) {
        console.error('Ticker search error', err);
        // Fallback to filtering popular tickers
        setTickerSearchResults(
          POPULAR_TICKERS.filter(t =>
            t.symbol.toLowerCase().includes(query.toLowerCase()) ||
            t.name.toLowerCase().includes(query.toLowerCase())
          )
        );
      }
      setTickerSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [dropdownSearch, activeDropdown]);

  const calculateConverted = (target: string): string => {
    if (!rates[target] || !amount) return "--";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "--";
    return (numAmount * rates[target]).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const changeBaseCurrency = (code: string) => {
    setBaseCurrency(code);
    setActiveDropdown(null);
    setDropdownSearch("");
  };

  const addTargetCurrency = (code: string) => {
    if (targetCurrencies.length >= 5) return;
    if (!targetCurrencies.includes(code)) {
      setTargetCurrencies([...targetCurrencies, code]);
    }
    setActiveDropdown(null);
    setDropdownSearch("");
  };
  const removeTargetCurrency = (code: string) => {
    setTargetCurrencies(targetCurrencies.filter(c => c !== code));
  };

  const addLocation = (loc: LocationConfig) => {
    if (locations.length >= 5) return;
    if (!locations.some(l => l.tz === loc.tz)) {
      setLocations([...locations, loc]);
    }
    setActiveDropdown(null);
    setDropdownSearch("");
  };
  const removeLocation = (tz: string) => {
    setLocations(locations.filter(l => l.tz !== tz));
  };

  const getWeatherIcon = (code: number) => {
    // Open-Meteo WMO Codes: https://open-meteo.com/en/docs
    if (code === 0) return <Sun size={14} className="text-yellow-500" />;
    if (code >= 1 && code <= 3) return <Cloud size={14} className="text-gray-400" />; // Partly cloudy
    if (code >= 45 && code <= 48) return <Wind size={14} className="text-gray-400" />; // Fog
    if (code >= 51 && code <= 67) return <CloudRain size={14} className="text-blue-500" />; // Rain/Drizzle
    if (code >= 71 && code <= 77) return <CloudSnow size={14} className="text-blue-200" />; // Snow
    if (code >= 80 && code <= 82) return <CloudRain size={14} className="text-blue-600" />; // Rain showers
    if (code >= 95) return <CloudLightning size={14} className="text-purple-500" />; // Thunderstorm
    return <Cloud size={14} className="text-gray-400" />;
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
      await invoke('open_path', { path });
    } catch (err) {
      console.error("Failed to open", err);
    }
  };

  // Fetch app icons
  useEffect(() => {
    const allApps = [...pinnedApps, ...recentApps];
    const fetchIcons = async () => {
      for (const appPath of allApps) {
        if (appIcons[appPath]) continue;
        try {
          const icon: string = await invoke('get_app_icon', { path: appPath });
          if (icon) {
            setAppIcons(prev => ({ ...prev, [appPath]: icon }));
          }
        } catch (_) { /* ignore */ }
      }
    };
    if (allApps.length > 0) fetchIcons();
  }, [pinnedApps, recentApps]);

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

  const addWatchlistItem = (item: WatchlistItem) => {
    if (watchlist.length >= 8) return;
    if (!watchlist.some(w => w.symbol === item.symbol)) {
      setWatchlist([...watchlist, item]);
    }
    setActiveDropdown(null);
    setDropdownSearch("");
  };

  const removeWatchlistItem = (symbol: string) => {
    setWatchlist(watchlist.filter(w => w.symbol !== symbol));
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const renderRow = (id: string) => {
    switch (id) {
      case 'ticker':
        return (
          <SortableRow key="ticker" id="ticker" isDropdownActive={activeDropdown === "ticker"}>
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 relative">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Ticker</span>
                </div>
                <div className="flex flex-1 items-center gap-2.5 overflow-x-auto no-scrollbar">
                  {watchlist.map((item) => {
                    const priceData = tickerPrices[item.symbol];
                    const isPositive = priceData ? priceData.change_percent >= 0 : true;
                    return (
                      <div 
                        key={item.symbol} 
                        onClick={() => {
                          const url = item.type === 'crypto' 
                            ? `https://www.coingecko.com/en/coins/${item.coingecko_id}` 
                            : `https://finance.yahoo.com/quote/${item.symbol}/`;
                          handleLaunch(url);
                        }}
                        onContextMenu={(e) => { e.preventDefault(); removeWatchlistItem(item.symbol); }}
                        className={`group relative bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 px-3 py-1.5 rounded-xl flex items-center gap-2 border shadow-sm min-w-max cursor-pointer ${
                          isPositive 
                            ? 'border-emerald-200/50 dark:border-emerald-900/30' 
                            : 'border-red-200/50 dark:border-red-900/30'
                        }`}
                        title="Click to view chart · Right-click to remove"
                      >
                        <div className="flex items-center gap-1">
                          {item.type === 'crypto' ? (
                            <BarChart3 size={12} className="text-orange-500" />
                          ) : (
                            <TrendingUp size={12} className="text-blue-500" />
                          )}
                          <span className="text-gray-500 dark:text-gray-400 text-[10px] font-bold tracking-wider">{item.symbol}</span>
                        </div>
                        <span className="text-black dark:text-white font-medium text-sm">
                          {priceData ? `$${formatPrice(priceData.price)}` : '...'}
                        </span>
                        {priceData && (
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                          }`}>
                            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(priceData.change_percent).toFixed(2)}%
                          </span>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeWatchlistItem(item.symbol); }} 
                          className="hidden group-hover:flex absolute -top-1 -right-1 w-4 h-4 items-center justify-center bg-red-500 text-white rounded-full scale-75 shadow-lg"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div ref={activeDropdown === "ticker" ? dropdownRef : undefined} className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === "ticker" ? null : "ticker")} 
                    disabled={watchlist.length >= 8}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 border shadow-sm cursor-pointer active:scale-95 ${watchlist.length >= 8 ? "bg-gray-50 dark:bg-neutral-900/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-neutral-800 opacity-50 cursor-not-allowed" : "bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-700"}`}
                  >
                    <Plus size={16} />
                  </button>

                  {activeDropdown === "ticker" && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 rounded-lg px-2 py-1">
                          <Search size={12} className="text-gray-400" />
                          <input
                            type="text"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Search tickers..."
                            className="bg-transparent text-xs text-black dark:text-white outline-none w-full placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {tickerSearchLoading && (
                          <div className="px-4 py-3 text-xs text-gray-400 text-center">Searching...</div>
                        )}
                        {!tickerSearchLoading && tickerSearchResults.filter(t => !watchlist.some(w => w.symbol === t.symbol)).length === 0 && dropdownSearch.trim().length > 0 && (
                          <div className="px-4 py-3 text-xs text-gray-400 text-center">No results for "{dropdownSearch}"</div>
                        )}
                        {!tickerSearchLoading && tickerSearchResults.filter(t => !watchlist.some(w => w.symbol === t.symbol)).map(item => (
                          <button
                            key={item.symbol}
                            onClick={() => addWatchlistItem(item)}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              {item.type === 'crypto' ? (
                                <BarChart3 size={12} className="text-orange-500" />
                              ) : (
                                <TrendingUp size={12} className="text-blue-500" />
                              )}
                              <span>{item.symbol} <span className="text-gray-400 dark:text-gray-500 text-xs">— {item.name}</span></span>
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              item.type === 'crypto' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>{item.type === 'crypto' ? 'Crypto' : 'Stock'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SortableRow>
        );
      case 'rates':
        return (
          <SortableRow key="rates" id="rates" isDropdownActive={activeDropdown === "base" || activeDropdown === "target"}>
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 relative">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Rates</span>
                </div>
                
                <div ref={activeDropdown === "base" ? dropdownRef : undefined} className="flex items-center bg-gray-100/80 dark:bg-neutral-900/80 rounded-xl p-2.5 flex-shrink-0 w-1/3 min-w-[140px] border border-gray-200 dark:border-neutral-800 transition-colors duration-200 relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === "base" ? null : "base")} 
                    className={`flex items-center gap-1 font-medium pr-3 border-r border-gray-300 dark:border-neutral-700 transition-colors cursor-pointer outline-none text-sm ${activeDropdown === "base" ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
                  >
                    <span>{baseCurrency}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === "base" ? "rotate-180" : ""}`} />
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

                  {/* Base Currency Dropdown */}
                  {activeDropdown === "base" && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 rounded-lg px-2 py-1">
                          <Search size={12} className="text-gray-400" />
                          <input
                            type="text"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Search currencies..."
                            className="bg-transparent text-xs text-black dark:text-white outline-none w-full placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {POPULAR_CURRENCIES.filter(code => {
                          const q = dropdownSearch.toLowerCase();
                          return code.toLowerCase().includes(q) || (CURRENCY_NAMES[code] || '').toLowerCase().includes(q);
                        }).map(code => (
                          <button
                            key={code}
                            onClick={() => changeBaseCurrency(code)}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <span>{code} <span className="text-gray-400 dark:text-gray-500 text-xs">— {CURRENCY_NAMES[code] || code}</span></span>
                            {baseCurrency === code && <Check size={14} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 items-center gap-2.5 overflow-x-auto no-scrollbar">
                  {targetCurrencies.map((currency) => (
                    <div 
                      key={currency} 
                      onContextMenu={(e) => { e.preventDefault(); removeTargetCurrency(currency); }}
                      className="group relative bg-gray-100/60 dark:bg-neutral-800/60 hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 px-3 py-1.5 rounded-xl flex items-baseline gap-2 border border-gray-200 dark:border-neutral-800 cursor-default shadow-sm min-w-max"
                      title="Right-click to remove"
                    >
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold tracking-wider">{currency}</span>
                      <span className="text-black dark:text-white font-medium text-base">{calculateConverted(currency)}</span>
                      
                      {/* Mobile-friendly remove button or hover remove button */}
                      <button 
                        onClick={() => removeTargetCurrency(currency)} 
                        className="hidden group-hover:flex absolute -top-1 -right-1 w-4 h-4 items-center justify-center bg-red-500 text-white rounded-full scale-75 shadow-lg"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                <div ref={activeDropdown === "target" ? dropdownRef : undefined} className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === "target" ? null : "target")} 
                    disabled={targetCurrencies.length >= 5}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 border shadow-sm cursor-pointer active:scale-95 ${targetCurrencies.length >= 5 ? "bg-gray-50 dark:bg-neutral-900/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-neutral-800 opacity-50 cursor-not-allowed" : "bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-700"}`}
                  >
                    <Plus size={16} />
                  </button>

                  {/* Target Currency Dropdown */}
                  {activeDropdown === "target" && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 rounded-lg px-2 py-1">
                          <Search size={12} className="text-gray-400" />
                          <input
                            type="text"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Search currencies..."
                            className="bg-transparent text-xs text-black dark:text-white outline-none w-full placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {POPULAR_CURRENCIES.filter(c => !targetCurrencies.includes(c)).filter(code => {
                          const q = dropdownSearch.toLowerCase();
                          return code.toLowerCase().includes(q) || (CURRENCY_NAMES[code] || '').toLowerCase().includes(q);
                        }).map(code => (
                          <button
                            key={code}
                            onClick={() => addTargetCurrency(code)}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <span>{code} <span className="text-gray-400 dark:text-gray-500 text-xs">— {CURRENCY_NAMES[code] || code}</span></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                      {getFileIcon(path)}
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
                      {appIcons[path] ? (
                        <img src={appIcons[path]} alt="" className="w-4 h-4 rounded-sm" />
                      ) : (
                        <Layout size={16} className="text-gray-500 dark:text-gray-400" />
                      )}
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
      case 'cities':
        return (
          <SortableRow key="cities" id="cities" isDropdownActive={activeDropdown === "clock"}>
            {({ attributes, listeners }) => (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-black/80 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 relative">
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex items-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing pr-1"
                >
                  <GripVertical size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest vertical-text ml-0.5">Cities</span>
                </div>
                <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar">
                  {locations.map((loc, idx) => {
                    const weather = weatherData[loc.city];
                    const code = weather?.condition;
                    const isSunny = code === 0 || (code >= 1 && code <= 2);
                    const isCloudy = (code >= 3 && code <= 48) || (code >= 51);
                    
                    return (
                      <div 
                        key={idx} 
                        onContextMenu={(e) => { e.preventDefault(); removeLocation(loc.tz); }}
                        className={`group relative bg-gray-100/60 dark:bg-neutral-800/60 transition-all duration-300 px-4 py-2 rounded-xl flex flex-col border shadow-sm min-w-max cursor-default ${
                          isSunny ? "border-yellow-200/50 dark:border-yellow-900/30 bg-yellow-50/30 dark:bg-yellow-900/10" : 
                          isCloudy ? "border-blue-200/50 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10" : 
                          "border-gray-200 dark:border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-0.5">
                          <div className="flex items-center gap-1.5">
                            {weather && getWeatherIcon(weather.id)}
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                              isSunny ? "text-yellow-600 dark:text-yellow-500" : 
                              isCloudy ? "text-blue-600 dark:text-blue-500" : 
                              "text-gray-500 dark:text-gray-400"
                            }`}>{loc.city}</span>
                          </div>
                          {weather && (
                            <span className={`text-[10px] font-bold ${
                              isSunny ? "text-yellow-600" : isCloudy ? "text-blue-600" : "text-gray-500"
                            }`}>
                              {weather.temp}°
                            </span>
                          )}
                        </div>
                        <span className="text-black dark:text-white font-medium text-lg leading-none">
                          {new Intl.DateTimeFormat('en-US', { timeZone: loc.tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(currentTime)}
                        </span>
                        <button 
                          onClick={() => removeLocation(loc.tz)} 
                          className="hidden group-hover:flex absolute -top-1 -right-1 w-4 h-4 items-center justify-center bg-red-500 text-white rounded-full scale-75 shadow-lg overflow-hidden"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div ref={activeDropdown === "clock" ? dropdownRef : undefined} className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === "clock" ? null : "clock")} 
                    disabled={locations.length >= 5}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 border shadow-sm cursor-pointer active:scale-95 ${locations.length >= 5 ? "bg-gray-50 dark:bg-neutral-900/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-neutral-800 opacity-50 cursor-not-allowed" : "bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-700"}`}
                  >
                    <Plus size={16} />
                  </button>

                  {/* World Clock Dropdown */}
                  {activeDropdown === "clock" && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 rounded-lg px-2 py-1">
                          <Search size={12} className="text-gray-400" />
                          <input
                            type="text"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Search cities..."
                            className="bg-transparent text-xs text-black dark:text-white outline-none w-full placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {POPULAR_LOCATIONS.filter(p => !locations.some(l => l.tz === p.tz)).filter(loc => {
                          return loc.city.toLowerCase().includes(dropdownSearch.toLowerCase());
                        }).map(loc => (
                          <button
                            key={loc.tz}
                            onClick={() => addLocation(loc)}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <span>{loc.city}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
          style={{ zoom: zoomLevel } as React.CSSProperties}
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

        <div className="flex flex-col gap-4 overflow-y-auto flex-1">
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

          <div className="flex flex-col gap-3 bg-white/80 dark:bg-black/80 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <label className="text-gray-600 dark:text-gray-400 text-sm font-semibold tracking-wider uppercase">Stats Bar Widgets</label>
            <p className="text-gray-500 text-xs -mt-1">Toggle visibility of individual widgets in the bottom stats bar.</p>
            {[
              { key: 'ram', label: 'RAM Usage', icon: <Cpu size={14} /> },
              { key: 'swap', label: 'Swap Usage', icon: <Layers size={14} /> },
              { key: 'disk', label: 'Disk Usage', icon: <HardDrive size={14} /> },
              { key: 'claude', label: 'Claude Status', icon: <Bot size={14} /> },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {icon}
                  <span>{label}</span>
                </div>
                <button
                  onClick={() => setVisibleStats(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                    visibleStats[key] ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-neutral-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                    visibleStats[key] ? 'left-5.5 bg-white dark:bg-black' : 'left-0.5 bg-white dark:bg-gray-400'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 bg-white/80 dark:bg-black/80 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mt-2">
            <img src="/fluxbox_icon.png" alt="FluxBox Icon" className="w-16 h-16 rounded-2xl shadow-lg" />
            <div className="text-center">
              <h2 className="text-black dark:text-white font-bold text-lg">FluxBox</h2>
              <p className="text-gray-500 text-xs font-medium">Version 1.0.0 (Build 2026.0406)</p>
            </div>
            <div className="w-full h-px bg-gray-100 dark:bg-neutral-900 my-1" />
            <p className="text-gray-500 text-[10px] text-center leading-relaxed px-4">
              A high-performance command center for macOS professionals. Built with Rust and ❤️ by Raunaq.
            </p>
          </div>
        </div>
        </main>
      ) : (
        <main
          style={{ zoom: zoomLevel } as React.CSSProperties}
          className="flex-1 flex flex-col w-full h-full bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-y-auto overflow-x-hidden p-2 pt-1 gap-3 transition-colors duration-200"
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
        
        {visibleStats.ram && (
        <div className={`flex flex-1 flex-col gap-1.5 ${visibleStats.swap || visibleStats.disk || visibleStats.claude ? 'border-r border-gray-200 dark:border-gray-800 pr-4' : ''}`}>
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
        )}

        {visibleStats.swap && (
        <div className={`flex flex-1 flex-col gap-1.5 ${visibleStats.disk || visibleStats.claude ? 'border-r border-gray-200 dark:border-gray-800 pr-4' : ''}`}>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><Layers size={12}/> Swap</span>
            <span>{(sysStats && sysStats.swap.total > 0) ? `${((sysStats.swap.used / sysStats.swap.total) * 100).toFixed(0)}%` : '0%'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gray-500 dark:bg-gray-400 h-full rounded-full transition-all duration-500" style={{ width: (sysStats && sysStats.swap.total > 0) ? `${(sysStats.swap.used / sysStats.swap.total) * 100}%` : '0%' }}></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 font-medium">
             {sysStats ? `${formatBytes(sysStats.swap.used)} / ${formatBytes(sysStats.swap.total)}` : 'Loading...'}
          </div>
        </div>
        )}

        {visibleStats.disk && (
        <div className={`flex flex-1 flex-col gap-1.5 ${visibleStats.claude ? 'border-r border-gray-200 dark:border-gray-800 pr-4' : ''}`}>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center gap-1.5"><HardDrive size={12}/> Disk</span>
            <span>{(sysStats && sysStats.disk.total > 0) ? `${((sysStats.disk.used / sysStats.disk.total) * 100).toFixed(0)}%` : '--'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-black dark:bg-white h-full rounded-full transition-all duration-500" style={{ width: (sysStats && sysStats.disk.total > 0) ? `${(sysStats.disk.used / sysStats.disk.total) * 100}%` : '0%' }}></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 font-medium">
             {sysStats ? `${formatBytes(sysStats.disk.available)} free` : 'Loading...'}
          </div>
        </div>
        )}

        {visibleStats.claude && (
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
        )}

      </div>

        </main>
      )}

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-white/90 dark:bg-black/90 backdrop-blur-3xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50"
            style={{ zoom: zoomLevel } as React.CSSProperties}
          >
            <motion.img 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              src="/fluxbox_icon.png" 
              alt="FluxBox Icon" 
              className="w-24 h-24 rounded-[2rem] shadow-2xl mb-6 border border-gray-200 dark:border-neutral-800" 
            />
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-black dark:text-white mb-2"
            >
              FluxBox
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 dark:text-gray-400 text-center text-sm max-w-[280px] mb-8 leading-relaxed"
            >
              Your professional command center. Market tickers, system stats, unit conversion and quick actions, just a shortcut away.
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col w-full gap-4 max-w-[280px]"
            >
              <input 
                type="email" 
                value={onboardingEmail}
                onChange={(e) => setOnboardingEmail(e.target.value)}
                placeholder="Email for future updates (optional)"
                className="w-full bg-gray-100/80 dark:bg-neutral-900/80 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-neutral-600 transition-colors placeholder:text-gray-400"
              />
              <button 
                onClick={async () => {
                  console.log("---- ONBOARDING SUBMIT CLICKED ----");
                  console.log("1. Email captured:", onboardingEmail);
                  
                  // Save email to Cloudflare Worker
                  if (onboardingEmail.trim().length > 0) {
                    try {
                      // Tell users in your open source repo to set their own worker URL in .env
                      const apiUrl = import.meta.env.VITE_API_URL;
                      console.log("2. VITE_API_URL loaded from .env:", apiUrl);
                      
                      if (apiUrl) {
                        console.log("3. Firing fetch request to:", apiUrl);
                        fetch(apiUrl, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ email: onboardingEmail.trim() })
                        })
                        .then(res => {
                          console.log("4. Fetch completed! Status:", res.status);
                          return res.text();
                        })
                        .then(text => console.log("5. Worker Response Body:", text))
                        .catch(err => console.error("Worker fetch error caught by catch block:", err));
                      } else {
                        console.error("ERROR: No VITE_API_URL found. Did you add it to .env?");
                      }
                    } catch (e) {
                      console.error("Failed to subscribe (synchronous error):", e);
                    }
                  } else {
                    console.log("Skipping fetch - Email string was empty");
                  }

                  setShowOnboarding(false);
                  if (storeRef.current) {
                    await storeRef.current.set('has_seen_onboarding', true);
                    await storeRef.current.save();
                  }
                }}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-transform active:scale-95 text-sm"
              >
                Start using FluxBox
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
