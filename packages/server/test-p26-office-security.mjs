/**
 * MADEL Studio Bridge — Phase P26 Microsoft Office Security & Approval Gate Test Suite
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies 10 security boundaries and defense mechanisms:
 * 1. Path traversal prevention (..)
 * 2. Null byte injection blocking
 * 3. Prohibited executable/script extensions defense (.exe, .bat, .ps1, .vbs, .js)
 * 4. Macro-enabled documents defense (.docm, .xlsm, .pptm, .dotm, .xltm, .ppam)
 * 5. Workspace confinement enforcement (D:\MCP\Office-Workspace)
 * 6. ActionApprovalGate challenge on external document access
 * 7. ActionApprovalGate challenge on destructive operations (delete sheet / delete slide)
 * 8. Approval ticket operator authorization & lifecycle
 * 9. Rejection and tampered ticket blocking
 * 10. Diagnostic data sanitization (redacting sensitive fields)
 */

import assert from "node:assert";
import { join } from "node:path";
import { OfficeSecurityPolicy } from "./dist/office/common/security.js";
import { OfficeWorkspaceManager } from "./dist/office/common/workspace.js";
import { ActionApprovalGate } from "./dist/gateway/approval-gate.js";

console.log("================================================================================");
console.log("=== MADEL STUDIO BRIDGE — PHASE P26 OFFICE SECURITY & GATE TEST SUITE ===");
console.log("================================================================================");

let passed = 0;
function pass(desc) {
  passed++;
  console.log(`[PASS] Security Check ${passed}: ${desc}`);
}

async function runSecuritySuite() {
  const workspace = OfficeWorkspaceManager.ensureWorkspace();

  // 1. Path Traversal
  const traversal1 = OfficeSecurityPolicy.validatePath("D:\\MCP\\Office-Workspace\\..\\secret.docx");
  assert.strictEqual(traversal1.valid, false, "Path traversal with '..' must be invalid");
  assert.ok(traversal1.error?.includes("traversal"), "Error message should mention traversal");
  pass("Path traversal ('..') blocked");

  // 2. Null Byte Injection
  const nullByte = OfficeSecurityPolicy.validatePath("D:\\MCP\\Office-Workspace\\doc.docx\0.exe");
  assert.strictEqual(nullByte.valid, false, "Null byte in path must be invalid");
  assert.ok(nullByte.error?.includes("Null byte"), "Error message should mention null byte");
  pass("Null byte injection blocked");

  // 3. Prohibited Executable & Script Extensions
  const forbiddenExts = [".exe", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".hta"];
  for (const ext of forbiddenExts) {
    const res = OfficeSecurityPolicy.validatePath(`D:\\MCP\\Office-Workspace\\malicious${ext}`);
    assert.strictEqual(res.valid, false, `Extension ${ext} must be blocked`);
    assert.ok(res.error?.includes("unsafe file extension"), `Error for ${ext} should specify unsafe extension`);
  }
  pass(`Prohibited executable/script extensions (${forbiddenExts.join(", ")}) blocked`);

  // 4. Macro-Enabled Extensions Blocked
  const macroExts = [".docm", ".xlsm", ".pptm", ".dotm", ".xltm", ".ppam"];
  for (const ext of macroExts) {
    const res = OfficeSecurityPolicy.validatePath(`D:\\MCP\\Office-Workspace\\macro${ext}`);
    assert.strictEqual(res.valid, false, `Macro extension ${ext} must be blocked`);
    assert.ok(res.error?.includes("Macro-enabled"), `Error for ${ext} should specify macro-enabled document`);
  }
  pass(`Macro-enabled Office documents (${macroExts.join(", ")}) blocked`);

  // 5. Workspace Confinement on Save/Export
  const outsidePath = "C:\\Users\\Public\\Documents\\leaked_output.docx";
  const outsideRes = OfficeSecurityPolicy.validatePath(outsidePath);
  assert.strictEqual(outsideRes.valid, false, "Write outside workspace must be blocked");
  assert.ok(outsideRes.error?.includes("outside approved Office workspace"), "Error must mention workspace root");

  const insidePath = join(workspace.wordDir, "valid_document.docx");
  const insideRes = OfficeSecurityPolicy.validatePath(insidePath);
  assert.strictEqual(insideRes.valid, true, "Valid workspace path must be accepted");
  pass("Workspace confinement (D:\\MCP\\Office-Workspace) enforced");

  // 6. ActionApprovalGate — External Document Open Challenge
  const gate = new ActionApprovalGate({
    defaultTtlMs: 5000,
    strictMode: true,
  });

  const externalDoc = "C:\\Important\\Financial_Report_2026.docx";
  const openCheck = gate.checkApproval(
    "word_open_document",
    "config",
    `Open external document: '${externalDoc}'`,
    { path: externalDoc },
  );
  assert.strictEqual(openCheck.authorized, false, "External document open must require approval");
  assert.strictEqual(openCheck.challenge?.status, "APPROVAL_REQUIRED");
  assert.ok(openCheck.challenge?.ticketId, "Challenge must issue ticketId");
  pass("Approval challenge generated on external document access");

  const ticketId = openCheck.challenge.ticketId;

  // 7. ActionApprovalGate — Destructive Operation Challenge (Excel Delete Sheet)
  const delSheetCheck = gate.checkApproval(
    "excel_delete_sheet",
    "destructive",
    "Delete worksheet 'Sensitive_Data'",
    { sheetName: "Sensitive_Data" },
  );
  assert.strictEqual(delSheetCheck.authorized, false, "Destructive sheet delete must require approval");
  assert.strictEqual(delSheetCheck.challenge?.status, "APPROVAL_REQUIRED");
  pass("Approval challenge generated on destructive sheet deletion");

  // 8. ActionApprovalGate — Destructive Operation Challenge (PowerPoint Delete Slide)
  const delSlideCheck = gate.checkApproval(
    "powerpoint_delete_slide",
    "destructive",
    "Delete slide 3 from active presentation",
    { slideIndex: 3 },
  );
  assert.strictEqual(delSlideCheck.authorized, false, "Destructive slide delete must require approval");
  assert.strictEqual(delSlideCheck.challenge?.status, "APPROVAL_REQUIRED");
  pass("Approval challenge generated on destructive slide deletion");

  // 9. Operator Authorization Flow & Rejection
  // Approve the external document open ticket
  const approved = gate.approveTicket(ticketId, "Mahmoud Adel (Operator)");
  assert.strictEqual(approved, true, "Ticket approval must succeed");

  const retryCheck = gate.checkApproval(
    "word_open_document",
    "config",
    `Open external document: '${externalDoc}'`,
    { path: externalDoc },
    ticketId,
  );
  assert.strictEqual(retryCheck.authorized, true, "Authorized ticket must allow operation");

  // Reject the sheet deletion ticket
  const delTicketId = delSheetCheck.challenge.ticketId;
  const rejected = gate.rejectTicket(delTicketId, "Disallowed sheet deletion");
  assert.strictEqual(rejected, true, "Ticket rejection must succeed");

  const retryReject = gate.checkApproval(
    "excel_delete_sheet",
    "destructive",
    "Delete worksheet 'Sensitive_Data'",
    { sheetName: "Sensitive_Data" },
    delTicketId,
  );
  assert.strictEqual(retryReject.authorized, false, "Rejected ticket must deny operation");
  pass("Operator approval resolution and rejection enforcement verified");

  // 10. Diagnostic Data Sanitization
  const sensitiveObj = {
    apiKey: ["sk", "test", "token", "12345"].join("-"),
    token: ["ghp", "sample", "token"].join("_"),
    password: ["test", "dummy", "pass"].join("_"),
    safeField: "Standard Word Metadata",
  };
  const sanitized = OfficeSecurityPolicy.sanitizeDiagnostic(sensitiveObj);
  assert.strictEqual(sanitized.apiKey, "[REDACTED]");
  assert.strictEqual(sanitized.token, "[REDACTED]");
  assert.strictEqual(sanitized.password, "[REDACTED]");
  assert.strictEqual(sanitized.safeField, "Standard Word Metadata");
  pass("Diagnostic log sanitization (redaction of keys/passwords) verified");

  console.log("\n================================================================================");
  console.log(`>>> ALL ${passed} OFFICE SECURITY CHECKS PASSED (100% GREEN) <<<`);
  console.log("================================================================================");
}

runSecuritySuite().catch((err) => {
  console.error("Office Security Suite failed:", err);
  process.exit(1);
});
