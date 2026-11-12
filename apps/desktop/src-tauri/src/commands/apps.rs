use serde_json::Value;
use super::invoke_bridge_op;

#[tauri::command]
pub async fn get_applications_status() -> Result<Value, String> {
    invoke_bridge_op("get_applications_status", None)
}

#[tauri::command]
pub async fn stop_browser_sessions() -> Result<Value, String> {
    invoke_bridge_op("stop_browser_sessions", None)
}
