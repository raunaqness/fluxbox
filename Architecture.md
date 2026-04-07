# System Architecture: FluxBox

> [!IMPORTANT]
> This document is the **Source of Truth** for the project. It connects all sub-specifications and architectural decisions.

## 1. Documentation Index (The Legend)
- **Product Requirements:** [PRD.md](file:///Users/raunaq/Desktop/dev/mac-menu-bar-app/PRD.md) - Features, goals, and constraints.
- **Data Schema:** [Schema.md](file:///Users/raunaq/Desktop/dev/mac-menu-bar-app/Schema.md) - Storage format and extensibility for JSON/DB.
- **Application Flow:** [Flow.md](file:///Users/raunaq/Desktop/dev/mac-menu-bar-app/Flow.md) - Sequence diagrams and logic triggers.
- **UI Specification:** [UI.md](file:///Users/raunaq/Desktop/dev/mac-menu-bar-app/UI.md) - Source of truth for aesthetic and structure.
- **Roadmap:** [Tasks.md](file:///Users/raunaq/Desktop/dev/mac-menu-bar-app/Tasks.md) - Implementation stages and progress.

## 2. Overview
The application consists of a **Tauri (Rust)** backend for system-level integrations and a **React (TypeScript)** frontend for the user interface. 

## 3. Component Diagram
```mermaid
graph TD
    A[Global Shortcut Opt+Space] --> B[Tauri Backend]
    B --> C[Tauri Window Manager]
    C --> D[Front-end React UI]
    
    subgraph "Tauri Backend (Rust)"
        B --> E[sysinfo: RAM/Disk/Swap]
        B --> F[Config Manager: JSON/Store]
        B --> G[Network: reqwest]
        B --> O[Yahoo Finance Proxy]
    end
    
    subgraph "Frontend (React + Tailwind)"
        D --> H[Currency Converter]
        D --> I[System Stats Bar]
        D --> J[World Time/Weather]
        D --> K[Claude Token Dashboard]
        D --> L[Recents: Files & Apps]
        D --> P[Market Ticker: Stocks & Crypto]
    end
    
    subgraph "OS Integration"
        M[mdfind: File Access]
        N[LSSharedFileList: Recent Apps]
    end
    
    B --> M
    B --> N
```

## 4. UI Layout Paradigm
The application uses a "Horizontal Box List" design pattern. Each feature (Currency, System Stats) is encapsulated within distinct horizontal rectangular components.
For instance, the Currency Box splits into:
- **Left Block:** Source currency toggle & right-aligned amount input.
- **Right Block:** Horizontal list of targeted currency text blocks.
- **End Block:** Action controls (e.g., `+` button).

## 5. Technology Stack
*   **Backend:** Rust (Tauri framework)
*   **Frontend:** React 18, Vite
*   **Styling:** Vanilla CSS + Tailwind CSS.
*   **Icons:** Lucide React.
*   **System Stats:** `sysinfo` crate.
*   **Persistence:** `tauri-plugin-store` (Config stored in Application Support).
*   **Currency Data:** open.er-api.com (free, keyless).
*   **Crypto Data:** CoinGecko API v3 (free, keyless).
*   **Stock Data:** Yahoo Finance (unofficial, fetched via Rust to avoid CORS).
*   **Analytics:** [Aptabase](https://aptabase.com) (`tauri-plugin-aptabase` + `@aptabase/tauri`) — privacy-first, anonymous telemetry. Key baked in at compile time via `option_env!("VITE_APTABASE_APP_KEY")` in `build.rs`. Disabled automatically if key is absent (safe for open-source forks).

## 5. Window Configuration
The "Raycast feel" requires specific `tauri.conf.json` settings:
- `transparent: true`, `decorations: false`, `always_on_top: true`
- `vibrancy: "under-window"` (macOS specific)
- `skip_taskbar: true`

## 6. Data Flow & Security
1.  **System Stats:** Rust emits events; React updates UI.
2.  **State Management:** `tauri-plugin-store` handles persistent state (Refer to [Schema.md](file:///Users/raunaq/Desktop/dev/mac-menu-bar-app/Schema.md)).
3.  **Security:** External API keys are stored in macOS Keychain, never in plain-text JSON.

## 7. Analytics & Telemetry
FluxBox uses **Aptabase** for anonymous, privacy-first telemetry. No personally identifiable information is ever collected.

### Events tracked
| Event | Properties | When | How |
|---|---|---|---|
| `app_started` | — | Process cold launch | Called in `initStore()` on first React render |
| `daily_active` | — | First window open per calendar day | `visibilitychange` listener; guarded by `lastActiveDateRef` (in-memory) |

### DAU implementation detail
`lastActiveDateRef` is a React `useRef<string | null>` populated once from the store during `initStore()`. On every `visibilitychange`, the handler does a **synchronous string comparison** (`lastActiveDateRef.current === today`). Only when the date differs does it fire the event, update the ref, and async-persist the new date to `tauri-plugin-store`. This means:
- Zero I/O on the hot path (window show)
- At most one store write per day
- No race conditions from rapid visibility events

### What Aptabase auto-attaches to every event
- OS name & version (e.g. `macOS 14.4`)
- App version (from `tauri.conf.json`)
- CPU architecture (`aarch64` / `x86_64`)
- Locale / region (e.g. `en-MY`)
- An ephemeral, rotating session ID (not tied to hardware)

### Open-source safety
The Aptabase key is compiled in via `option_env!("VITE_APTABASE_APP_KEY")` in `build.rs`. If the env var is absent (e.g. a community fork), the plugin is simply not registered and the app runs without any telemetry.
