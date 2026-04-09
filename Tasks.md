# FluxBox — Tasks & Roadmap

> Active work only. Completed items live in [Changelog.md](./Changelog.md).

---

## 🔴 Immediate Bug Fixes

*No active critical bugs. See [Changelog.md](./Changelog.md) for fixed issues.*

---

## 🟡 Backlog / Parked

| Status | Issue | Notes |
|---|---|---|
| ⏳ | Custom Shortcut Key | Rebind summon shortcut from Settings; needs reliable key capture + Rust re-registration |
| ⏳ | Window Size Persistence | Inconsistent behavior on macOS borderless windows |
| ⏳ | Centering Logic | `window.center()` doesn't always align perfectly |
| ⏳ | Watchlist not persisting in dev mode | Tried: empty initial state, seed defaults in `initStore`, `autoSave: 300ms`. Issue likely `tauri-plugin-store` + Vite HMR interaction or store file being re-created on each `tauri dev` cold start. Needs deeper investigation. |



---

## Stage 16: Timezone & City Overhaul  🔴 HIGH PRIORITY

Currently the "Cities" row is limited. This stage expands it to support **every city in the world** in a searchable picker, and uses the selected city's IANA timezone for accurate clock/weather display.

### Architecture Plan

```
[City Search Input]
        ↓ fuzzy search across ~40 000 cities (client-side JSON)
[City Selected] → derive IANA timezone (e.g. "Asia/Taipei")
        ↓
[Clock Display]  → Intl.DateTimeFormat with IANA zone
[Weather Display] → Open-Meteo lookup using city lat/lon
```

### Data Source

| Item | Decision |
|---|---|
| City list | Bundle a static JSON derived from the **GeoNames** cities1000.txt (~40 000 cities, ~2 MB minified) or use the lighter `cities-with-timezone` npm package (~130 KB) |
| Fields per city | `name`, `country`, `timezone` (IANA), `lat`, `lon` |
| Search | Client-side fuzzy search via `fuse.js`; search by city name or country |
| Timezone conversion | `Intl.DateTimeFormat` with the city's IANA timezone — no extra library needed |
| Weather | Existing Open-Meteo integration; pass city `lat`/`lon` instead of hardcoded coords |

### Sub-tasks

| Status | Task | Notes |
|---|---|---|
| ⏳ | Integrate city dataset | Add `cities-with-timezone` (or equivalent) as a bundled JSON asset; keep bundle impact < 250 KB gzipped |
| ⏳ | Searchable city picker | Replace current city dropdown with a type-to-search input; show city + country in results |
| ⏳ | Derive IANA timezone from city | Each city entry already carries an IANA zone string; pass to `Intl.DateTimeFormat` |
| ⏳ | Update clock display | Use resolved IANA zone for live time display |
| ⏳ | Update weather fetch | Use city `lat`/`lon` from dataset for Open-Meteo API call |
| ⏳ | Persist selected cities | Continue to use `tauri-plugin-store`; store city object `{name, country, timezone, lat, lon}` |
| ⏳ | Remove/re-add cities in edit mode | Hook into Edit Mode (Stage 17) for add/remove UX |

---

## Stage 17: Edit Mode — Locked UI by Default  🔴 HIGH PRIORITY

The drag-and-drop reorder handles and red-cross remove buttons are always visible. This stage locks the UI into a **view-only** state by default, with a dedicated **Edit** toggle.

### UX Flow

```
[Normal Mode]
  → No drag handles visible
  → No remove (×) buttons visible
  → Rows are static / not reorderable

[Edit Mode] (triggered by "Edit" button in header/toolbar)
  → "Done" button appears next to "Edit" (which becomes greyed / disabled)
  → Drag handles (⠿) become visible on all rows
  → Remove (×) buttons appear on removable rows
  → "+ Add Row" affordance visible to insert new rows
  → All changes are held in local state (not yet persisted)

[Done clicked]
  → Entire row order + visibility config serialised to tauri-plugin-store
  → UI returns to Normal Mode
  → "Edit" button re-enabled
```

### Sub-tasks

| Status | Task | Notes |
|---|---|---|
| ⏳ | Add `isEditMode` global state | React context or Zustand atom; default `false` |
| ⏳ | Edit / Done button in header bar | Sits in the top toolbar alongside the settings gear |
| ⏳ | Conditionally render drag handles | `PointerSensor` / grip icon only when `isEditMode === true` |
| ⏳ | Conditionally render remove buttons | Red-cross (×) only when `isEditMode === true` |
| ⏳ | "+ Add Row" panel in edit mode | Show list of available (hidden) row types the user can re-enable |
| ⏳ | Persist full layout on "Done" | Serialise `{rowOrder: string[], hiddenRows: string[]}` to store key `layout_config` |
| ⏳ | Restore layout on app start | Read `layout_config` from store on mount; apply order + visibility before first render |
| ⏳ | Keyboard shortcut to exit edit mode | `Escape` key triggers "Done" while in edit mode |
