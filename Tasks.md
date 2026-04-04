# Project Roadmap & Tasks

## Stage 1: Setup & Environment
*   [x] Install Rust/Node dependencies.
*   [x] `npx tauri init` (React + TypeScript).
*   [x] Configure `tauri.conf.json` for floating window transparency and vibrancy.
*   [ ] Setup Tailwind CSS with a dark-mode-first aesthetic.

## Stage 2: The "Summon" Mechanic
*   [ ] Implement `tauri-plugin-global-shortcut` for **Opt + Space**.
*   [ ] Script logic to toggling window focus/visibility.
*   [ ] Implement "Hide on Blur" (window closes when you click away).

## Stage 3: Currency Converter (The "Top" UI)
*   [ ] Create search-bar style currency input.
*   [ ] Integrate `exchangerate-api.com` (or similar).
*   [ ] Implement base currency settings (Store in JSON).
*   [ ] Add real-time calculation logic.

## Stage 4: Hardware Monitor (The "Bottom" UI)
*   [ ] Create a horizontal widget bar at the bottom of the window.
*   [ ] Rust side: Use `sysinfo` to pull Disk, RAM, and Swap data.
*   [ ] Frontend side: Create sleek progress bars or percentage labels for stats.

## Stage 5: Claude & External Integration
*   [ ] Build an "Auth/Settings" view hidden behind a gear icon.
*   [ ] Integrate Anthropic API headers for usage tracking.
*   [ ] Setup World Clocks using `Intl.DateTimeFormat`.
*   [ ] (Optional) Add OpenWeatherMap API for weather icons.

## Stage 6: Polish
*   [ ] Add `framer-motion` animations for window opening.
*   [ ] Custom scrollbar styling.
*   [ ] High-resolution App Icon creation.
