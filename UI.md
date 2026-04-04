# UI Design Specification

This document serves as the source of truth for the visual aesthetics and structural layout of the application.

## 1. Overall Aesthetic
- **Color Palette:** Strictly monochrome. Only pure black, white, and varying shades of gray are allowed to ensure an ultra-clean UI.
- **Background:** The main application window uses a blurred, semi-transparent background (macOS vibrancy `UnderWindowBackground`), blended with a translucent pure dark base.
- **Typography:** Clean sans-serif fonts natively blending with the OS (Inter, system-ui).

## 2. Layout Paradigm
The application interface is structured as a vertical list of distinct horizontal "boxes". 
- Each box encapsulates a specific feature or set of data.
- Boxes can be "big or small" depending on the feature's importance, but uniformly adhere to the general rounded-geometry.

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
