# FluxBox: Roadmap & Tasks

## Stage 1: Setup & Environment
*   [x] Install Rust/Node dependencies.
*   [x] `npx tauri init` (React + TypeScript).
*   [x] Configure `tauri.conf.json` for floating window transparency and vibrancy.
*   [x] Setup Tailwind CSS with a dark-mode-first aesthetic.

## Stage 2: The "Summon" Mechanic
*   [x] Implement `tauri-plugin-global-shortcut` for **Opt + Space**.
*   [x] Script logic to toggling window focus/visibility.
*   [x] Implement "Hide on Blur" (window closes when you click away).

## Stage 3: Currency Converter (The "Top Box")
*   [x] Redesign currency input to match horizontal box layout (Left: Toggle+Input, Right: Targets, Extreme Right: + Button).
*   [x] Integrate `open.er-api.com` (free real-time alternative).
*   [x] Implement base currency settings (Store in JSON).
*   [x] Add real-time calculation logic.

## Stage 4: Hardware Monitor (The "Bottom" UI)
*   [x] Create a horizontal widget bar at the bottom of the window.
*   [x] Rust side: Use `sysinfo` to pull Disk, RAM, and Swap data.
*   [x] Frontend side: Create sleek progress bars or percentage labels for stats.

## Stage 5: Claude & External Integration
*   [x] Build an "Auth/Settings" view hidden behind a gear icon.
*   [x] Integrate Anthropic API headers for usage tracking.
*   [x] Setup World Clocks using `Intl.DateTimeFormat`.


## Stage 6: Polish
*   [x] Add `framer-motion` animations (Initial implementation complete).
*   [x] Custom scrollbar styling.
*   [x] High-resolution App Icon creation (Standard square).

## Stage 7: Advanced Interaction & Core Features
*   [x] **Currency Dropdown**: Replace the `window.prompt` with a custom React dropdown/select menu to change the base currency.
*   [x] **Dynamic Target List**: Implement the actual logic for the `+` button in the currency row to add/remove and persist up to 5 target currencies.
*   [x] **World Clock Management**: Add a `+` button to the Time/Weather row to allow users to add additional world clocks or locations.
*   [x] **Weather Visuals**: Integrate condition-based styling (e.g., Yellow icons/text for sunny, Blue/Raindrops for raining) using a weather API (OpenWeatherMap).

## Stage 8: UI Consistency & Refinement
*   [x] **Row Reordering Handles**: Add a "Grip" (⠿) handle to the extreme left of each vertical label as a visual affordance for drag-and-drop.
*   [x] **Window Drag Handle**: Implement a dedicated handle (✥) for window movement via `getCurrentWindow().startDragging()`.
*   [x] **Consistent Row Widths**: Perfectly aligned grid look for all boxes.

## Stage 9: OS Integration & Recents
*   [x] **Recent Items**: Displays PDF, images, documents accessed recently via `mdfind`.
*   [x] **Recents Manager**: Row for tracking recently launched apps and files in FluxBox.
*   [x] **Pinning Logic**: Visual 📌 toggle to keep items permanently visible.
*   [x] **File/App Invocation**: One-click to open files or launch apps via `tauri-plugin-opener`.

## Parked & Known Issues
- [x] 🔴 **Menu Bar Click Bug**: When clicking the icon on the Mac menu bar, the window shows and immediately disappears. *Fix: Ignored `MouseDown` events and only bound logic to the `MouseUp` release in Tauri v2 `TrayIconEvent`.*
- [x] 🔴 **Currency Dropdown Z-Index Bug** *(Priority)*: The dropdown menu (e.g., source currency selector for MYR) is hidden behind other rows of data. Likely a `z-index` or `overflow: hidden` issue on parent containers — the dropdown needs to render above sibling rows.
- [ ] **Window Size Persistence**: Revisit manual implementation to fix inconsistent behavior on macOS borderless windows. 
- [ ] **Centering Logic**: Investigate why `window.center()` does not always align perfectly in the screen center.
- [x] **Icon Border Radius**: fix icon, it should be a square with radius, similar to other macos icons. Dont create a new icon, just add a border radius to the existing one.
- [x] **Dock Visibility**: when using the app, the icon should not show up in the dock, just the mac menu bar.
- [ ] **Brevo Email Capture**: Link `raunaqness.com` to Cloudflare and bind the mailer Worker to a custom subdomain (e.g. `api.raunaqness.com`) to bypass Cisco Umbrella blocks.

## Stage 10: UX Enhancements & Bug Fixes
- [x] **Full Currency Names**: Show full currency name alongside code in dropdowns and badges (e.g., "INR — Indian Rupee").
- [x] **Dropdown Search**: Add a search/filter input to all dropdown menus (Currency selector, Target currency, World Clock).
- [x] 🔴 **Fix File Launch**: Clicking a file in the "Recent Files" row doesn't open it — switched to Rust `open` command.
- [x] 🔴 **Fix App Launch**: Clicking an app in the "Recent Apps" row doesn't open it — same fix via Rust `open` command.
- [x] **App Icons**: Display the actual macOS app icon next to each app name in the Recent Apps row.
- [x] **File Type Icons**: Show file-type-aware icons (PDF, PNG, etc.) in Recent Files; fallback to a generic icon for uncommon types.
- [x] **Rename "Clocks" → "Cities"**: Update the vertical label and all references from "Clocks" to "Cities".
- [x] **Stats Bar Visibility Settings**: Add a section in Settings to toggle visibility of individual stats bar widgets (RAM, Swap, Disk, Claude).

## Stage 11: Live Market Ticker (Stocks & Crypto)
- [x] **Watchlist State**: Add `watchlist` array to store with default tickers (BTC, ETH, AAPL, MSFT).
- [x] **CoinGecko Integration**: Fetch crypto prices from CoinGecko free API (no key required), poll every 60s.
- [x] **Yahoo Finance Integration**: Fetch stock prices via Rust backend (avoids CORS), poll every 60s.
- [x] **Ticker Row UI**: New draggable row with horizontal scrollable ticker cards showing symbol, price, and 24h % change (green/red).
- [x] **Add/Remove Tickers**: Searchable dropdown with `+` button to add stocks or crypto. Right-click or hover-X to remove.
- [x] **Persist Watchlist**: Save/load watchlist from `tauri-plugin-store`.

## Stage 12: Onboarding & App Info
- [x] 🔴 **UI Zoom Scaling**: Implement ability to Zoom in/out the entire UI using **Cmd +** and **Cmd -** shortcuts for better accessibility.
- [x] **Welcome Introduction**: Create a sleek first-time intro message for new users on launch.
- [x] **Engagement & Updates**: Add a subtle "Stay Updated" field to capture user emails for future releases.
- [x] **About FluxBox Section**: Add a dedicated UI block in the app showing App Name, Version, Build Number, and a credit link to the developer.

