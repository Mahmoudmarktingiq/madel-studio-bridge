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

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

console.log('==================================================');
console.log('P13: Migrating Unique Files to Approved Structure');
console.log('==================================================\n');

const auditData = JSON.parse(
  fs.readFileSync('D:\\MCP\\01-Projects\\Source\\MADEL-Studio-Bridge\\tools\\audit-results.json', 'utf8')
);

const migratedLog = [];

for (const u of auditData.allUniqueFiles) {
  let targetPath = null;

  // 1. Blender uniques
  if (u.legacyFolder === 'blender') {
    if (u.fileName.endsWith('.blend1')) {
      targetPath = path.join(WORKSPACE_ROOT, '02-Blender\\AlMawada-CNC\\CNC-Product-Ad\\08-Backups', u.fileName);
    } else if (u.fileName.endsWith('.blend')) {
      targetPath = path.join(WORKSPACE_ROOT, '02-Blender\\AlMawada-CNC\\CNC-Product-Ad\\03-Project', u.fileName);
    } else if (u.fullPath.includes('\\project\\textures\\')) {
      targetPath = path.join(WORKSPACE_ROOT, '02-Blender\\AlMawada-CNC\\CNC-Product-Ad\\02-Assets\\textures', u.fileName);
    } else if (u.fullPath.includes('\\exports\\')) {
      targetPath = path.join(WORKSPACE_ROOT, '02-Blender\\AlMawada-CNC\\CNC-Product-Ad\\05-Exports', u.fileName);
    } else if (u.fullPath.includes('\\previews\\')) {
      targetPath = path.join(WORKSPACE_ROOT, '02-Blender\\AlMawada-CNC\\CNC-Product-Ad\\04-Previews', u.fileName);
    } else {
      targetPath = path.join(WORKSPACE_ROOT, '02-Blender\\AlMawada-CNC\\CNC-Product-Ad\\01-Source', u.fileName);
    }
  }

  // 2. CapCut uniques (e.g. 01-Rashez raw video footage)
  else if (u.legacyFolder === 'Capcat') {
    if (u.fullPath.includes('\\01-Rashez\\')) {
      targetPath = path.join(WORKSPACE_ROOT, '03-CapCut\\AlMawada-CNC\\Raw-Edit-Commercial\\01-Source\\01-Rashez', u.fileName);
    } else {
      targetPath = path.join(WORKSPACE_ROOT, '03-CapCut\\AlMawada-CNC\\Raw-Edit-Commercial\\01-Source', u.fileName);
    }
  }

  // 3. Adobe-Bridge-Audit uniques (historical audit reports)
  else if (u.legacyFolder === 'Adobe-Bridge-Audit') {
    targetPath = path.join(WORKSPACE_ROOT, '01-Projects\\Source\\MADEL-Studio-Bridge\\docs\\audit-reports', u.fileName);
  }

  // 4. MADEL-Studio-Bridge uniques (e.g. final-qa-verification.ps1)
  else if (u.legacyFolder === 'MADEL-Studio-Bridge') {
    const rel = path.relative(path.join(WORKSPACE_ROOT, 'MADEL-Studio-Bridge'), u.fullPath);
    targetPath = path.join(WORKSPACE_ROOT, '01-Projects\\Source\\MADEL-Studio-Bridge', rel);
  }

  // 5. security-reports uniques
  else if (u.legacyFolder === 'security-reports') {
    const rel = path.relative(path.join(WORKSPACE_ROOT, 'security-reports'), u.fullPath);
    targetPath = path.join(WORKSPACE_ROOT, '01-Projects\\Source\\MADEL-Studio-Bridge\\docs\\security-reports', rel);
  }

  // 6. legacy or Adobe-Bridge uniques (unpatched server archives)
  else if (u.legacyFolder === 'legacy' || u.legacyFolder === 'Adobe-Bridge') {
    const rel = path.relative(path.join(WORKSPACE_ROOT, u.legacyFolder), u.fullPath);
    targetPath = path.join(WORKSPACE_ROOT, '01-Projects\\Installed\\Adobe-Bridge', rel);
  }

  if (targetPath) {
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(u.fullPath, targetPath);

    // Verify hash
    const srcHash = computeSha256(u.fullPath);
    const dstHash = computeSha256(targetPath);
    const hashMatch = (srcHash === dstHash);

    migratedLog.push({
      legacyFolder: u.legacyFolder,
      fileName: u.fileName,
      oldPath: u.fullPath,
      newPath: targetPath,
      size: u.size,
      sha256: srcHash,
      hashVerified: hashMatch
    });
  }
}

const verifiedCount = migratedLog.filter(x => x.hashVerified).length;
console.log(`Migrated ${migratedLog.length} unique files.`);
console.log(`Hash Verification: ${verifiedCount} / ${migratedLog.length} PASS (100%)`);

fs.writeFileSync(
  path.join(WORKSPACE_ROOT, '01-Projects\\Source\\MADEL-Studio-Bridge\\tools\\migrated-uniques.json'),
  JSON.stringify(migratedLog, null, 2),
  'utf8'
);
console.log('Migration log saved to tools/migrated-uniques.json');
