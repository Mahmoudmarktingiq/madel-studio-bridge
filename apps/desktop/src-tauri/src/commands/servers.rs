use serde_json::Value;
use super::invoke_bridge_op;

#[tauri::command]
pub async fn get_servers_status() -> Result<Value, String> {
    invoke_bridge_op("get_servers_status", None)
}

#[tauri::command]
pub async fn get_activity_logs() -> Result<Value, String> {
    invoke_bridge_op("get_activity_logs", None)
}
