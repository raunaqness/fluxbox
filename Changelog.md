# FluxBox — Changelog

> All completed work. Active tasks live in [Tasks.md](./Tasks.md).

---

## Stage 1: Setup & Environment ✅

| Task |
|---|
| Install Rust/Node dependencies |
| `npx tauri init` (React + TypeScript) |
| Configure `tauri.conf.json` for floating window transparency and vibrancy |
| Setup Tailwind CSS with a dark-mode-first aesthetic |

---

## Stage 2: Summon Mechanic ✅

| Task |
|---|
| Implement `tauri-plugin-global-shortcut` for **⌥ Space** |
| Toggle window focus/visibility on shortcut press |
| Hide on Blur — window hides when clicking away |

---

## Stage 3: Currency Converter ✅

| Task |
|---|
| Redesign currency input to horizontal box layout |
| Integrate `open.er-api.com` for real-time exchange rates |
| Persist base currency selection via store |
| Real-time conversion calculation logic |

---

## Stage 4: Hardware Monitor ✅

| Task |
|---|
| Horizontal widget bar at the bottom of the window |
| Rust: Pull Disk, RAM, and Swap data via `sysinfo` |
| Frontend: Sleek progress bars / percentage labels |

---

## Stage 5: Claude & External Integrations ✅

| Task |
|---|
| Settings view behind a gear icon |
| Anthropic API key integration for usage tracking |
| World Clocks via `Intl.DateTimeFormat` |

---

## Stage 6: Polish ✅

| Task |
|---|
| `framer-motion` animations |
| Custom scrollbar styling |
| High-resolution app icon (rounded square) |

---

## Stage 7: Advanced Interaction & Core Features ✅

| Task |
|---|
| Currency Dropdown — custom React selector to change base currency |
| Dynamic Target List — `+` button to add/remove up to 5 target currencies |
| World Clock Management — add/remove locations |
| Weather Visuals — condition-based icons via Open-Meteo WMO codes |

---

## Stage 8: UI Consistency & Refinement ✅

| Task |
|---|
| Row Reordering Handles — grip (⠿) on each row label |
| Window Drag Handle — dedicated ✥ handle via `startDragging()` |
| Consistent Row Widths — perfectly aligned grid |

---

## Stage 9: OS Integration & Recents ✅

| Task |
|---|
| Recent Items — PDFs, images, documents via `mdfind` |
| Recents Manager — recently launched apps and files |
| Pinning Logic — 📌 toggle to keep items permanently visible |
| File/App Invocation — one-click open via Rust `open` command |

---

## Stage 10: Telemetry, Analytics & Misc Polish ✅

| Task | Notes |
|---|---|
| Install Aptabase | `tauri-plugin-aptabase` + `@aptabase/tauri` |
| `app_started` event | Fires on cold launch |
| Daily Active User (DAU) tracking | `daily_active` event via `visibilitychange`; gated by in-memory `lastActiveDateRef` |
| Dashboard key configuration | `VITE_APTABASE_APP_KEY` in `.env` + GitHub Secret; baked in at compile time via `build.rs` |
| GitHub Actions integration | Key injected in `release.yml` env block |
| Open-source safety | Key absent → plugin not registered → zero telemetry |
| Full currency names | e.g. "INR — Indian Rupee" in dropdowns |
| Dropdown search | Filter input on all dropdowns (Currency, Cities, Ticker) |
| Fix File Launch | Switched to Rust `open` command |
| Fix App Launch | Same fix via Rust `open` command |
| App Icons | Real macOS app icon in Recent Apps row |
| File Type Icons | Type-aware icons in Recent Files (PDF, PNG, etc.) |
| Rename "Clocks" → "Cities" | Updated label and all references |
| Stats Bar Visibility Settings | Per-widget toggles in Settings (RAM, Swap, Disk, Claude) |

---

## Stage 11: Live Market Ticker (Stocks & Crypto) ✅

| Task | Notes |
|---|---|
| Watchlist state | Default tickers: BTC, ETH, AAPL, MSFT |
| CoinGecko integration | Free API, no key required, polls every 60s |
| Yahoo Finance integration | Fetched via Rust backend to avoid CORS |
| Ticker Row UI | Horizontal scrollable cards with price + 24h % change |
| Add/Remove Tickers | Searchable dropdown + right-click to remove |
| Persist Watchlist | Saved via `tauri-plugin-store` |

---

## Stage 12: Onboarding & App Info ✅

| Task |
|---|
| UI Zoom Scaling — **⌘+** / **⌘−** to zoom the entire UI |
| Welcome Introduction — first-launch onboarding overlay |
| Engagement & Updates — email capture for future releases |
| About FluxBox — app name, version, and developer credit |

---

## Stage 13: Menu Bar & Settings Polish ✅

| Task | Notes |
|---|---|
| Tray Context Menu | Left-click → native menu: **Open FluxBox (⌥ Space)** + **Quit** |
| Open at Login | Toggle in Settings → `tauri-plugin-autostart` with macOS `LaunchAgent` |
| Settings Header — App Info | Icon + dynamic version (`getVersion()`) + **by Raunaq** link |

---

## Fixed Bugs ✅

| Issue | Notes |
|---|---|
| Menu Bar Click Bug | Fixed: bound to `MouseUp` only in `TrayIconEvent` |
| Currency Dropdown Z-Index | Fixed: dropdown renders above sibling rows |
| Icon Border Radius | Rounded square icon matching macOS style |
| Dock Visibility | App icon hidden from Dock via `ActivationPolicy::Accessory` |
| Brevo Email Capture | Cloudflare + custom `api.raunaqness.com` subdomain |
| Watchlist Resets on Restart | Fixed race condition: empty initial state + defaults seeded in `initStore()` fallback + removed `storeLoaded` from save effect dep array |

---

## Stage 14: Currency Completeness ✅

| Task | Notes |
|---|---|
| Added 170+ ISO 4217 currencies | `CURRENCY_NAMES` map expanded from ~45 → 170+ entries, sorted alphabetically by code. Includes TWD, all African, Middle Eastern, Central Asian, Pacific currencies. |
| Full-text search across all currencies | Both base and target dropdowns show top-20 popular currencies when idle; when typing, search fans out to all 170+ codes (by code or full name) |
| Popular currencies updated | Quick-pick defaults updated to top-20 globally traded: USD, EUR, GBP, JPY, CNY, AUD, CAD, CHF, HKD, SGD, INR, MYR, TWD, KRW, THB, AED, SAR, NZD, BRL, ZAR |

---

## Stage 15: General Unit Converter ✅

| Task | Notes |
|---|---|
| Conversion Engine | Built pure TS `units.ts` with 10 categories (Length, Mass, Temp, Volume, Area, Speed, Time, Data, Energy, Pressure). Supports Base-normalization per category (e.g. °C -> °F, °K handles offsets correctly). |
| Dynamic UI Rows | Source unit dropdown selector on left + value input. Dynamic targets list on right. |
| Incompatible Units Fallback | Detects mismatching categories (e.g. Length -> Mass) and outputs "NA". Emphasizes compatible units in target dropdown via category grouping. |
| Persisted State | Saves `converter_source`, `converter_targets`, and `converter_value` in `tauri-plugin-store`. |

---

## Stage 16: Timezone & City Overhaul ✅

| Task | Notes |
|---|---|
| City Dataset | Integrated `city-timezones` and `fuse.js` to search over 40,000 cities instantly without external network calls. |
| Smart Dropdown | Retained Top-10 Quick Picks when idle (`POPULAR_LOCATIONS`); automatically switches to full-text fuzzy-search across all global cities when user types in the search box. |
| Timezone Mapping | `city-timezones` provides direct IANA timezone mapping (`loc.tz`), which we feed directly into `Intl.DateTimeFormat` for clock rendering. |
| Weather fetching logic | Automatically uses `lat`/`lng` from the `city-timezones` dataset to fetch correct Open-Meteo local weather. Mapped `weatherData` store to trigger purely via exact `tz` keys instead of city names to prevent duplication bugs. |

---

## Stage 17: Edit Mode — Locked UI by Default ✅

| Task | Notes |
|---|---|
| Edit Mode State | Introduced global `isEditMode` state (`false` by default). The UI is now fully view-only by default, preventing accidental dragging or deletions. |
| Conditional Layout | Row drag handles (⠿), inner remove buttons (X), and row-level "Add Item" (+) dropdowns are dynamically rendered and accessible only in Edit mode. |
| Global Row Management | Added an "X" button to the top-right of every row wrapper allowing entire rows to be dismissed into a `hiddenRows` pool. |
| Restore Layout | A dynamic `Hidden Rows` panel automatically appears at the bottom during Edit mode, rendering "+ Add" chips for any dismissed rows to be restored to the `rowOrder`. |
| Persistence Rules | Adjusted the `useEffect` auto-save logic to only serialise `row_order` and `hidden_rows` when explicitly exiting edit mode (e.g., clicking "Done" or pressing `Escape`). |
