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
*   [ ] (Optional) Add OpenWeatherMap API for weather icons.

## Stage 6: Polish
*   [x] Add `framer-motion` animations (Initial implementation complete).
*   [x] Custom scrollbar styling.
*   [x] High-resolution App Icon creation (Standard square).

## Stage 7: Advanced Interaction & Core Features
*   **Icon Squircle Fix**: Re-generate the icon source with a true alpha-transparent channel around a squircle mask so it doesn't appear as a square box in the Dock or App Switcher.
*   **Currency Dropdown**: Replace the `window.prompt` with a custom React dropdown/select menu to change the base currency.
*   **Dynamic Target List**: Implement the actual logic for the `+` button in the currency row to add/remove and persist up to 5 target currencies.
*   **World Clock Management**: Add a `+` button to the Time/Weather row to allow users to add additional world clocks or locations.
*   **Weather Visuals**: Integrate condition-based styling (e.g., Yellow icons/text for sunny, Blue/Raindrops for raining) using a weather API (OpenWeatherMap).

## Stage 8: UI Consistency & Refinement
*   **Consistent Row Widths**: Ensure all boxes in a horizontal row (like Clocks or Currencies) share a consistent width, matching the widest element for a perfectly aligned grid look.
*   **Drag & Drop Handle**: Add a subtle drag handle in the top-left corner using `data-tauri-drag-region` to allow moving the borderless window.
*   **Transparency & Vibrancy**: Resolve issues where transparency/vibrancy isn't applying correctly across light/dark modes (adjust CSS opacities vs. native NSVibrancy).
*   **Light Mode Aesthetic**: Update the light mode background from standard grey to a "Very Light Grey" (e.g. `neutral-50` or `gray-50`) for a cleaner, premium feel.

## Stage 9: OS Integration & Recents
*   **Recents Manager**: Implement a row to track and display recently accessed files (PDFs, images, documents).
*   **App Tracker**: Add a row to monitor and list recently launched macOS applications.
*   **Pinning Logic**: Implement a "Pin" (📌) toggle for each item (file or app) to keep it permanently visible in the list regardless of recency.
*   **File/App Invocation**: Enable clicking these items to natively open the file or launch the app using `tauri-plugin-opener`.
