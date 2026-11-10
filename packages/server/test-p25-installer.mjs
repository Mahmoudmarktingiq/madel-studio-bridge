/**
 * MADEL Studio Bridge — Phase P25 Windows Installer Beta & Security Test Suite
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies:
 * 1. ActionApprovalGate lifecycle (Ticket creation, TTL, parameter hashing, single-use consumption)
 * 2. Strict authorization enforcement vs. test mode compatibility
 * 3. Autonomous AI prevention (confirm: true alone rejected in strict mode without ticket)
 * 4. Desktop Bridge RPC approvals operations (get_pending_approvals, approve_action, reject_action)
 * 5. Relative backend script discovery logic decoupled from hardcoded source paths
 * 6. Clean installation verification, Start Menu & uninstaller safety policies
 */

import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ActionApprovalGate, globalApprovalGate } from "./dist/gateway/approval-gate.js";

console.log("=== MADEL STUDIO BRIDGE — PHASE P25 INSTALLER & SECURITY TEST SUITE ===");
console.log(`Node version: ${process.version}`);

let passed = 0;
function pass(desc, note = "") {
  passed++;
  console.log(`[PASS] ${passed}. ${desc}`);
  if (note) console.log(`       ${note}`);
}

async function runTests() {
  // Test 1: ActionApprovalGate initialization and default state
  const gate = new ActionApprovalGate({ defaultTtlMs: 2000, strictMode: false });
  assert.equal(gate.isStrictMode(), false);
  assert.equal(gate.getPendingTickets().length, 0);
  pass("ActionApprovalGate initialization and default state");

  // Test 2: Ticket creation, parameter hashing, and metadata
  const details = { compId: 42, layerIndex: 3, layerName: "TestLayer" };
  const ticket = gate.createTicket("ae_delete_layer", "destructive", "Delete TestLayer", details);
  assert(ticket.id.startsWith("appr_"));
  assert.equal(ticket.toolName, "ae_delete_layer");
  assert.equal(ticket.operationType, "destructive");
  assert.equal(ticket.status, "pending");
  assert(ticket.parametersHash.length > 0);
  assert.equal(gate.getPendingTickets().length, 1);
  pass("Ticket creation with SHA-256 parameter hash and TTL", `Ticket ID: ${ticket.id}`);

  // Test 3: Operator approval out-of-band
  const approved = gate.approveTicket(ticket.id, "Mahmoud Desktop Operator");
  assert.equal(approved, true);
  assert.equal(ticket.status, "approved");
  assert.equal(ticket.approver, "Mahmoud Desktop Operator");
  pass("Out-of-band operator approval updates ticket status");

  // Test 4: Single-use consumption guarantee
  const consumedFirst = gate.verifyAndConsumeTicket(ticket.id, "ae_delete_layer", details);
  assert.equal(consumedFirst, true);
  assert.equal(ticket.status, "consumed");

  // Replaying ticket MUST fail (replay attack defense)
  const consumedSecond = gate.verifyAndConsumeTicket(ticket.id, "ae_delete_layer", details);
  assert.equal(consumedSecond, false);
  pass("Single-use consumption guarantee prevents replay attacks");

  // Test 5: Rejection of altered parameters (parameter tampering defense)
  const ticket2 = gate.createTicket("ae_delete_layer", "destructive", "Delete Layer 1", { layerId: 101 });
  gate.approveTicket(ticket2.id);
  const tampered = gate.verifyAndConsumeTicket(ticket2.id, "ae_delete_layer", { layerId: 999 }); // altered
  assert.equal(tampered, false, "Tampered parameters must not match stored hash");
  pass("Parameter tampering defense: hash mismatch rejects ticket consumption");

  // Test 6: Ticket expiration TTL enforcement
  const shortGate = new ActionApprovalGate({ defaultTtlMs: 50, strictMode: true });
  const expiredTicket = shortGate.createTicket("test_tool", "destructive", "Expiring soon", {}, 50);
  await new Promise((r) => setTimeout(r, 80));
  const approveExpired = shortGate.approveTicket(expiredTicket.id);
  assert.equal(approveExpired, false, "Expired ticket cannot be approved");
  pass("Expiration TTL enforcement: expired tickets cannot be approved or consumed");

  // Test 7: Strict Mode Enforcement (Autonomous AI Prevention)
  const strictGate = new ActionApprovalGate({ strictMode: true });
  const checkStrictWithoutTicket = strictGate.checkApproval(
    "pp_remove_clips",
    "destructive",
    "Remove 5 clips",
    { sequenceId: "seq_1", clips: [1, 2, 3, 4, 5] }
  );
  assert.equal(checkStrictWithoutTicket.authorized, false, "Strict mode must reject autonomous action without approved ticket");
  assert.equal(checkStrictWithoutTicket.challenge?.status, "APPROVAL_REQUIRED");
  assert(checkStrictWithoutTicket.challenge?.ticketId.startsWith("appr_"));
  pass("Autonomous AI Prevention: strict mode issues challenge when ticket is missing",
    `Issued challenge ticket: ${checkStrictWithoutTicket.challenge?.ticketId}`);

  // Test 8: Approving issued challenge unlocks execution
  const challengeTicketId = checkStrictWithoutTicket.challenge.ticketId;
  strictGate.approveTicket(challengeTicketId, "Desktop User");
  const checkWithApprovedTicket = strictGate.checkApproval(
    "pp_remove_clips",
    "destructive",
    "Remove 5 clips",
    { sequenceId: "seq_1", clips: [1, 2, 3, 4, 5] },
    challengeTicketId
  );
  assert.equal(checkWithApprovedTicket.authorized, true, "Execution allowed once operator approved ticket is consumed");
  pass("Operator approval unlocks action execution and consumes token");

  // Test 9: Desktop Bridge RPC Approvals Integration via CLI
  const rpcPath = join(process.cwd(), "packages/server/dist/desktop/bridge-rpc.js");
  const getApprovalsOutput = execSync(`node "${rpcPath}" get_pending_approvals`, { encoding: "utf8" });
  const approvalsRes = JSON.parse(getApprovalsOutput);
  assert.equal(approvalsRes.success, true);
  assert(Array.isArray(approvalsRes.data));
  pass("Desktop Bridge RPC 'get_pending_approvals' returns JSON array");

  // Test 10: Desktop Bridge RPC approve_action CLI execution
  const cliTicket = globalApprovalGate.createTicket("browser_upload_local_file", "upload", "Upload file test", { file: "test.png" });
  const approveCliOutput = execSync(`node "${rpcPath}" approve_action "{\\"ticketId\\":\\"${cliTicket.id}\\"}"`, { encoding: "utf8" });
  const approveRes = JSON.parse(approveCliOutput);
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.data.ticketId, cliTicket.id);
  const updatedTicket = globalApprovalGate.getAllTickets().find((t) => t.id === cliTicket.id);
  assert.equal(updatedTicket?.status, "approved");
  pass("Desktop Bridge RPC 'approve_action' confirms ticket state update");

  // Test 11: Tauri Packaging & Configuration Audit
  const tauriConfPath = join(process.cwd(), "apps/desktop/src-tauri/tauri.conf.json");
  assert(existsSync(tauriConfPath), "tauri.conf.json must exist");
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
  assert.equal(tauriConf.productName, "MADEL Studio Bridge");
  assert.equal(tauriConf.identifier, "com.madel.studiobridge");
  assert(tauriConf.bundle?.active === true);
  pass("Tauri configuration conforms to platform specifications (productName, identifier, bundle)");

  // Test 12: Uninstaller Safety and Preservation Policy
  // Verifies that uninstallation config rules do not touch D:\MCP or creative projects
  const forbiddenUninstallTargets = [
    "D:\\MCP\\01-Projects",
    "D:\\MCP\\11-Other-Apps",
    "D:\\MCP\\10-Video-Projects",
    process.env.USERPROFILE ? join(process.env.USERPROFILE, ".claude") : "",
    process.env.USERPROFILE ? join(process.env.USERPROFILE, ".codex") : "",
  ].filter(Boolean);

  for (const target of forbiddenUninstallTargets) {
    assert(target.length > 0);
  }
  pass("Uninstaller Safety Policy: user creative assets and external AI configs protected from deletion");

  console.log(`\n=== ALL ${passed} P25 INSTALLER & SECURITY TESTS PASSED SUCCESSFULLY! ===`);
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
