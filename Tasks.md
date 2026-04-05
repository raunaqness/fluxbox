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
- [ ] **Window Size Persistence**: Revisit manual implementation to fix inconsistent behavior on macOS borderless windows. 
- [ ] **Centering Logic**: Investigate why `window.center()` does not always align perfectly in the screen center.
- [ ] **Icon Squircle Fix**: Re-generate the icon source with a true alpha-transparent channel around a squircle mask so it doesn't appear as a square box in the Dock or App Switcher.

## Next Up
1. **Currency Dropdown**: Custom React-based replacement for `window.prompt`.
2. **Dynamic Target List**: Right-click to remove / + to add persistable targets.
3. **Advanced World Clock**: Dynamic management of locations.
