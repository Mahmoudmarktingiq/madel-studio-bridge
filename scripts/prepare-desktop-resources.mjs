/**
 * MADEL Studio Bridge — Desktop Bundle Resource Preparer
 * Developed and maintained by Mahmoud Adel
 *
 * Packages a standalone runtime bundle including:
 * 1. Dedicated Node.js runtime executable (resources/nodejs/node.exe)
 * 2. Compiled server backend (resources/server/dist)
 * 3. Minimal production node_modules for standalone execution
 */

import { cpSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const serverDist = join(rootDir, "packages", "server", "dist");
const serverPkg = join(rootDir, "packages", "server", "package.json");
const targetServerDir = join(rootDir, "apps", "desktop", "src-tauri", "resources", "server");
const targetNodeDir = join(rootDir, "apps", "desktop", "src-tauri", "resources", "nodejs");

console.log("[madel-bundle] Preparing standalone desktop bundle resources...");

if (!existsSync(serverDist)) {
  console.error("[madel-bundle] ERROR: Server dist does not exist. Run 'npm run build' first.");
  process.exit(1);
}

// 1. Clean and prepare target server directory
rmSync(targetServerDir, { recursive: true, force: true });
mkdirSync(targetServerDir, { recursive: true });

// Copy dist files (filtering out source maps, temporary, test, and backup files)
const targetDist = join(targetServerDir, "dist");
cpSync(serverDist, targetDist, {
  recursive: true,
  filter: (src) => {
    const base = basename(src);
    return (
      !base.endsWith(".tmp") &&
      !base.endsWith(".orig") &&
      !base.endsWith(".bak") &&
      !base.endsWith(".map") &&
      !base.startsWith("test-")
    );
  },
});
console.log(`[madel-bundle] Bundled compiled backend: ${targetDist}`);

// Copy package.json
if (existsSync(serverPkg)) {
  copyFileSync(serverPkg, join(targetServerDir, "package.json"));
}

// Copy essential production dependencies
const nodeModulesSrc = join(rootDir, "node_modules");
const targetNodeModules = join(targetServerDir, "node_modules");
mkdirSync(targetNodeModules, { recursive: true });

const essentialModules = [
  "@brainferno",
  "@modelcontextprotocol",
  "zod",
  "ws",
  "path-browserify"
];

for (const mod of essentialModules) {
  const modSrc = join(nodeModulesSrc, mod);
  if (existsSync(modSrc)) {
    cpSync(modSrc, join(targetNodeModules, mod), {
      recursive: true,
      filter: (src) => {
        const base = basename(src).toLowerCase();
        return (
          base !== "test" &&
          base !== "tests" &&
          base !== "__tests__" &&
          base !== ".github" &&
          base !== "docs" &&
          !base.endsWith(".map") &&
          !base.endsWith(".ts") &&
          !base.endsWith(".orig") &&
          !base.endsWith(".tmp")
        );
      },
    });
    console.log(`[madel-bundle] Bundled module: ${mod}`);
  }
}

// 2. Package standalone Node.js binary
mkdirSync(targetNodeDir, { recursive: true });
const targetNodeExe = join(targetNodeDir, "node.exe");

// Locate local Node.js binary
const hostNodeCandidates = [
  process.execPath,
  "C:\\Program Files\\nodejs\\node.exe",
  process.env.MADEL_NODE_PATH
].filter(Boolean);

let foundNode = false;
for (const cand of hostNodeCandidates) {
  if (existsSync(cand)) {
    copyFileSync(cand, targetNodeExe);
    console.log(`[madel-bundle] Bundled standalone Node.js runtime from: ${cand}`);
    foundNode = true;
    break;
  }
}

if (!foundNode) {
  console.warn("[madel-bundle] WARNING: Could not find host node.exe to bundle into resources.");
}

console.log("[madel-bundle] Standalone resource preparation completed successfully.");
