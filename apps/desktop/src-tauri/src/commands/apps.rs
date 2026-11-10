use serde_json::Value;
use super::invoke_bridge_op;

#[tauri::command]
pub async fn get_applications_status() -> Result<Value, String> {
    invoke_bridge_op("get_applications_status", None)
}
