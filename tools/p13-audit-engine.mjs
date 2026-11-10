import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const WORKSPACE_ROOT = 'D:\\MCP';

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
  const files = fs.readdirSync(dirPath, { withFileTypes: true });

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
      } catch (e) { }
    }
  }
  return arrayOfFiles;
}

console.log('==================================================');
console.log('MADEL Studio Bridge — High-Performance P13 Audit Engine');
console.log('==================================================\n');

// 1. Clean empty folders
console.log('[STEP 1: EMPTY DIRECTORIES CHECK]');
const emptyCandidates = ['archives', 'logs'];
const cleanedEmptyDirs = [];

for (const name of emptyCandidates) {
  const p = path.join(WORKSPACE_ROOT, name);
  if (fs.existsSync(p)) {
    const items = fs.readdirSync(p);
    if (items.length === 0) {
      fs.rmdirSync(p);
      console.log(`  [CLEANED EMPTY DIR] ${p}`);
      cleanedEmptyDirs.push(p);
    } else {
      console.log(`  [NOT EMPTY - KEPT] ${p} (${items.length} items)`);
    }
  } else {
    console.log(`  [ALREADY CLEANED] ${p}`);
    cleanedEmptyDirs.push(p);
  }
}

// 2. Index the new workspace
console.log('\n[STEP 2: INDEXING NEW WORKSPACE FILES...]');
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

const newIndexByNameAndSize = new Map();
const newIndexByRel = new Map();
let totalNewFiles = 0;

for (const nr of newRoots) {
  const files = getAllFiles(nr);
  for (const f of files) {
    totalNewFiles++;
    const key = `${f.name}:${f.size}`;
    if (!newIndexByNameAndSize.has(key)) {
      newIndexByNameAndSize.set(key, []);
    }
    newIndexByNameAndSize.get(key).push(f.fullPath);

    const relKey = path.relative(WORKSPACE_ROOT, f.fullPath).toLowerCase();
    newIndexByRel.set(relKey, f.fullPath);
  }
}
console.log(`Indexed ${totalNewFiles} files in new workspace structure.`);

// 3. Candidate legacy folders
const legacyFolders = [
  { name: 'blender', target: '02-Blender\\AlMawada-CNC\\CNC-Product-Ad' },
  { name: 'Capcat', target: '03-CapCut\\AlMawada-CNC\\Raw-Edit-Commercial' },
  { name: 'Adobe-Bridge', target: '01-Projects\\Installed\\Adobe-Bridge' },
  { name: 'MADEL-Studio-Bridge', target: '01-Projects\\Source\\MADEL-Studio-Bridge' },
  { name: 'Adobe-Bridge-Audit', target: '01-Projects\\Source\\MADEL-Studio-Bridge\\docs\\workspace' },
  { name: 'legacy', target: '01-Projects\\Installed\\Adobe-Bridge' },
  { name: 'security-reports', target: '01-Projects\\Source\\MADEL-Studio-Bridge\\docs\\security-reports' },
  { name: 'backups', target: '01-Projects\\Source\\MADEL-Studio-Bridge\\backups' }
];

console.log('\n[STEP 3: DEEP FILE AUDIT & HASH VERIFICATION]');
const summary = [];
const allUniqueFiles = [];
let overallDuplicates = 0;
let overallDuplicateBytes = 0;

for (const lf of legacyFolders) {
  const srcDir = path.join(WORKSPACE_ROOT, lf.name);
  if (!fs.existsSync(srcDir)) continue;

  console.log(`Auditing legacy folder: ${lf.name}...`);
  const legacyFiles = getAllFiles(srcDir);

  let dupCount = 0;
  let dupBytes = 0;
  let uniqueCount = 0;
  const folderUnique = [];

  for (const f of legacyFiles) {
    const key = `${f.name}:${f.size}`;
    const matches = newIndexByNameAndSize.get(key);

    let isVerifiedDuplicate = false;

    if (matches && matches.length > 0) {
      // Size and name matched; let's verify SHA-256 if size > 0
      if (f.size === 0) {
        isVerifiedDuplicate = true;
      } else {
        const srcHash = computeSha256(f.fullPath);
        for (const m of matches) {
          const mHash = computeSha256(m);
          if (srcHash && srcHash === mHash) {
            isVerifiedDuplicate = true;
            break;
          }
        }
      }
    }

    if (isVerifiedDuplicate) {
      dupCount++;
      dupBytes += f.size;
    } else {
      uniqueCount++;
      const uniqueObj = {
        legacyFolder: lf.name,
        fileName: f.name,
        size: f.size,
        fullPath: f.fullPath,
        suggestedTargetDir: path.join(WORKSPACE_ROOT, lf.target)
      };
      folderUnique.push(uniqueObj);
      allUniqueFiles.push(uniqueObj);
    }
  }

  overallDuplicates += dupCount;
  overallDuplicateBytes += dupBytes;

  const stat = {
    folder: lf.name,
    totalFiles: legacyFiles.length,
    duplicates: dupCount,
    unique: uniqueCount,
    dupSizeMB: +(dupBytes / (1024 * 1024)).toFixed(2),
    totalSizeMB: +(legacyFiles.reduce((acc, x) => acc + x.size, 0) / (1024 * 1024)).toFixed(2)
  };
  summary.push(stat);
  console.log(`  -> Total: ${stat.totalFiles} | Duplicates: ${dupCount} | Unique: ${uniqueCount} | Size: ${stat.totalSizeMB} MB`);
}

console.log('\n==================================================');
console.log('AUDIT SUMMARY TABLE');
console.log('==================================================');
console.table(summary);

console.log(`Total Verified Duplicates: ${overallDuplicates}`);
console.log(`Total Verified Duplicate Size: ${(overallDuplicateBytes / (1024 * 1024)).toFixed(2)} MB (${(overallDuplicateBytes / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
console.log(`Total Unique Files Found: ${allUniqueFiles.length}`);

// Write JSON output for subsequent migration of unique files and reporting
const auditResult = {
  timestamp: new Date().toISOString(),
  cleanedEmptyDirs,
  summary,
  overallDuplicates,
  overallDuplicateBytes,
  overallDuplicateMB: +(overallDuplicateBytes / (1024 * 1024)).toFixed(2),
  overallDuplicateGB: +(overallDuplicateBytes / (1024 * 1024 * 1024)).toFixed(2),
  allUniqueFiles
};

fs.writeFileSync(
  path.join(WORKSPACE_ROOT, '01-Projects\\Source\\MADEL-Studio-Bridge\\tools\\audit-results.json'),
  JSON.stringify(auditResult, null, 2),
  'utf8'
);
console.log('\nAudit results saved to tools/audit-results.json');
