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


