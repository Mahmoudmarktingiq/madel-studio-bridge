import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('D:\\MCP\\01-Projects\\Source\\MADEL-Studio-Bridge\\tools\\audit-results.json', 'utf8'));

const grouped = {};
for (const u of data.allUniqueFiles) {
  if (!grouped[u.legacyFolder]) grouped[u.legacyFolder] = [];
  grouped[u.legacyFolder].push(u);
}

for (const [folder, files] of Object.entries(grouped)) {
  console.log(`\n================ ${folder} (${files.length} unique files) ================`);
  const top10 = files.slice(0, 15);
  for (const f of top10) {
    console.log(`  ${f.fileName} (${f.size} bytes) -> ${f.fullPath.replace('D:\\MCP\\', '')}`);
  }
}
