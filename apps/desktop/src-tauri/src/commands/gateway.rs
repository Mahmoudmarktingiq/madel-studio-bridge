use serde_json::{json, Value};
use super::invoke_bridge_op;

#[tauri::command]
pub async fn get_gateway_status() -> Result<Value, String> {
    match invoke_bridge_op("get_gateway_status", None) {
        Ok(data) => Ok(data),
        Err(err) => {
            // Graceful disconnected state with clear diagnostic reason
            Ok(json!({
                "state": "DISCONNECTED",
                "reason": format!("Bridge IPC unavailable: {}", err),
                "daemon": {
                    "isAlive": false,
                    "namedPipe": "\\\\.\\pipe\\brainferno-mcp-bridge",
                    "handshakePath": "C:\\Users\\asus\\.brainferno-mcp-bridge\\bridge.json"
                },
                "metrics": {
                    "activeRequests": 0,
                    "pendingRequests": 0,
                    "completedRequests": 0,
                    "failedRequests": 0,
                    "cancelledRequests": 0,
                    "timeoutRequests": 0,
                    "averageQueueWaitMs": 0,
                    "averageExecutionMs": 0,
                    "resourceQueueDepths": {}
                },
                "serverVersion": "0.4.0",
                "timestamp": chrono_timestamp()
            }))
        }
    }
}

fn chrono_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{}.000Z", now.as_secs())
}
