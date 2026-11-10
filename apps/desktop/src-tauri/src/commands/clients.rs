use serde_json::{json, Value};
use super::invoke_bridge_op;

#[tauri::command]
pub async fn get_clients_status() -> Result<Value, String> {
    invoke_bridge_op("get_clients_status", None)
}

#[tauri::command]
pub async fn inspect_client(client_key: String) -> Result<Value, String> {
    invoke_bridge_op("inspect_client", Some(json!({ "clientKey": client_key })))
}

#[tauri::command]
pub async fn plan_client_connect(client_key: String, bridge_config: Option<Value>) -> Result<Value, String> {
    invoke_bridge_op("plan_connect", Some(json!({
        "clientKey": client_key,
        "bridgeConfig": bridge_config
    })))
}

#[tauri::command]
pub async fn apply_client_connect(client_key: String, bridge_config: Option<Value>) -> Result<Value, String> {
    invoke_bridge_op("apply_connect", Some(json!({
        "clientKey": client_key,
        "bridgeConfig": bridge_config
    })))
}

#[tauri::command]
pub async fn plan_client_disconnect(client_key: String) -> Result<Value, String> {
    invoke_bridge_op("plan_disconnect", Some(json!({ "clientKey": client_key })))
}

#[tauri::command]
pub async fn apply_client_disconnect(client_key: String) -> Result<Value, String> {
    invoke_bridge_op("apply_disconnect", Some(json!({ "clientKey": client_key })))
}

#[tauri::command]
pub async fn restore_client(client_key: String, backup_path: Option<String>) -> Result<Value, String> {
    invoke_bridge_op("restore_client", Some(json!({
        "clientKey": client_key,
        "backupPath": backup_path
    })))
}
