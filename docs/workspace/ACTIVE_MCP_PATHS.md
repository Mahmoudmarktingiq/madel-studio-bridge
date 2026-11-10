# MADEL Studio Bridge — خريطة المسارات التشغيلية لخوادم MCP (Active MCP Paths)
**المسار الرئيسي:** `D:\MCP`  
**المالك:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0 — PRODUCTION CONFIGURATION  

---

## 1. المسارات التشغيلية لخوادم MCP النشطة

### 1. خادم Adobe Photoshop MCP (MADEL / Brainferno Bridge):
- **الموقع التشغيلي المعتمد:**  
  `D:\MCP\01-Projects\Installed\Adobe-Bridge\stable-candidate\dist\index.js`
- **أمر الاستدعاء في العملاء:**
  - `command`: `node`
  - `args`: `["D:\\MCP\\01-Projects\\Installed\\Adobe-Bridge\\stable-candidate\\dist\\index.js"]`
- **متغيرات البيئة الإلزامية:**
  - `BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS`: `"0"`
  - `BRAINFERNO_MCP_BRIDGE_INSECURE`: `"0"`
- **المنافذ وقنوات الاتصال:**
  - `WebSocket Local Port`: `127.0.0.1:7897` (للوحة UXP داخل Photoshop).
  - `Windows Named Pipe`: `\\.\pipe\brainferno-mcp-bridge` (لمضاعفة اتصالات العملاء بالتوازي دون أي تعارض).
- **ملف الهاندشيك:**  
  `C:\Users\asus\.brainferno-mcp-bridge\bridge.json`

---

### 2. خادم Blender MCP:
- **الموقع التشغيلي المعتمد:**  
  `D:\MCP\01-Projects\Installed\Blender-MCP`
- **أمر الاستدعاء في العملاء:**
  - `command`: `C:\Users\asus\AppData\Local\Microsoft\WinGet\Links\uvx.exe`
  - `args`: `["mcp-for-blender"]`
- **متغيرات البيئة:**
  - `UV_CACHE_DIR`: `D:\MCP\runtime\uv-cache` (User Environment Variable)
  - `BLENDER_HOST`: `127.0.0.1`
  - `BLENDER_PORT`: `9876`
- **الإضافة داخل البرنامج:**  
  `Interface: Blender MCP` (v1.8.0) داخل Blender 5.2.3 LTS.

---

### 3. أداة مونتاج CapCut (CLI & Skill):
- **الموقع التشغيلي المعتمد:**  
  `D:\MCP\01-Projects\Installed\CapCut-CLI`
- **ملف المهارة (Skill Path):**  
  `C:\Users\asus\.gemini\config\skills\capcut-edit\SKILL.md`
- **المسار المستهدف لمشاريع ومسودات CapCut:**  
  `D:\MCP\03-CapCut\<Brand>\<Project>\03-Project`

---

### 4. خادم Chrome DevTools MCP:
- **الأمر:** `node`
- **المسار:** `C:\Users\asus\AppData\Local\Programs\Antigravity\resources\app.asar.unpacked\node_modules\chrome-devtools-mcp\build\src\bin\chrome-devtools-mcp.js`
- **المعامل:** `--browserUrl http://127.0.0.1:9222`

---

### 5. خادم Stitch MCP:
- **النوع:** Remote HTTPS Server
- **الرابط:** `https://stitch.googleapis.com/mcp`
- **الهيدر:** `X-Goog-Api-Key`
