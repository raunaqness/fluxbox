# Product Requirements Document (PRD): FluxBox

## 1. Project Overview
**Goal:** Build a lightweight, high-performance macOS productivity utility that lives in the background and is summoned via a global shortcut (Opt+Space). It provides quick access to currency conversion, system monitoring, and world times/weather in a "floating" Raycast-like interface.

## 2. Target Features

### 2.1 Currency Converter
*   **Layout Design:** The app UI should feel like a list of distinct horizontal boxes (big and small).
*   **Base Currency (Left):** A toggle for selecting the source currency, right next to a numeric text input for the amount (the input text should be right-aligned).
*   **Target Currencies (Right):** In the exact same row/box, display text boxes showing the converted values for the selected target currencies (e.g., INR, USD).
*   **Controls (Extreme Right):** A `+` button allowing users to add more currencies to the row (maximum of 5 currencies).
*   **Real-time updates:** Conversion should update automatically on typing or currency change.

### 2.2 System Monitoring (The "Stats Box")
*   **Disk Usage:** Display total vs. free space for the main drive.
*   **RAM Usage:** Percentage of memory consumed.
*   **Swap Usage:** Amount of swap memory currently in use.
*   **Claude Token Usage:** Integrate with the Anthropic API to track current billing/token consumption (requires user authentication).

### 2.3 World Times & Weather
*   **Location Management:** Users can add/remove major world locations.
*   **Real-time Clocks:** Accurate current time for each selected city.
*   **Weather Data (Optional):** Current temperature and sky conditions (e.g., Johor, New Delhi, Singapore).

## 3. User Interface (Aesthetics)
*   **Raycast Look & Feel:** A centered, floating window with a slightly transparent, blurred background (vibrancy).
*   **Global Access:** The app should not appear in the Dock (LSUIElement = true). It is summoned via a hotkey and dismissed on focus loss (blur).
*   **Typography:** Clean, sans-serif font (Inter or system UI font).

## 4. Technical Requirements
*   **Framework:** Tauri (Rust Backend + React/Tailwind Frontend).
*   **OS:** Primarily macOS optimization (vibrancy support).
*   **Performance:** Less than 50MB RAM usage and near-instant "wake" time.
*   **Persistence:** Configuration (Base currency, locations, API keys) must be saved locally.

## 5. Security & Auth
*   **API Keys:** Antrhopic/Weather API keys should be stored safely in the macOS Keychain or a secure local configuration.
*   **No Central Server:** All data stays on the user's machine.
