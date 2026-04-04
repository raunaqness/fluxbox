use std::sync::Mutex;
use sysinfo::{System, Disks};

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

use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SysState {
            sys: Mutex::new(System::new_all()),
            disks: Mutex::new(Disks::new_with_refreshed_list()),
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
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

            // Setup the System Tray / Menu Bar Icon
            use tauri::tray::{TrayIconBuilder, TrayIconEvent};
            
            let icon = app.default_window_icon().cloned().expect("failed to find default window icon");
            
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("Menu Bar App")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                })
                .build(app)?;

            use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
            use std::str::FromStr;
            use tauri_plugin_global_shortcut::Shortcut;

            let shortcut = Shortcut::from_str("Alt+Space").unwrap();
            app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
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
            }).unwrap();

            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(focused) = event {
                    if !focused {
                        window_clone.hide().unwrap();
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
