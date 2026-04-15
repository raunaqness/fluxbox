use std::sync::Mutex;
use sysinfo::{Disks, System};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct UsageInfo {
    utilization: f64,
    resets_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ClaudeUsageResponse {
    five_hour: UsageInfo,
    seven_day: UsageInfo,
    seven_day_sonnet: Option<UsageInfo>,
}

#[derive(Deserialize)]
struct ClaudeOAuth {
    #[serde(rename = "accessToken")]
    access_token: String,
}

#[derive(Deserialize)]
struct ClaudeKeychainData {
    #[serde(rename = "claudeAiOauth")]
    claude_ai_oauth: ClaudeOAuth,
}

struct SysState {
    sys: Mutex<System>,
    disks: Mutex<Disks>,
}

#[tauri::command]
fn get_system_stats(state: tauri::State<'_, SysState>) -> serde_json::Value {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_memory();

    let mut disks = state.disks.lock().unwrap();
    disks.refresh(true); // Ensure disk list is updated

    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let total_swap = sys.total_swap();
    let used_swap = sys.used_swap();

    let disk = disks.list().first();
    let (total_disk, available_disk) = match disk {
        Some(d) => (d.total_space(), d.available_space()),
        None => (0, 0),
    };

    serde_json::json!({
        "ram": {
            "total": total_mem,
            "used": used_mem,
        },
        "swap": {
            "total": total_swap,
            "used": used_swap,
        },
        "disk": {
            "total": total_disk,
            "available": available_disk,
            "used": total_disk.saturating_sub(available_disk),
        }
    })
}

#[tauri::command]
fn get_recent_items() -> serde_json::Value {
    use std::process::Command;

    let fetch_recent = |query: &str, limit: usize| -> Vec<String> {
        let output = Command::new("mdfind").arg(query).output();

        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout);
            s.lines().take(limit).map(|s| s.to_string()).collect()
        } else {
            vec![]
        }
    };

    let apps = fetch_recent("kMDItemContentTypeTree == 'com.apple.application-bundle' && kMDItemLastUsedDate > $time.now(-30d)", 10);
    let files = fetch_recent("kMDItemContentTypeTree != 'com.apple.application-bundle' && kMDItemLastUsedDate > $time.now(-7d)", 15);

    serde_json::json!({
        "apps": apps,
        "files": files,
    })
}

#[tauri::command]
fn get_stock_quote(symbol: String) -> Result<serde_json::Value, String> {
    use std::process::Command;

    // Use curl to fetch from Yahoo Finance (avoids CORS, no API key needed)
    let url = format!(
        "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d&range=1d",
        symbol
    );

    let output = Command::new("curl")
        .arg("-s")
        .arg("-L")
        .arg("--max-time")
        .arg("5")
        .arg("-H")
        .arg("User-Agent: Mozilla/5.0")
        .arg(&url)
        .output()
        .map_err(|e| format!("curl failed: {}", e))?;

    if !output.status.success() {
        return Err("Yahoo Finance request failed".to_string());
    }

    let body = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value =
        serde_json::from_str(&body).map_err(|e| format!("JSON parse error: {}", e))?;

    // Extract price data from Yahoo response
    let result = &json["chart"]["result"][0];
    let meta = &result["meta"];
    let current_price = meta["regularMarketPrice"].as_f64().unwrap_or(0.0);
    let prev_close = meta["chartPreviousClose"].as_f64().unwrap_or(0.0);
    let change_pct = if prev_close > 0.0 {
        ((current_price - prev_close) / prev_close) * 100.0
    } else {
        0.0
    };

    Ok(serde_json::json!({
        "symbol": symbol,
        "price": current_price,
        "change_percent": change_pct,
    }))
}

#[tauri::command]
fn search_tickers(query: String) -> Result<serde_json::Value, String> {
    use std::process::Command;

    let url = format!(
        "https://query1.finance.yahoo.com/v1/finance/search?q={}&quotesCount=10&newsCount=0&listsCount=0",
        query
    );

    let output = Command::new("curl")
        .arg("-s")
        .arg("-L")
        .arg("--max-time")
        .arg("5")
        .arg("-H")
        .arg("User-Agent: Mozilla/5.0")
        .arg(&url)
        .output()
        .map_err(|e| format!("curl failed: {}", e))?;

    if !output.status.success() {
        return Err("Yahoo search request failed".to_string());
    }

    let body = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value =
        serde_json::from_str(&body).map_err(|e| format!("JSON parse error: {}", e))?;

    let quotes = json["quotes"].as_array();
    let mut results = Vec::new();

    if let Some(quotes) = quotes {
        for q in quotes {
            let symbol = q["symbol"].as_str().unwrap_or("").to_string();
            let name = q["shortname"]
                .as_str()
                .or_else(|| q["longname"].as_str())
                .unwrap_or("")
                .to_string();
            let quote_type = q["quoteType"].as_str().unwrap_or("").to_string();

            // Map Yahoo's quoteType to our simple type
            let ticker_type = match quote_type.as_str() {
                "CRYPTOCURRENCY" => "crypto",
                _ => "stock", // EQUITY, ETF, INDEX, MUTUALFUND all treated as stock
            };

            // For crypto, Yahoo uses symbols like BTC-USD, extract base
            let clean_symbol = if ticker_type == "crypto" {
                symbol.split('-').next().unwrap_or(&symbol).to_string()
            } else {
                symbol.clone()
            };

            // For crypto, try to derive coingecko_id from the name
            let coingecko_id = if ticker_type == "crypto" {
                name.to_lowercase().replace(" ", "-")
            } else {
                String::new()
            };

            results.push(serde_json::json!({
                "symbol": clean_symbol,
                "yahoo_symbol": symbol,
                "name": name,
                "type": ticker_type,
                "coingecko_id": coingecko_id,
            }));
        }
    }

    Ok(serde_json::json!({ "results": results }))
}

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    use std::process::Command;
    Command::new("open")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open {}: {}", path, e))?;
    Ok(())
}

#[tauri::command]
fn get_app_icon(path: String) -> Result<String, String> {
    use std::path::Path;
    use std::process::Command;

    let app_path = Path::new(&path);
    if !app_path.exists() || !path.ends_with(".app") {
        return Err("Not a valid .app bundle".to_string());
    }

    // Try to find icon via Info.plist
    let plist_path = app_path.join("Contents/Info.plist");
    let icon_name = if plist_path.exists() {
        let output = Command::new("defaults")
            .arg("read")
            .arg(plist_path.to_str().unwrap())
            .arg("CFBundleIconFile")
            .output()
            .map_err(|e| e.to_string())?;
        let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if name.is_empty() {
            "AppIcon".to_string()
        } else if name.ends_with(".icns") {
            name
        } else {
            format!("{}.icns", name)
        }
    } else {
        "AppIcon.icns".to_string()
    };

    let icns_path = app_path.join("Contents/Resources").join(&icon_name);
    if !icns_path.exists() {
        return Err(format!("Icon not found at {:?}", icns_path));
    }

    // Convert .icns to PNG using sips (built-in macOS tool)
    let tmp_png = format!(
        "/tmp/fluxbox_icon_{}.png",
        path.replace("/", "_").replace(" ", "_")
    );
    let sips_output = Command::new("sips")
        .arg("-s")
        .arg("format")
        .arg("png")
        .arg("-z")
        .arg("32")
        .arg("32")
        .arg(icns_path.to_str().unwrap())
        .arg("--out")
        .arg(&tmp_png)
        .output()
        .map_err(|e| e.to_string())?;

    if !sips_output.status.success() {
        return Err("sips conversion failed".to_string());
    }

    // Read PNG and base64 encode
    let png_data = std::fs::read(&tmp_png).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&tmp_png);

    let encoded = base64_encode(&png_data);
    Ok(format!("data:image/png;base64,{}", encoded))
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[tauri::command]
async fn fetch_claude_usage() -> Result<ClaudeUsageResponse, String> {
    // 1. Fetch token from Keychain via native macOS 'security' command.
    // This allows macOS to automatically handle the permission UI prompt.
    let output = std::process::Command::new("security")
        .arg("find-generic-password")
        .arg("-s")
        .arg("Claude Code-credentials")
        .arg("-w")
        .output()
        .map_err(|e| format!("Failed to execute security command: {}", e))?;

    if !output.status.success() {
        let err_str = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Keychain access denied or item not found. Please click 'Allow' when prompted or login to Claude CLI. ({})", err_str.trim()));
    }

    let secret = String::from_utf8_lossy(&output.stdout).trim().to_string();

    let keychain_data: ClaudeKeychainData = serde_json::from_str(&secret)
        .map_err(|e| format!("Failed to parse Keychain JSON: {}", e))?;

    let token = keychain_data.claude_ai_oauth.access_token;

    // 2. Fetch usage from Anthropic API
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.anthropic.com/api/oauth/usage")
        .header("Authorization", format!("Bearer {}", token))
        .header("anthropic-beta", "oauth-2025-04-20")
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API error ({}): {}", status, body));
    }

    let usage: ClaudeUsageResponse = response.json()
        .await
        .map_err(|e| format!("Failed to parse API response: {}", e))?;

    Ok(usage)
}

use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

// Shared flag: when true, the blur handler will not hide the window.
// Used during onboarding so the window stays visible regardless of focus events.
struct LockedOpen(std::sync::Arc<std::sync::Mutex<bool>>);

#[tauri::command]
fn lock_window_open(state: tauri::State<'_, LockedOpen>) {
    *state.0.lock().unwrap() = true;
}

#[tauri::command]
fn unlock_window_open(state: tauri::State<'_, LockedOpen>) {
    *state.0.lock().unwrap() = false;
}

#[tauri::command]
fn show_main_window(window: tauri::WebviewWindow) {
    window.show().unwrap();
    window.set_focus().unwrap();
}

#[tauri::command]
fn open_devtools(window: tauri::WebviewWindow) {
    window.open_devtools();
}

#[tauri::command]
fn set_dock_visible(app: tauri::AppHandle, visible: bool) {
    #[cfg(target_os = "macos")]
    {
        let policy = if visible {
            tauri::ActivationPolicy::Regular
        } else {
            tauri::ActivationPolicy::Accessory
        };
        let _ = app.set_activation_policy(policy);
    }
}

#[tauri::command]
fn update_shortcut(app: tauri::AppHandle, shortcut_str: String) -> Result<(), String> {
    use std::str::FromStr;
    use tauri_plugin_global_shortcut::Shortcut;
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    let manager = app.global_shortcut();
    manager.unregister_all().map_err(|e| e.to_string())?;

    let shortcut = Shortcut::from_str(&shortcut_str).map_err(|e| e.to_string())?;
    manager
        .on_shortcut(shortcut, |app, _sc, event| {
            if event.state() == ShortcutState::Pressed {
                if let Some(win) = app.get_webview_window("main") {
                    if win.is_visible().unwrap_or(false) {
                        win.hide().unwrap();
                    } else {
                        win.show().unwrap();
                        win.set_focus().unwrap();
                    }
                }
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder =
        tauri::Builder::default().plugin(tauri_plugin_window_state::Builder::new().build());

    if let Some(aptabase_key) = option_env!("VITE_APTABASE_APP_KEY") {
        if !aptabase_key.is_empty() {
            eprintln!("[FluxBox] Aptabase key found at compile time — initializing telemetry.");
            builder = builder.plugin(tauri_plugin_aptabase::Builder::new(aptabase_key).build());
        }
    } else {
        eprintln!("[FluxBox] No VITE_APTABASE_APP_KEY found at compile time — telemetry disabled.");
    }

    builder
        .manage(SysState {
            sys: Mutex::new(System::new_all()),
            disks: Mutex::new(Disks::new_with_refreshed_list()),
        })
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Regular);
            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window");

            #[cfg(target_os = "macos")]
            apply_vibrancy(
                &window,
                NSVisualEffectMaterial::UnderWindowBackground,
                None,
                Some(16.0),
            )
            .expect("Failed to apply vibrancy");

            // Shared flag: frontend sets this true during onboarding so the
            // blur handler cannot hide the window while onboarding is visible.
            use std::sync::{Arc, Mutex};
            let locked_open_arc: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
            let locked_open_for_handler = locked_open_arc.clone();
            app.manage(LockedOpen(locked_open_arc));

            // Setup the System Tray / Menu Bar Icon
            use std::time::Instant;
            use tauri::tray::TrayIconBuilder;

            let last_blur = Arc::new(Mutex::new(None::<Instant>));

            let icon = app
                .default_window_icon()
                .cloned()
                .expect("failed to find default window icon");

            use tauri::menu::{MenuBuilder, MenuItemBuilder};

            let open_item =
                MenuItemBuilder::with_id("open", "Open FluxBox  (⌥ Space)").build(app)?;
            let devtools_item =
                MenuItemBuilder::with_id("devtools", "Open DevTools").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit FluxBox").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .items(&[&open_item, &devtools_item, &quit_item])
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("FluxBox")
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(win) = app.get_webview_window("main") {
                            win.show().unwrap();
                            win.set_focus().unwrap();
                        }
                    }
                    "devtools" => {
                        if let Some(win) = app.get_webview_window("main") {
                            win.show().unwrap();
                            win.set_focus().unwrap();
                            win.open_devtools();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            use std::str::FromStr;
            use tauri_plugin_global_shortcut::Shortcut;
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

            let shortcut = Shortcut::from_str("Alt+Space").unwrap();
            app.global_shortcut()
                .on_shortcut(shortcut, |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                })
                .unwrap();

            let window_clone = window.clone();
            let last_blur_window = last_blur.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(false) = event {
                    // Don't hide while onboarding is active
                    let is_locked = *locked_open_for_handler.lock().unwrap();
                    if !is_locked {
                        window_clone.hide().unwrap();
                        *last_blur_window.lock().unwrap() = Some(Instant::now());
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_system_stats,
            get_recent_items,
            open_path,
            get_app_icon,
            get_stock_quote,
            search_tickers,
            update_shortcut,
            fetch_claude_usage,
            open_devtools,
            set_dock_visible,
            lock_window_open,
            unlock_window_open,
            show_main_window
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Reopen { has_visible_windows, .. } = event {
                if !has_visible_windows {
                    if let Some(win) = app_handle.get_webview_window("main") {
                        win.show().unwrap();
                        win.set_focus().unwrap();
                    }
                }
            }
        });
}
