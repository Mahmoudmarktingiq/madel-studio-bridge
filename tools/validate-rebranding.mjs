import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const panelDir = 'D:\\MCP\\MADEL-Studio-Bridge\\panels\\panel-uxp-photoshop';

console.log('--- VALIDATING MADEL STUDIO BRIDGE PANEL ---');

// 1. Validate manifest.json
const manifestPath = join(panelDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

console.log('1. Manifest Validation:');
console.log('   Plugin ID:', manifest.id);
console.log('   Plugin Name:', manifest.name);
console.log('   Panel Label:', manifest.entrypoints[0].label.default);
console.log('   Manifest Version:', manifest.manifestVersion);
console.log('   Network Domains count:', manifest.requiredPermissions.network.domains.length);

if (manifest.name !== 'MADEL Studio Bridge') throw new Error('Manifest name mismatch!');
if (manifest.entrypoints[0].label.default !== 'MADEL Studio Bridge') throw new Error('Manifest label mismatch!');
if (manifest.id !== 'com.brainferno.mcp-bridge.photoshop') throw new Error('Plugin ID should be preserved for clean in-place CCX upgrade!');
console.log('   -> manifest.json: PASS');

// 2. Validate index.html
const htmlPath = join(panelDir, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
if (!html.includes('MADEL Studio Bridge')) throw new Error('Missing MADEL Studio Bridge in HTML');
if (!html.includes('Developed by Mahmoud Adel')) throw new Error('Missing Developed by Mahmoud Adel in HTML');
if (!html.includes('Based in part on Brainferno MCP Bridge')) throw new Error('Missing attribution in HTML');
console.log('2. HTML Validation:');
console.log('   Brand name present: YES');
console.log('   Developer name present: YES');
console.log('   Attribution line present: YES');
console.log('   -> index.html: PASS');

// 3. Validate JS syntax
console.log('3. JavaScript Syntax:');
new Function(readFileSync(join(panelDir, 'bridge-client.js'), 'utf8'));
console.log('   -> bridge-client.js: PASS');
new Function(readFileSync(join(panelDir, 'commands.js'), 'utf8'));
console.log('   -> commands.js: PASS');

// 4. Validate Icons
const icon48 = join(panelDir, 'icons', 'icon.png');
const icon23 = join(panelDir, 'icons', 'icon@1x.png');
const icon46 = join(panelDir, 'icons', 'icon@2x.png');
const logoSvg = join(panelDir, 'icons', 'logo.svg');

if (!existsSync(icon48) || !existsSync(icon23) || !existsSync(icon46) || !existsSync(logoSvg)) {
    throw new Error('Missing icon files!');
}
console.log('4. Icons Existence:');
console.log('   icon.png (48x48):', existsSync(icon48));
console.log('   icon@1x.png (23x23):', existsSync(icon23));
console.log('   icon@2x.png (46x46):', existsSync(icon46));
console.log('   logo.svg:', existsSync(logoSvg));
console.log('   -> Icons: PASS');

// 5. Validate CCX build
const ccxPath = 'D:\\MCP\\MADEL-Studio-Bridge\\dist\\MADEL-Studio-Bridge-Photoshop.ccx';
if (!existsSync(ccxPath)) throw new Error('Missing CCX package!');
console.log('5. CCX Package Validation:');
console.log('   Package path:', ccxPath);
console.log('   -> CCX Package: PASS');

console.log('--- ALL VALIDATIONS PASSED ---');
