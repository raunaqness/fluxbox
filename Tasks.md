# FluxBox — Tasks & Roadmap

> Active work only. Completed items live in [Changelog.md](./Changelog.md).

---

## 🔴 Immediate Bug Fixes

| Status | Bug | Root Cause | Fix |
|---|---|---|---|
| ⏳ | Watchlist resets to defaults on every restart | Race condition: `storeLoaded` is in the save `useEffect` dependency array — when it flips to `true`, the effect fires before React has applied the `setWatchlist(storedWatchlist)` update, so the hardcoded defaults get written back over the saved list | 1. Change initial `watchlist` state to `[]` (empty). 2. Move defaults into the store load block as a fallback (`else` branch). 3. Remove `storeLoaded` from the save effect's dependency array — it should only be a guard, not a trigger. |

---

## 🟡 Backlog / Parked

| Status | Issue | Notes |
|---|---|---|
| ⏳ | Custom Shortcut Key | Rebind summon shortcut from Settings; needs reliable key capture + Rust re-registration |
| ⏳ | Window Size Persistence | Inconsistent behavior on macOS borderless windows |
| ⏳ | Centering Logic | `window.center()` doesn't always align perfectly |

---

## Stage 14: Currency Completeness  🔴 HIGH PRIORITY

| Status | Task | Notes |
|---|---|---|
| ⏳ | Add all major world currencies | Include TWD (Taiwan Dollar) and all other ISO 4217 major currencies currently missing — target ~150+ currencies |
| ⏳ | Validate against `open.er-api.com` supported codes | Only surface codes the free-tier API actually returns rates for to avoid broken conversions |
| ⏳ | Keep searchable dropdown sorted | Alphabetical by currency code; existing search filter handles discoverability |

---

## Stage 15: General Unit Converter  🔴 HIGH PRIORITY

A new row that lets the user pick **any measurement type** on the left, enter a value, and dynamically add N conversion targets on the right. Incompatible unit pairs (e.g. cm → kg) show **NA**.

### Sub-tasks

| Status | Task | Notes |
|---|---|---|
| ⏳ | Define unit category map | Categories: Length, Mass, Temperature, Volume, Area, Speed, Time, Data, Energy, Pressure |
| ⏳ | Build conversion engine | Pure-JS lookup table with base-unit normalisation; cross-category = `NA` |
| ⏳ | Left-side panel — source picker | Dropdown to select category + unit; numeric input for value |
| ⏳ | Right-side panel — dynamic target list | `+` button to add target unit rows (any unit from *any* category); `×` to remove; shows converted value or `NA` |
| ⏳ | Real-time update | Any change to source value or unit immediately recalculates all right-side rows |
| ⏳ | Persist config | Save selected source unit + right-side target list to `tauri-plugin-store` |
| ⏳ | Row label | Add "Convert" row label consistent with other rows |

### Supported Unit Categories (initial scope)

| Category | Example Units |
|---|---|
| Length | mm, cm, m, km, in, ft, yd, mi |
| Mass / Weight | mg, g, kg, t, oz, lb |
| Temperature | °C, °F, K |
| Volume | ml, L, fl oz, cup, pt, qt, gal |
| Area | cm², m², km², in², ft², acre |
| Speed | m/s, km/h, mph, knot |
| Time | ms, s, min, h, day, week |
| Data | B, KB, MB, GB, TB |
| Energy | J, kJ, cal, kcal, kWh |
| Pressure | Pa, kPa, bar, psi, atm |

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
