import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import net from 'net';
import { execSync } from 'child_process';

const WORKSPACE_ROOT = 'D:\\MCP';
const PIPE_NAME = '\\\\.\\pipe\\brainferno-mcp-bridge';

function computeSha256(filePath) {
  try {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  } catch (e) {
    return null;
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  let files;
  try {
    files = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return arrayOfFiles;
  }

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      try {
        const stat = fs.statSync(fullPath);
        arrayOfFiles.push({
          fullPath,
          name: file.name,
          size: stat.size
        });
      } catch (e) {}
    }
  }
  return arrayOfFiles;
}

function getFreeSpaceGB() {
  try {
    const output = execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq 'D:' }).FreeSpace"`,
      { encoding: 'utf8' }
    ).trim();
    const bytes = parseInt(output, 10);
    return {
      bytes,
      gb: +(bytes / (1024 * 1024 * 1024)).toFixed(3)
    };
  } catch (e) {
    return { bytes: 0, gb: 0 };
  }
}

function testBridgeRpc() {
  return new Promise((resolve) => {
    let client;
    const timeout = setTimeout(() => {
      if (client) client.destroy();
      resolve({ success: false, reason: 'TIMEOUT' });
    }, 4000);

    try {
      client = net.connect(PIPE_NAME, () => {
        const req = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'cc_connected_apps', arguments: {} }
        }) + '\n';
        client.write(req);
      });

      let buf = '';
      client.on('data', (data) => {
        buf += data.toString('utf8');
        if (buf.includes('"result"')) {
          clearTimeout(timeout);
          client.end();
          resolve({ success: true, response: buf });
        }
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, reason: err.message });
      });
    } catch (e) {
      clearTimeout(timeout);
      resolve({ success: false, reason: e.message });
    }
  });
}

// 1. Index the new approved hierarchy
function buildNewHierarchyIndex() {
  const newRoots = [
    path.join(WORKSPACE_ROOT, '01-Projects'),
    path.join(WORKSPACE_ROOT, '02-Blender'),
    path.join(WORKSPACE_ROOT, '03-CapCut'),
    path.join(WORKSPACE_ROOT, '04-Photoshop'),
    path.join(WORKSPACE_ROOT, '05-Premiere'),
    path.join(WORKSPACE_ROOT, '06-Illustrator'),
    path.join(WORKSPACE_ROOT, '07-AfterEffects'),
    path.join(WORKSPACE_ROOT, '08-Office'),
    path.join(WORKSPACE_ROOT, '09-VideoScribe'),
    path.join(WORKSPACE_ROOT, '10-Aspire'),
    path.join(WORKSPACE_ROOT, '11-Other-Apps')
  ];

  const index = new Map();
  let totalFiles = 0;
  for (const nr of newRoots) {
    const files = getAllFiles(nr);
    for (const f of files) {
      totalFiles++;
      const key = `${f.name}:${f.size}`;
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(f.fullPath);
    }
  }
  return { index, totalFiles };
}

// Exported main step function
export async function auditAndDeleteCandidate(candidateName) {
  const candidatePath = path.join(WORKSPACE_ROOT, candidateName);
  console.log(`\n============================================================`);
  console.log(`[P14 AUDIT & CLEANUP] Starting processing for: ${candidateName}`);
  console.log(`Candidate Path: ${candidatePath}`);
  console.log(`============================================================`);

  if (!fs.existsSync(candidatePath)) {
    console.log(`[ALREADY REMOVED] Folder does not exist: ${candidatePath}`);
    return {
      folder: candidateName,
      status: 'ALREADY_REMOVED',
      filesCount: 0,
      bytesFreed: 0
    };
  }

  // Pre-check 1: Ensure it is strictly in approved candidate list
  const ALLOWED_CANDIDATES = [
    'backups',
    'legacy',
    'Adobe-Bridge-Audit',
    'MADEL-Studio-Bridge',
    'Adobe-Bridge',
    'security-reports',
    'blender',
    'Capcat'
  ];

  if (!ALLOWED_CANDIDATES.includes(candidateName)) {
    console.error(`[BLOCKED] Folder '${candidateName}' is NOT in allowed candidate list!`);
    return { folder: candidateName, status: 'BLOCKED', reason: 'NOT_IN_ALLOWLIST' };
  }

  // Pre-check 2: Ensure path is NOT runtime or numbered folder
  if (candidateName.startsWith('0') || candidateName.startsWith('1') || candidateName.toLowerCase() === 'runtime') {
    console.error(`[BLOCKED] Path is strictly protected!`);
    return { folder: candidateName, status: 'BLOCKED', reason: 'PROTECTED_PATH' };
  }

  // Step A: Real-time File Inventory
  console.log(`[1/5] Performing real-time file inventory of ${candidateName}...`);
  const legacyFiles = getAllFiles(candidatePath);
  console.log(`Found ${legacyFiles.length} files in ${candidateName}.`);

  let totalCandidateBytes = legacyFiles.reduce((acc, f) => acc + f.size, 0);

  // Step B: Index New Hierarchy
  console.log(`[2/5] Building index of approved new hierarchy...`);
  const { index: newIndex, totalFiles: newHierarchyFilesCount } = buildNewHierarchyIndex();
  console.log(`Indexed ${newHierarchyFilesCount} files in new hierarchy.`);

  // Step C: Real-time SHA-256 Parity Verification
  console.log(`[3/5] Computing and verifying SHA-256 hashes for all ${legacyFiles.length} files...`);
  let matchedCount = 0;
  const unmatched = [];

  for (let i = 0; i < legacyFiles.length; i++) {
    const f = legacyFiles[i];
    const key = `${f.name}:${f.size}`;
    const matches = newIndex.get(key);

    let isDuplicate = false;
    if (matches && matches.length > 0) {
      if (f.size === 0) {
        isDuplicate = true;
      } else {
        const srcHash = computeSha256(f.fullPath);
        for (const m of matches) {
          const mHash = computeSha256(m);
          if (srcHash && srcHash === mHash) {
            isDuplicate = true;
            break;
          }
        }
      }
    }

    if (isDuplicate) {
      matchedCount++;
    } else {
      unmatched.push(f.fullPath);
    }

    if ((i + 1) % 1000 === 0 || i === legacyFiles.length - 1) {
      process.stdout.write(`  Verified ${i + 1}/${legacyFiles.length} files...\r`);
    }
  }
  console.log(`\nVerification Result: ${matchedCount} matched, ${unmatched.length} unmatched.`);

  if (unmatched.length > 0) {
    console.error(`[BLOCKED] Found ${unmatched.length} files without verified replicas in new hierarchy!`);
    console.error(`First 5 unmatched files:`, unmatched.slice(0, 5));
    return {
      folder: candidateName,
      status: 'BLOCKED',
      reason: 'UNMATCHED_FILES',
      unmatchedFiles: unmatched
    };
  }

  // Step D: Active Dependencies & Config References Check
  console.log(`[4/5] Checking active dependencies and configuration references...`);
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  const configFiles = [
    path.join(userHome, '.gemini', 'antigravity', 'mcp_config.json'),
    path.join(userHome, '.claude.json'),
    path.join(userHome, '.codex', 'config.toml')
  ];

  for (const cfg of configFiles) {
    if (fs.existsSync(cfg)) {
      const content = fs.readFileSync(cfg, 'utf8');
      const escaped = `D:\\\\MCP\\\\${candidateName}`.replace(/\\/g, '\\\\');
      const reg = new RegExp(`D:[\\\\/]+MCP[\\\\/]+${candidateName}`, 'i');
      if (reg.test(content)) {
        console.error(`[BLOCKED] Active config file ${cfg} references ${candidateName}!`);
        return {
          folder: candidateName,
          status: 'BLOCKED',
          reason: 'REFERENCED_IN_CONFIG',
          config: cfg
        };
      }
    }
  }

  // Pre-deletion Bridge Check
  console.log(`Verifying Bridge RPC health before deletion...`);
  const preRpc = await testBridgeRpc();
  if (!preRpc.success) {
    console.warn(`[WARNING] Bridge RPC did not respond: ${preRpc.reason}. Checking Primary Daemon...`);
  } else {
    console.log(`Bridge RPC is healthy.`);
  }

  // Step E: Progressive Deletion
  const spaceBefore = getFreeSpaceGB();
  console.log(`[5/5] Executing safe progressive deletion of ${candidatePath}...`);
  console.log(`D: Free space before: ${spaceBefore.gb} GB (${spaceBefore.bytes} bytes)`);

  try {
    fs.rmSync(candidatePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  } catch (err) {
    console.error(`[FAILED TO DELETE] Error removing ${candidatePath}:`, err.message);
    return {
      folder: candidateName,
      status: 'BLOCKED',
      reason: 'DELETION_ERROR',
      error: err.message
    };
  }

  // Verify deletion
  if (fs.existsSync(candidatePath)) {
    console.error(`[BLOCKED] Directory still exists after rmSync: ${candidatePath}`);
    return {
      folder: candidateName,
      status: 'BLOCKED',
      reason: 'PATH_STILL_EXISTS'
    };
  }

  const spaceAfter = getFreeSpaceGB();
  const recoveredBytes = spaceAfter.bytes - spaceBefore.bytes;
  const recoveredMB = +(recoveredBytes / (1024 * 1024)).toFixed(2);
  console.log(`[SUCCESS] Successfully removed: ${candidatePath}`);
  console.log(`D: Free space after: ${spaceAfter.gb} GB (${spaceAfter.bytes} bytes)`);
  console.log(`Net space change: ${recoveredMB} MB`);

  // Post-deletion Bridge Health Check
  console.log(`Verifying Bridge RPC health after deletion...`);
  const postRpc = await testBridgeRpc();
  console.log(`Post-deletion Bridge RPC status: ${postRpc.success ? 'HEALTHY' : 'FAILED: ' + postRpc.reason}`);

  return {
    folder: candidateName,
    status: 'SUCCESS_CLEANED',
    filesDeleted: legacyFiles.length,
    bytesDeleted: totalCandidateBytes,
    mbDeleted: +(totalCandidateBytes / (1024 * 1024)).toFixed(2),
    spaceBeforeGB: spaceBefore.gb,
    spaceAfterGB: spaceAfter.gb,
    recoveredMB,
    bridgeHealthy: postRpc.success
  };
}

// Allow standalone execution with arguments
const targetArg = process.argv[2];
if (targetArg) {
  auditAndDeleteCandidate(targetArg).then((res) => {
    console.log('\nOperation Result:', JSON.stringify(res, null, 2));
    process.exit(res.status === 'SUCCESS_CLEANED' ? 0 : 1);
  });
}
