pub mod commands;
pub mod tray;

use tauri::WindowEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Setup Windows System Tray
            if let Err(e) = tray::setup_tray(app.handle()) {
                eprintln!("[madel-desktop] Failed to initialize system tray: {}", e);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Intercept window close to minimize to system tray instead of stopping MCP background servers
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::gateway::get_gateway_status,
            commands::apps::get_applications_status,
            commands::clients::get_clients_status,
            commands::clients::inspect_client,
            commands::clients::plan_client_connect,
            commands::clients::apply_client_connect,
            commands::clients::plan_client_disconnect,
            commands::clients::apply_client_disconnect,
            commands::clients::restore_client,
            commands::servers::get_servers_status,
            commands::servers::get_activity_logs,
            commands::diagnostics::get_system_diagnostics,
            commands::approvals::get_pending_approvals,
            commands::approvals::approve_action,
            commands::approvals::reject_action,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MADEL Studio Bridge desktop application");
}
