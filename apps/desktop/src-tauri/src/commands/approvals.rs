/**
 * MADEL Studio Bridge — Desktop Tauri IPC Commands for Action Approvals
 * Developed and maintained by Mahmoud Adel
 */

use crate::commands::invoke_bridge_op;
use serde_json::{json, Value};
use tauri::command;

#[command]
pub async fn get_pending_approvals() -> Result<Value, String> {
    invoke_bridge_op("get_pending_approvals", None)
}

#[command]
pub async fn approve_action(ticket_id: String) -> Result<Value, String> {
    invoke_bridge_op("approve_action", Some(json!({ "ticketId": ticket_id })))
}

#[command]
pub async fn reject_action(ticket_id: String, reason: Option<String>) -> Result<Value, String> {
    invoke_bridge_op(
        "reject_action",
        Some(json!({ "ticketId": ticket_id, "reason": reason })),
    )
}
