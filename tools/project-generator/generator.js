#!/usr/bin/env node
/**
 * MADEL Studio Bridge — Unified Project Generator (Hardened Architecture)
 * Owner: Mahmoud Adel
 * Path: D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\generator.js
 *
 * Enforces strict workspace layout:
 * - NO projects directly in D:\MCP root.
 * - Creative projects strictly in 02-Blender..11-Other-Apps / <Brand> / <Project>
 * - Software projects strictly in 01-Projects/Source or 01-Projects/Installed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE_ROOT = path.resolve('D:\\MCP');

const VALID_CREATIVE_APPS = [
  '02-Blender',
  '03-CapCut',
  '04-Photoshop',
  '05-Premiere',
  '06-Illustrator',
  '07-AfterEffects',
  '08-Office',
  '09-VideoScribe',
  '10-Aspire',
  '11-Other-Apps'
];

function printUsage() {
  console.log(`
==================================================
MADEL Studio Bridge — Unified Project Generator
==================================================
Usage:
  node generator.js software --name <ProjectName> [--tech <node|python|ts>] [--repo-type <source|installed>] [--git] [--desc <description>]
  node generator.js creative --app <02-Blender|03-CapCut|04-Photoshop|...> --brand <BrandName> --name <ProjectName> [--desc <objective>]

Constraints:
  * Direct creation in D:\\MCP root is STRICTLY FORBIDDEN.
  * Creative projects require --app, --brand, and --name.
  * Software projects require --name and are routed to 01-Projects.
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) return null;

  const mode = args[0].toLowerCase();
  const options = { mode };

  for (let i = 1; i < args.length; i++) {
    const key = args[i];
    if (key.startsWith('--')) {
      const optName = key.substring(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[optName] = args[i + 1];
        i++;
      } else {
        options[optName] = true;
      }
    }
  }
  return options;
}

function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  [DIR CREATED] ${dirPath}`);
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log(`  [FILE CREATED] ${filePath}`);
}

function assertNotRootPath(targetPath) {
  const resolved = path.resolve(targetPath);
  if (resolved === WORKSPACE_ROOT) {
    throw new Error('SECURITY VIOLATION: Cannot create projects directly in D:\\MCP root.');
  }
  const rel = path.relative(WORKSPACE_ROOT, resolved);
  if (!rel || rel === '.' || !rel.includes(path.sep)) {
    throw new Error(`STRUCTURE VIOLATION: Path '${resolved}' is too shallow. Projects must reside within designated categories.`);
  }
}

function generateSoftwareProject(opts) {
  const name = opts.name;
  if (!name) {
    console.error('Error: --name is required for software projects.');
    process.exit(1);
  }

  const tech = opts.tech || 'ts';
  const repoType = opts['repo-type'] || 'source';
  const desc = opts.desc || `Software project ${name} within MADEL Studio Bridge ecosystem`;
  const baseTarget = repoType === 'installed' ? '01-Projects\\Installed' : '01-Projects\\Source';
  const projectDir = path.join(WORKSPACE_ROOT, baseTarget, name);

  assertNotRootPath(projectDir);

  console.log(`\nGenerating Software Project: ${name}`);
  console.log(`Target Category: ${baseTarget}`);
  console.log(`Location: ${projectDir}`);

  if (fs.existsSync(projectDir)) {
    console.warn(`[WARNING] Target directory already exists: ${projectDir}`);
  }

  // 1. Mandatory 10 subdirectories
  const subdirs = [
    'src',
    'config',
    'docs',
    'reports',
    'errors',
    'logs',
    'tests',
    'builds',
    'releases',
    'backups'
  ];

  subdirs.forEach(sd => createDir(path.join(projectDir, sd)));

  // 2. PROJECT_INFO.md
  const infoMd = `# PROJECT_INFO — ${name}
- **Type:** Software Project (${repoType.toUpperCase()})
- **Project Name:** ${name}
- **Technology Stack:** ${tech}
- **Repository Category:** ${baseTarget}
- **Objective:** ${desc}
- **Owner:** Mahmoud Adel
- **Version:** 0.1.0
- **Created Date:** ${new Date().toISOString().split('T')[0]}
- **Status:** INITIALIZED
`;
  writeFile(path.join(projectDir, 'PROJECT_INFO.md'), infoMd);

  // 3. PROJECT_PROGRESS.md
  const progressMd = `# PROJECT_PROGRESS — ${name}
## Milestone Tracker
- [x] Phase 0: Project scaffolding & standard structure created.
- [ ] Phase 1: Core implementation in \`src/\`.
- [ ] Phase 2: Configuration & local tests in \`tests/\`.
- [ ] Phase 3: Integration & QA Report in \`reports/\`.
- [ ] Phase 4: Production build & release in \`releases/\`.
`;
  writeFile(path.join(projectDir, 'PROJECT_PROGRESS.md'), progressMd);

  // 4. README.md
  const readmeMd = `# ${name}
${desc}

## Directory Structure
- \`src/\`: Source code
- \`config/\`: Environment and runtime configuration
- \`docs/\`: Architectural documentation
- \`reports/\`: Automated and manual QA reports
- \`errors/\`: Bug tracking and fixes
- \`logs/\`: Runtime output logs
- \`tests/\`: Automated unit and integration test suites
- \`builds/\`: Compiled artifacts
- \`releases/\`: Packaged deliverables
- \`backups/\`: Local safety backups
`;
  writeFile(path.join(projectDir, 'README.md'), readmeMd);

  // 5. .gitignore
  const gitignore = `node_modules/
dist/
builds/
logs/*.log
*.env
*.env.local
.DS_Store
Thumbs.db
`;
  writeFile(path.join(projectDir, '.gitignore'), gitignore);

  // 6. Technology-specific scaffolding
  if (tech === 'node' || tech === 'ts' || tech === 'js') {
    const pkgJson = {
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '0.1.0',
      description: desc,
      main: 'src/index.js',
      scripts: {
        test: 'node --test tests/'
      },
      author: 'Mahmoud Adel',
      license: 'Apache-2.0'
    };
    writeFile(path.join(projectDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
    writeFile(path.join(projectDir, 'src', 'index.js'), `// ${name} main entrypoint\nconsole.log('${name} initialized successfully.');\nmodule.exports = {};`);
    writeFile(path.join(projectDir, 'tests', 'index.test.js'), `const assert = require('assert');\n// Basic scaffold test\nassert.strictEqual(1, 1);\nconsole.log('Scaffold test passed.');`);
  } else if (tech === 'python') {
    writeFile(path.join(projectDir, 'requirements.txt'), '# Project dependencies\n');
    writeFile(path.join(projectDir, 'src', '__init__.py'), '');
    writeFile(path.join(projectDir, 'src', 'main.py'), `def main():\n    print("${name} initialized.")\n\nif __name__ == '__main__':\n    main()\n`);
    writeFile(path.join(projectDir, 'tests', 'test_main.py'), `def test_basic():\n    assert True\n`);
  }

  // 7. Optional Git initialization
  if (opts.git) {
    try {
      execSync('git init', { cwd: projectDir, stdio: 'ignore' });
      console.log('  [GIT] Initialized local git repository.');
    } catch (e) {
      console.warn('  [GIT] Git init failed or git not available.');
    }
  }

  console.log(`\n>>> SUCCESS: Software project ${name} created at ${projectDir} <<<\n`);
}

function generateCreativeProject(opts) {
  const app = opts.app;
  const brand = opts.brand;
  const name = opts.name;

  if (!app || !brand || !name) {
    console.error('Error: --app, --brand, and --name are all required for creative projects.');
    printUsage();
    process.exit(1);
  }

  // Validate and resolve app folder name
  let resolvedApp = VALID_CREATIVE_APPS.find(a => a.toLowerCase() === app.toLowerCase() || a.toLowerCase().endsWith(app.toLowerCase()));
  if (!resolvedApp) {
    console.error(`Invalid application: '${app}'. Must be one of: ${VALID_CREATIVE_APPS.join(', ')}`);
    process.exit(1);
  }

  const desc = opts.desc || `Creative project for ${brand} inside ${resolvedApp}`;
  const projectDir = path.join(WORKSPACE_ROOT, resolvedApp, brand, name);

  assertNotRootPath(projectDir);

  console.log(`\nGenerating Creative Project: ${resolvedApp} -> ${brand} -> ${name}`);
  console.log(`Location: ${projectDir}`);

  if (fs.existsSync(projectDir)) {
    console.warn(`[WARNING] Target directory already exists: ${projectDir}`);
  }

  // Mandatory 8 Creative Subdirectories
  const creativeSubdirs = [
    '01-Source',
    '02-Assets',
    '03-Project',
    '04-Previews',
    '05-Exports',
    '06-Reports',
    '07-Errors',
    '08-Backups'
  ];

  creativeSubdirs.forEach(sd => createDir(path.join(projectDir, sd)));

  // PROJECT_INFO.md
  const infoMd = `# PROJECT_INFO — ${name}
- **Application:** ${resolvedApp}
- **Brand Name:** ${brand}
- **Project Name:** ${name}
- **Objective:** ${desc}
- **Primary Project Path:** \`03-Project/\`
- **Owner & Designer:** Mahmoud Adel
- **Version:** 1.0.0
- **Creation Date:** ${new Date().toISOString().split('T')[0]}
- **Status:** INITIALIZED & READY
`;
  writeFile(path.join(projectDir, 'PROJECT_INFO.md'), infoMd);

  // PROJECT_PROGRESS.md
  const progressMd = `# PROJECT_PROGRESS — ${name}
- [x] Step 1: Creative folder hierarchy initialized (01-Source through 08-Backups).
- [ ] Step 2: Assets and raw footage organized in \`01-Source\` & \`02-Assets\`.
- [ ] Step 3: Editable master project files saved in \`03-Project\`.
- [ ] Step 4: Preview renders/frames exported to \`04-Previews\`.
- [ ] Step 5: Final delivery files rendered to \`05-Exports\`.
- [ ] Step 6: Quality report documented in \`06-Reports\`.
`;
  writeFile(path.join(projectDir, 'PROJECT_PROGRESS.md'), progressMd);

  // Initial report template
  const initialReport = `# Initial Creative Brief & Setup
- **Project:** ${name}
- **Brand:** ${brand}
- **Application:** ${resolvedApp}
- **Created on:** ${new Date().toISOString()}
- **Objective:** ${desc}
`;
  writeFile(path.join(projectDir, '06-Reports', 'INITIAL_BRIEF.md'), initialReport);

  console.log(`\n>>> SUCCESS: Creative project ${name} created at ${projectDir} <<<\n`);
}

// Main execution
const opts = parseArgs();
if (!opts) {
  printUsage();
  process.exit(1);
}

try {
  if (opts.mode === 'software') {
    generateSoftwareProject(opts);
  } else if (opts.mode === 'creative') {
    generateCreativeProject(opts);
  } else {
    console.error(`Unknown mode: ${opts.mode}`);
    printUsage();
    process.exit(1);
  }
} catch (err) {
  console.error(`\n[GENERATOR ERROR] ${err.message}\n`);
  process.exit(1);
}
