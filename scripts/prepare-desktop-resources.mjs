/**
 * MADEL Studio Bridge — Desktop Bundle Resource Preparer
 * Developed and maintained by Mahmoud Adel
 *
 * Prepares standalone backend resources for the Tauri Desktop installer,
 * ensuring the installed application does not depend on source development paths.
 */

import { cpSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const serverDist = join(rootDir, "packages", "server", "dist");
const serverPkg = join(rootDir, "packages", "server", "package.json");
const targetServerDir = join(rootDir, "apps", "desktop", "src-tauri", "resources", "server");

console.log("[madel-bundle] Preparing desktop bundle resources...");

if (!existsSync(serverDist)) {
  console.error("[madel-bundle] ERROR: Server dist does not exist. Run 'npm run build' first.");
  process.exit(1);
}

// Clean and recreate target directory
rmSync(targetServerDir, { recursive: true, force: true });
mkdirSync(targetServerDir, { recursive: true });

// Copy dist
const targetDist = join(targetServerDir, "dist");
cpSync(serverDist, targetDist, { recursive: true });
console.log(`[madel-bundle] Copied compiled backend to: ${targetDist}`);

// Copy package.json for version reading
if (existsSync(serverPkg)) {
  copyFileSync(serverPkg, join(targetServerDir, "package.json"));
  console.log(`[madel-bundle] Copied server package.json to: ${targetServerDir}`);
}

console.log("[madel-bundle] Resource preparation completed successfully.");
