pub mod apps;
pub mod clients;
pub mod diagnostics;
pub mod gateway;
pub mod servers;

use serde_json::Value;
use std::path::PathBuf;
use std::process::Command;

/// Resolves the absolute path to bridge-rpc.js with graceful multi-location fallback
pub fn find_bridge_rpc_script() -> Option<PathBuf> {
    if let Ok(env_path) = std::env::var("MADEL_BRIDGE_PATH") {
        let p = PathBuf::from(env_path);
        if p.exists() {
            return Some(p);
        }
    }

    let candidates = [
        "D:\\MCP\\01-Projects\\Source\\MADEL-Studio-Bridge\\packages\\server\\dist\\desktop\\bridge-rpc.js",
        "..\\..\\packages\\server\\dist\\desktop\\bridge-rpc.js",
        "..\\packages\\server\\dist\\desktop\\bridge-rpc.js",
        "packages\\server\\dist\\desktop\\bridge-rpc.js",
    ];

    for candidate in &candidates {
        let p = PathBuf::from(candidate);
        if p.exists() {
            return Some(p);
        }
    }

    None
}

/// Executes a verified MADEL Bridge RPC operation using Node.js without shell invocation
pub fn invoke_bridge_op(op: &str, payload: Option<Value>) -> Result<Value, String> {
    let script_path = find_bridge_rpc_script().ok_or_else(|| {
        "MADEL Bridge RPC script not found at expected location. Ensure 'npm run build' has completed.".to_string()
    })?;

    let mut cmd = Command::new("node");
    cmd.arg(&script_path).arg(op);

    if let Some(data) = payload {
        let json_str = serde_json::to_string(&data).map_err(|e| e.to_string())?;
        cmd.arg(json_str);
    }

    let output = cmd.output().map_err(|e| format!("Failed to spawn Node process: {}", e))?;

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    if stdout_str.trim().is_empty() {
        let stderr_str = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Bridge returned empty output. Stderr: {}", stderr_str));
    }

    let json_val: Value = serde_json::from_str(&stdout_str)
        .map_err(|e| format!("Invalid JSON response from bridge: {}. Raw: {}", e, stdout_str))?;

    if json_val.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
        Ok(json_val.get("data").cloned().unwrap_or(Value::Null))
    } else {
        let err_msg = json_val
            .get("error")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown bridge error");
        Err(err_msg.to_string())
    }
}
