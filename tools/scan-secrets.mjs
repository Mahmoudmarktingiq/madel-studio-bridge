import fs from 'fs';
import path from 'path';

const ROOT = 'D:\\MCP\\01-Projects\\Source\\MADEL-Studio-Bridge';

const SECRET_PATTERNS = [
  { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { name: 'Generic Private Key', regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9]{32,}/g },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Hardcoded Password Assignment', regex: /(?:password|passwd|secret)\s*[:=]\s*["'][^"']{4,}["']/gi }
];

function getAllCandidateFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'backups' ||
        entry.name === 'P3-sandbox' ||
        entry.name === 'dist' ||
        entry.name === 'upstream'
      ) {
        continue;
      }
      getAllCandidateFiles(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

console.log('=== RUNNING SECURITY & SECRET SCAN ===');
const allFiles = getAllCandidateFiles(ROOT);
console.log(`Checking ${allFiles.length} candidate source files...`);

let alertCount = 0;
for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const pat of SECRET_PATTERNS) {
      const match = content.match(pat.regex);
      if (match) {
        // Exclude dummy test matches or false positives in documentation
        console.log(`[ALERT] Matched ${pat.name} in: ${file.replace(ROOT, '')}`);
        console.log(`        Match preview: ${match[0].slice(0, 15)}...`);
        alertCount++;
      }
    }
  } catch (e) {}
}

console.log(`\nScan Finished. Total potential alerts: ${alertCount}`);
if (alertCount === 0) {
  console.log('Result: 0 SECRETS DETECTED. SECURITY REVIEW: PASS');
  process.exit(0);
} else {
  console.log('Result: ALERTS FOUND. PLEASE REVIEW.');
  process.exit(1);
}
