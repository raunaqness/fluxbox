# UI Design Specification

This document serves as the source of truth for the visual aesthetics and structural layout of the application.

## 1. Overall Aesthetic
- **Color Palette:** Strictly monochrome. Only pure black, white, and varying shades of gray are allowed to ensure an ultra-clean UI.
- **Theming:** The application supports both Light and Dark themes, with **Light Theme as the default**. A toggle at the top right header controls the mode.
- **Background:** The main application window uses a blurred, semi-transparent background (macOS vibrancy `UnderWindowBackground`), blended with translucent pure light or dark bases.
- **Typography:** Clean sans-serif fonts natively blending with the OS (Inter, system-ui).

## 2. Layout Paradigm
The application interface is structured as a vertical list of distinct horizontal "boxes". 
- Each box encapsulates a specific feature or set of data.
- Boxes can be "big or small" depending on the feature's importance, but uniformly adhere to the general rounded-geometry.
- **Row Reordering:** A small vertical "Grip" icon (⠿) must sit to the left of each vertical text label. This signifies that the user can eventually drag-and-drop the rows to change the vertical stack order.
- **Window Movement:** A 16x16 pixel "Grippy" or "Handle" icon sits at the extreme top-left corner of the window. This entire region is tagged with `data-tauri-drag-region` to allow the user to click-and-drag the borderless glass window.

## 3. Specific Component Breakdowns

### 3.1 Currency Converter Box (The "Top Box")
The first horizontal element should be dedicated to currency conversion, architected in a single continuous row:

*   **Left Section (Source):** 
    *   A toggle button for selecting the base currency.
    *   Sitting flush beside it, a large text input for entering the numeric amount.
    *   *Alignment Rule:* The text inside this input must be explicitly **right-aligned**.
*   **Right Section (Targets):** 
    *   A dynamically generated row of smaller sub-boxes/text areas displaying the currencies selected for conversion (e.g., `USD: 21.00`, `INR: 1780.00`).
*   **Extreme Right Section (Controls):** 
    *   A `+` button securely pinned to the right edge.
    *   Clicking triggers the ability to add more target currencies to the row (Hard maximum: 5 currencies).

### 3.2 OS Integration (Recents & Pinning)
A dedicated horizontal row for displaying "Recent Items" (Files or Apps).
*   **Icon-First Design:** Each item should be represented by its high-resolution native macOS icon (PDF, PNG, App, etc.)
*   **Overlay Actions:** Upon hover, a small **Pin Icon (📌)** should appear.
*   **Pin State:** If an item is "pinned," its background should have a subtle darker/lighter gray fill (theme dependent) to visually indicate its permanent status.
*   **Interaction:** Clicking the box triggers the `tauri-plugin-opener` to launch the file or app.

### 3.3 Market Ticker (Stocks & Crypto)
A dedicated horizontal row for displaying live prices of stocks and cryptocurrencies.
*   **Card Design:** Each ticker is displayed as a compact card showing: **Symbol** (bold), **Price** (formatted), and **24h Change %** (green ▲ for positive, red ▼ for negative).
*   **Scrollable List:** Tickers scroll horizontally within the row. Right-click or hover-X to remove a ticker.
*   **Add Tickers:** A `+` button on the right opens a searchable dropdown with popular stocks and crypto. Max 8 tickers.
*   **Data Sources:** Crypto prices from CoinGecko (free, no API key). Stock prices fetched via Rust backend from Yahoo Finance (avoids CORS).
*   **Polling:** Prices refresh every 60 seconds automatically.
