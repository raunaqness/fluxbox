# Data Schema & Storage Specification

This document defines the storage structure for the application using JSON (managed by `tauri-plugin-store`).

## 1. Storage Location
- **macOS:** `~/Library/Application Support/<app-id>/config.json`

## 2. JSON Structure
The schema is designed to be flat and modular to allow for easy extension.

```json
{
  "version": "1.0.0",
  "settings": {
    "theme": "dark",
    "hotkey": "Alt+Space",
    "base_currency": "MYR",
    "target_currencies": ["USD", "INR", "SGD"],
    "locations": [
      { "id": "kl-01", "city": "Kuala Lumpur", "tz": "Asia/Kuala_Lumpur" },
      { "id": "del-01", "city": "New Delhi", "tz": "Asia/Kolkata" }
    ]
  },
  "auth": {
    "anthropic_api_key_ref": "keychain_id_01",
    "weather_api_key_ref": "keychain_id_02"
  },
  "cache": {
    "last_rates": {
      "timestamp": 1712219960,
      "rates": { "USD": 0.21, "INR": 17.5 }
    }
  }
}
```

## 3. Extensibility Guidelines
- **Versioning:** Always include a `version` field at the root.
- **Namespacing:** Add new features as top-level keys (e.g., `"pomodoro": {}`, `"reminders": []`).
- **Refs for Sensitive Data:** Never store API keys directly in the JSON. Store a reference/keychain ID and fetch the actual secret via Rust from the macOS Keychain.

## 4. Field Descriptions
| Field | Type | Description |
| :--- | :--- | :--- |
| `version` | string | Schema version for migrations. |
| `settings` | object | User-configurable application preferences. |
| `auth` | object | References to secure credentials. |
| `cache` | object | Temporarily stored external data (e.g., FX rates). |
