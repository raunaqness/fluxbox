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
