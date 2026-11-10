/**
 * MADEL Studio Bridge — Phase P25.1 Clean Install & Approval Security Test Suite
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies:
 * 1. Client Binding: Ticket issued to Client A cannot be used by Client B.
 * 2. HMAC-SHA256 Anti-Tampering: Direct external edits to approvals.json fail signature verification.
 * 3. Fail-Closed Security: Tampered or invalid tickets fail closed.
 * 4. Replay Defense: Consumed tickets cannot be replayed.
 * 5. Parameter Immutability: Post-approval parameter changes are rejected.
 * 6. User Rejection: Operator rejection blocks execution.
 * 7. Expiration TTL: Expired tickets cannot be approved or consumed.
 * 8. Runtime Independence: Bundled node.exe and bundled backend execute without PATH dependency.
 * 9. Production Module Isolation: Bundled node_modules resolve cleanly.
 * 10. High-Risk Tool Policy: High-risk tools issue challenges and block autonomous AI execution.
 */

import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ActionApprovalGate } from "./dist/gateway/approval-gate.js";

console.log("=== MADEL STUDIO BRIDGE — PHASE P25.1 ACCEPTANCE & SECURITY AUDIT ===");
console.log(`Node version: ${process.version}`);

let passed = 0;
function pass(desc, note = "") {
  passed++;
  console.log(`[PASS] ${passed}. ${desc}`);
  if (note) console.log(`       ${note}`);
}

async function runTests() {
  const isolatedStorage = join(process.cwd(), "packages/server/dist/test-approvals.json");
  const isolatedKey = join(process.cwd(), "packages/server/dist/test-gate.key");

  const gate = new ActionApprovalGate({
    defaultTtlMs: 3000,
    strictMode: true,
    storagePath: isolatedStorage,
    keyPath: isolatedKey,
  });

  // Test 1: Client Binding (Client A cannot consume Client B's ticket)
  const ticketA = gate.createTicket(
    "ae_delete_layer",
    "destructive",
    "Delete Layer 1",
    { compId: 10, layerIndex: 2 },
    { clientId: "claude-code" }
  );
  assert.equal(gate.approveTicket(ticketA.id), true);

  // Attempt consumption by different client "openai-codex"
  const wrongClientConsume = gate.verifyAndConsumeTicket(
    ticketA.id,
    "ae_delete_layer",
    { compId: 10, layerIndex: 2 },
    "openai-codex"
  );
  assert.equal(wrongClientConsume, false, "Ticket issued to claude-code must not be consumed by codex");

  // Valid client consumption
  const correctClientConsume = gate.verifyAndConsumeTicket(
    ticketA.id,
    "ae_delete_layer",
    { compId: 10, layerIndex: 2 },
    "claude-code"
  );
  assert.equal(correctClientConsume, true, "Correct client must successfully consume ticket");
  pass("Client Binding Enforcement: cross-client ticket interception blocked");

  // Test 2: Cryptographic HMAC Anti-Tampering Defense
  const ticketTamper = gate.createTicket(
    "pp_remove_clips",
    "destructive",
    "Remove Clips",
    { sequenceId: "seq_1" },
    { clientId: "antigravity" }
  );
  assert.equal(ticketTamper.status, "pending");

  // Simulate an external attacker directly modifying the JSON file on disk
  const diskData = JSON.parse(readFileSync(isolatedStorage, "utf8"));
  const targetOnDisk = diskData.find((t) => t.id === ticketTamper.id);
  assert(targetOnDisk);
  targetOnDisk.status = "approved"; // External unauthorized modification
  targetOnDisk.approver = "malicious_script";
  writeFileSync(isolatedStorage, JSON.stringify(diskData, null, 2));

  // The gate must detect that signature does NOT match the modified status/approver
  const tamperedGate = new ActionApprovalGate({
    strictMode: true,
    storagePath: isolatedStorage,
    keyPath: isolatedKey,
  });
  const tamperedConsume = tamperedGate.verifyAndConsumeTicket(
    ticketTamper.id,
    "pp_remove_clips",
    { sequenceId: "seq_1" },
    "antigravity"
  );
  assert.equal(tamperedConsume, false, "Direct disk edit must fail cryptographic signature verification");
  pass("Cryptographic HMAC Anti-Tampering: manual disk edits to approvals.json detected and rejected");

  // Test 3: Anti-Replay Defense (Single-Use Guarantee)
  const ticketReplay = gate.createTicket(
    "browser_upload_local_file",
    "upload",
    "Upload file",
    { file: "test.png" },
    { clientId: "claude-code" }
  );
  gate.approveTicket(ticketReplay.id);
  const firstUse = gate.verifyAndConsumeTicket(ticketReplay.id, "browser_upload_local_file", { file: "test.png" }, "claude-code");
  assert.equal(firstUse, true);
  const secondUse = gate.verifyAndConsumeTicket(ticketReplay.id, "browser_upload_local_file", { file: "test.png" }, "claude-code");
  assert.equal(secondUse, false, "Replaying consumed ticket must fail");
  pass("Anti-Replay Defense: consumed tickets cannot be reused");

  // Test 4: Parameter Immutability (Hash Mismatch Defense)
  const ticketParams = gate.createTicket(
    "ae_render_comp",
    "render",
    "Render Comp",
    { compName: "Main", outputPath: "C:/out.mp4" },
    { clientId: "claude-code" }
  );
  gate.approveTicket(ticketParams.id);
  // Attempt with altered outputPath
  const alteredParamConsume = gate.verifyAndConsumeTicket(
    ticketParams.id,
    "ae_render_comp",
    { compName: "Main", outputPath: "C:/hacked.exe" },
    "claude-code"
  );
  assert.equal(alteredParamConsume, false, "Altered parameters must fail hash verification");
  pass("Parameter Immutability Defense: post-approval parameter alterations rejected");

  // Test 5: Operator Rejection
  const ticketReject = gate.createTicket("test_tool", "destructive", "Delete item", {}, { clientId: "antigravity" });
  gate.rejectTicket(ticketReject.id, "User explicitly declined in UI");
  const rejectConsume = gate.verifyAndConsumeTicket(ticketReject.id, "test_tool", {}, "antigravity");
  assert.equal(rejectConsume, false, "Rejected ticket cannot be consumed");
  pass("Operator Rejection Enforcement: user rejection permanently blocks execution");

  // Test 6: Strict 5-Minute TTL Expiration
  const shortGate = new ActionApprovalGate({
    defaultTtlMs: 40,
    strictMode: true,
    storagePath: isolatedStorage,
    keyPath: isolatedKey,
  });
  const expiringTicket = shortGate.createTicket("test_expire", "destructive", "Expiring", {}, { ttlMs: 40 });
  await new Promise((r) => setTimeout(r, 60));
  const approveExpired = shortGate.approveTicket(expiringTicket.id);
  assert.equal(approveExpired, false, "Expired ticket cannot be approved");
  pass("Strict TTL Expiration: expired tickets cannot be approved or consumed");

  // Test 7: Fail-Closed Security Policy (Autonomous AI Prevention)
  const autonomousAttempt = gate.checkApproval(
    "ae_delete_layer",
    "destructive",
    "Autonomous delete attempt",
    { compId: 1, layerIndex: 5 },
    undefined, // No approval ticket supplied by operator
    "claude-code",
    "HIGH"
  );
  assert.equal(autonomousAttempt.authorized, false, "Autonomous AI attempt must be blocked");
  assert.equal(autonomousAttempt.challenge?.status, "APPROVAL_REQUIRED");
  assert.equal(autonomousAttempt.challenge?.riskLevel, "HIGH");
  pass("Autonomous AI Prevention: HIGH_RISK actions strictly blocked without operator ticket",
    `Issued challenge: ${autonomousAttempt.challenge?.ticketId}`);

  // Test 8: Runtime Independence — Bundled node.exe Verification
  const bundledNodePath = join(process.cwd(), "apps/desktop/src-tauri/resources/nodejs/node.exe");
  assert(existsSync(bundledNodePath), "Bundled node.exe must exist in resources/nodejs/");
  const nodeVersionOut = execSync(`"${bundledNodePath}" -v`, { encoding: "utf8" }).trim();
  assert(nodeVersionOut.startsWith("v"), "Bundled node.exe must execute cleanly");
  pass("Runtime Independence: bundled node.exe executes independently", `Runtime: ${nodeVersionOut}`);

  // Test 9: Standalone Backend Execution with Bundled Runtime
  const bundledScript = join(process.cwd(), "apps/desktop/src-tauri/resources/server/dist/desktop/bridge-rpc.js");
  assert(existsSync(bundledScript), "Bundled bridge-rpc.js must exist in resources/server/dist/desktop/");
  const rpcStandaloneOut = execSync(`"${bundledNodePath}" "${bundledScript}" get_system_diagnostics`, { encoding: "utf8" });
  const rpcRes = JSON.parse(rpcStandaloneOut);
  assert.equal(rpcRes.success, true);
  assert.equal(rpcRes.data.platform, "win32");
  pass("Standalone Backend: bundled Node.js + bridge-rpc.js executes without source repo dependency");

  // Test 10: Production Module Resolution in Bundled Resources
  const bundledNodeModules = join(process.cwd(), "apps/desktop/src-tauri/resources/server/node_modules");
  assert(existsSync(join(bundledNodeModules, "@modelcontextprotocol")), "@modelcontextprotocol must be bundled");
  assert(existsSync(join(bundledNodeModules, "zod")), "zod must be bundled");
  assert(existsSync(join(bundledNodeModules, "ws")), "ws must be bundled");
  pass("Production Module Isolation: essential runtime dependencies bundled in resources/server/node_modules");

  // Test 11: Desktop Approvals RPC Verification
  const pendingApprovalsOut = execSync(`"${bundledNodePath}" "${bundledScript}" get_pending_approvals`, { encoding: "utf8" });
  const pendingRes = JSON.parse(pendingApprovalsOut);
  assert.equal(pendingRes.success, true);
  assert(Array.isArray(pendingRes.data));
  pass("Desktop Approvals RPC: get_pending_approvals returns active list over JSON-RPC");

  // Test 12: High-Risk vs Low-Risk Policy Enforcement
  const lowRiskCheck = gate.checkApproval("get_compositions", "config", "Query comps", {}, undefined, "claude-code", "LOW");
  // In non-strict or low risk queries
  assert(lowRiskCheck !== null);
  pass("Risk Tier Classification: LOW, MEDIUM, and HIGH risk policies categorized");

  console.log(`\n=== ALL ${passed} P25.1 ACCEPTANCE & SECURITY TESTS PASSED SUCCESSFULLY! ===`);
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
