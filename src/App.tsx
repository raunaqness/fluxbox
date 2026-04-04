import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [amount, setAmount] = useState<string>("100");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when window appears
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <main className="flex-1 flex flex-col w-full h-full bg-base-900/40 backdrop-blur-xl rounded-xl border border-border shadow-2xl overflow-hidden">
      <header className="px-5 py-4 border-b border-border bg-base-800/80 flex items-center gap-3">
        <span className="text-2xl font-semibold text-gray-400">MYR</span>
        <input
          ref={inputRef}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="flex-1 bg-transparent text-4xl font-light text-white outline-none placeholder:text-gray-600 w-full"
          autoFocus
        />
        <span className="text-xl text-gray-500">💰</span>
      </header>
      <section className="flex-1 p-5 overflow-y-auto">
        {/* Placeholder for Target Currencies */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-2">Target Currencies</p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-base-700/50 hover:bg-base-700 transition">
            <span className="text-xl font-medium text-white">USD</span>
            <span className="text-2xl text-gray-300">--</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-base-700/50 hover:bg-base-700 transition">
            <span className="text-xl font-medium text-white">SGD</span>
            <span className="text-2xl text-gray-300">--</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
