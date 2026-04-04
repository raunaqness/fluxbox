import "./App.css";

function App() {
  return (
    <main className="flex-1 flex flex-col w-full h-full bg-base-900/40 backdrop-blur-xl rounded-xl border border-border shadow-2xl overflow-hidden">
      <header className="px-4 py-3 border-b border-border bg-base-800/50">
        <h1 className="text-xl font-medium tracking-tight text-white">Menu Bar App</h1>
      </header>
      <section className="flex-1 p-4 flex flex-col items-center justify-center">
        <p className="text-lg text-gray-300">Summon to begin...</p>
      </section>
    </main>
  );
}

export default App;
