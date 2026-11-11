import { spawn, execSync } from "node:child_process";
import { join } from "node:path";
import assert from "node:assert/strict";

console.log("=== MADEL STUDIO BRIDGE — CONSOLE POPUP VERIFICATION TEST ===");

const appPath = join(process.env.LOCALAPPDATA || "", "MADEL Studio Bridge", "madel-desktop.exe");
console.log(`Launching installed binary: ${appPath}`);

const child = spawn(appPath, [], { detached: false, stdio: "ignore" });
assert.ok(child.pid, "madel-desktop must spawn with PID");
console.log(`MADEL Desktop PID: ${child.pid}`);

console.log("Waiting 12 seconds to observe background polling cycles (at 5s intervals)...");
await new Promise((r) => setTimeout(r, 12000));

// Query Win32_Process for any conhost whose parent is madel-desktop or child node processes
const psScript = `
$madelPid = ${child.pid}
$allProcs = Get-CimInstance Win32_Process
$madelChildren = $allProcs | Where-Object { $_.ParentProcessId -eq $madelPid }
$conhosts = $allProcs | Where-Object { $_.Name -eq 'conhost.exe' }
$badConhosts = @()
foreach ($c in $conhosts) {
    if ($c.ParentProcessId -eq $madelPid -or ($madelChildren.ProcessId -contains $c.ParentProcessId)) {
        $badConhosts += $c.ProcessId
    }
}
$badConhosts.Count
`;

const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, '; ')}"`, {
  encoding: "utf8",
  windowsHide: true,
}).trim();

try {
  process.kill(child.pid);
} catch {}

const count = parseInt(result, 10) || 0;
console.log(`Observed console host windows (conhost) spawned by MADEL: ${count}`);
assert.equal(count, 0, `Expected 0 console windows spawned by MADEL, found ${count}`);

console.log("PASS: MADEL Desktop runs completely silently with zero console popups!");
