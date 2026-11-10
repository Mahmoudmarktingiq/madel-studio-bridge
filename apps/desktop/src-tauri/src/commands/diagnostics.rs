use serde_json::Value;
use super::invoke_bridge_op;

#[tauri::command]
pub async fn get_system_diagnostics() -> Result<Value, String> {
    invoke_bridge_op("get_system_diagnostics", None)
}
