# FluxBox — Roadmap & Tasks

---

## Stage 1: Setup & Environment

| Status | Task |
|---|---|
| ✅ | Install Rust/Node dependencies |
| ✅ | `npx tauri init` (React + TypeScript) |
| ✅ | Configure `tauri.conf.json` for floating window transparency and vibrancy |
| ✅ | Setup Tailwind CSS with a dark-mode-first aesthetic |

---

## Stage 2: Summon Mechanic

| Status | Task |
|---|---|
| ✅ | Implement `tauri-plugin-global-shortcut` for **⌥ Space** |
| ✅ | Toggle window focus/visibility on shortcut press |
| ✅ | Hide on Blur — window hides when clicking away |

---

## Stage 3: Currency Converter

| Status | Task |
|---|---|
| ✅ | Redesign currency input to horizontal box layout |
| ✅ | Integrate `open.er-api.com` for real-time exchange rates |
| ✅ | Persist base currency selection via store |
| ✅ | Real-time conversion calculation logic |

---

## Stage 4: Hardware Monitor

| Status | Task |
|---|---|
| ✅ | Horizontal widget bar at the bottom of the window |
| ✅ | Rust: Pull Disk, RAM, and Swap data via `sysinfo` |
| ✅ | Frontend: Sleek progress bars / percentage labels |

---

## Stage 5: Claude & External Integrations

| Status | Task |
|---|---|
| ✅ | Settings view behind a gear icon |
| ✅ | Anthropic API key integration for usage tracking |
| ✅ | World Clocks via `Intl.DateTimeFormat` |

---

## Stage 6: Polish

| Status | Task |
|---|---|
| ✅ | `framer-motion` animations |
| ✅ | Custom scrollbar styling |
| ✅ | High-resolution app icon (rounded square) |

---

## Stage 7: Advanced Interaction & Core Features

| Status | Task |
|---|---|
| ✅ | Currency Dropdown — custom React selector to change base currency |
| ✅ | Dynamic Target List — `+` button to add/remove up to 5 target currencies |
| ✅ | World Clock Management — add/remove locations |
| ✅ | Weather Visuals — condition-based icons via Open-Meteo WMO codes |

---

## Stage 8: UI Consistency & Refinement

| Status | Task |
|---|---|
| ✅ | Row Reordering Handles — grip (⠿) on each row label |
| ✅ | Window Drag Handle — dedicated ✥ handle via `startDragging()` |
| ✅ | Consistent Row Widths — perfectly aligned grid |

---

## Stage 9: OS Integration & Recents

| Status | Task |
|---|---|
| ✅ | Recent Items — PDFs, images, documents via `mdfind` |
| ✅ | Recents Manager — recently launched apps and files |
| ✅ | Pinning Logic — 📌 toggle to keep items permanently visible |
| ✅ | File/App Invocation — one-click open via Rust `open` command |

---

## Stage 10: Telemetry & Analytics

| Status | Task | Notes |
|---|---|---|
| ✅ | Install Aptabase | `tauri-plugin-aptabase` + `@aptabase/tauri` |
| ✅ | `app_started` event | Fires on cold launch |
| ✅ | Daily Active User (DAU) tracking | `daily_active` event via `visibilitychange`; gated by in-memory `lastActiveDateRef` |
| ✅ | Dashboard key configuration | `VITE_APTABASE_APP_KEY` in `.env` + GitHub Secret; baked in at compile time via `build.rs` |
| ✅ | GitHub Actions integration | Key injected in `release.yml` env block |
| ✅ | Open-source safety | Key absent → plugin not registered → zero telemetry |
| ✅ | Full currency names | e.g. "INR — Indian Rupee" in dropdowns |
| ✅ | Dropdown search | Filter input on all dropdowns (Currency, Cities, Ticker) |
| ✅ | Fix File Launch | Switched to Rust `open` command |
| ✅ | Fix App Launch | Same fix via Rust `open` command |
| ✅ | App Icons | Real macOS app icon in Recent Apps row |
| ✅ | File Type Icons | Type-aware icons in Recent Files (PDF, PNG, etc.) |
| ✅ | Rename "Clocks" → "Cities" | Updated label and all references |
| ✅ | Stats Bar Visibility Settings | Per-widget toggles in Settings (RAM, Swap, Disk, Claude) |

---

## Stage 11: Live Market Ticker (Stocks & Crypto)

| Status | Task | Notes |
|---|---|---|
| ✅ | Watchlist state | Default tickers: BTC, ETH, AAPL, MSFT |
| ✅ | CoinGecko integration | Free API, no key required, polls every 60s |
| ✅ | Yahoo Finance integration | Fetched via Rust backend to avoid CORS |
| ✅ | Ticker Row UI | Horizontal scrollable cards with price + 24h % change |
| ✅ | Add/Remove Tickers | Searchable dropdown + right-click to remove |
| ✅ | Persist Watchlist | Saved via `tauri-plugin-store` |

---

## Stage 12: Onboarding & App Info

| Status | Task |
|---|---|
| ✅ | UI Zoom Scaling — **⌘+** / **⌘−** to zoom the entire UI |
| ✅ | Welcome Introduction — first-launch onboarding overlay |
| ✅ | Engagement & Updates — email capture for future releases |
| ✅ | About FluxBox — app name, version, and developer credit |

---

## Stage 13: Menu Bar & Settings Polish

| Status | Task | Notes |
|---|---|---|
| ✅ | Tray Context Menu | Left-click → native menu: **Open FluxBox (⌥ Space)** + **Quit** |
| ✅ | Open at Login | Toggle in Settings → `tauri-plugin-autostart` with macOS `LaunchAgent` |
| ✅ | Settings Header — App Info | Icon + dynamic version (`getVersion()`) + **by Raunaq** link |
| ⏳ | Custom Shortcut Key | *(Backlog)* Rebind summon shortcut from Settings; needs reliable key capture + Rust re-registration |

---

## Parked & Known Issues

| Status | Issue | Notes |
|---|---|---|
| ✅ | Menu Bar Click Bug | Fixed: bound to `MouseUp` only in `TrayIconEvent` |
| ✅ | Currency Dropdown Z-Index | Fixed: dropdown renders above sibling rows |
| ✅ | Icon Border Radius | Rounded square icon matching macOS style |
| ✅ | Dock Visibility | App icon hidden from Dock via `ActivationPolicy::Accessory` |
| ✅ | Brevo Email Capture | Cloudflare + custom `api.raunaqness.com` subdomain |
| ⏳ | Window Size Persistence | Inconsistent behavior on macOS borderless windows |
| ⏳ | Centering Logic | `window.center()` doesn't always align perfectly |
