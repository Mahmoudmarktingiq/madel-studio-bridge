# MADEL Studio Bridge — Comprehensive MCP Inventory
**المشروع:** MADEL Studio Bridge  
**المطور والمشرف:** Mahmoud Adel — محمود عادل  
**تاريخ الجرد:** 10 نوفمبر 2026  
**النطاق:** فحص وجرد كافة بيئات وتكاملات وتبعيات بروتوكول MCP وخوادم التطبيقات ومساحات العمل على حاسبة المطور (الأقراص C: و D:).

---

## 1. الملخص التنفيذي لمساحات التخزين (Storage & Footprint Summary)

| الموقع | الحجم الكلي المرصود | المكونات الرئيسية | القابلية للنقل إلى D: |
| :--- | :---: | :--- | :---: |
| **قرص C: (بيئات وتبعيات وسجلات MCP)** | **~29.15 GB** | `uv` Cache (11.24 GB)، `.gemini` (9.64 GB)، `.claude` (6.67 GB)، `.codex` (1.59 GB) | **11.24 GB إلى 16 GB+ قابلة للتحرير الفوري والآمن** |
| **قرص D: (مشاريع وخوادم وأصول MCP)** | **~3.28 GB** | CapCut Workspace (2.62 GB)، Blender MCP (0.45 GB)، Security Reports (0.16 GB)، Adobe-Bridge (0.05 GB) | مستقرة ومجمعة على D: بالفعل |

---

## 2. جدول الجرد التفصيلي لكافة مكونات MCP (Detailed Inventory Matrix)

| المكون (Component) | المسار الفعلي (Path) | الحجم | الإصدار | طريقة التشغيل | إعدادات الربط | التبعيات | الحالة الحالية | النقل إلى D: | بقاء ملفات على C: | المخاطر عند النقل |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Brainferno Server (Candidate)** | `D:\MCP\Adobe-Bridge\stable-candidate` | 18.23 MB | 0.3.4 (Patched) | Node.js + Stdio | `node dist/index.js` (Multi-client multiplexer) | Node 20+, ws, zod 4.6.7, MCP SDK | **Active (RUNNING)** | نعم (موجود على D:) | ملف `bridge.json` (120 B) | انقطاع اتصال Photoshop إذا تغير المنفذ 7897 |
| **Brainferno Original Source** | `D:\MCP\Adobe-Bridge\server` | 15.65 MB | 0.3.4 (Legacy) | أرشيف مرجعي | غير مربوط حالياً | zod 3.25.76 (ثغرة GHSA) | **Archived** | نعم (موجود على D:) | لا يوجد | لا مخاطر (أرشيف غير نشط) |
| **MADEL Studio Bridge Core** | `D:\MCP\MADEL-Studio-Bridge` | 0.28 MB | 0.3.4-alpha | Node.js + Stdio | `adapters/`, `packages/`, `installers/` | Node 20+, @modelcontextprotocol/sdk | **Active Development** | نعم (موجود على D:) | لا يوجد | لا مخاطر |
| **Photoshop UXP Panel (Installed)** | `C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External\com.brainferno.mcp-bridge.photoshop_0.3.4` | 0.06 MB | 0.3.4 | Adobe UXP Host (Photoshop) | WebSocket `ws://localhost:7897` | Adobe UXP v5, Photoshop 27.8.0 | **Active (Connected)** | لا (يجب بقاؤه بمسار Adobe) | **نعم (ملف تثبيت UXP الرسمي)** | تلف تسجيل Creative Cloud إذا نقل قسراً |
| **Photoshop UXP Rebranded Source** | `D:\MCP\MADEL-Studio-Bridge\panels\panel-uxp-photoshop` | 0.12 MB | 0.3.4 | UXP Package Source | جاهز للبناء عبر CCX | UXP Manifest v5 | **Ready (Verified)** | نعم (موجود على D:) | لا يوجد | لا مخاطر |
| **Blender MCP (Server)** | `D:\MCP\blender` + `uvx mcp-for-blender` | 445.48 MB | 0.1.0+ | Python uvx + Stdio | `uvx mcp-for-blender` على المنفذ 9876 | Blender 4.x/5.x, Python, uvx | **Configured & Enabled** | نعم (المشروع على D:) | كاش uv على C: | كسر بيئة بايثون إذا نقل المسار دون ضبط `UV_CACHE_DIR` |
| **CapCut Video CLI & Automation** | `D:\MCP\Capcat` | 2,619.66 MB | Local CLI | Python CLI + JSON Engine | سكربتات تعديل `draft_content.json` | Python, ffmpeg, CapCut Desktop | **Available on D:** | نعم (موجود على D:) | مهارة Antigravity على C: | لا مخاطر (المشاريع معزولة على D:) |
| **CapCut Edit Skill** | `C:\Users\asus\.gemini\config\skills\capcut-edit` | 0.05 MB | 1.0.0 | Markdown + Agent Skill | استدعاء مهارات Antigravity | Python scripts | **Active Skill** | نعم (كود المهارة)، لكن Antigravity تقرأه من C: | نعم (مسار مهارات Antigravity) | عدم تعرف وكيل Antigravity على المهارة |
| **Chrome DevTools MCP** | `C:\Users\asus\AppData\Local\Programs\Antigravity\...\chrome-devtools-mcp` | ~12.5 MB | 0.2.0 | Node.js Stdio | `--browserUrl http://127.0.0.1:9222` | Puppeteer, Chrome DevTools Protocol | **Configured & Enabled** | مدمج داخل تثبيت Antigravity | نعم (جزء من برنامج Antigravity) | كسر حزمة البرنامج التنفيذية |
| **Stitch MCP (Google Cloud)** | `https://stitch.googleapis.com/mcp` | 0 MB (Cloud) | Remote API | Streamable HTTP | `X-Goog-Api-Key` Header | Google Stitch Service | **Configured & Active** | خادم سحابي لا يشغل مساحة | نعم (المفتاح داخل config) | لا مخاطر تخزينية |
| **`uv` Package Cache (Python/uvx)** | `C:\Users\asus\AppData\Local\uv\cache` | **11,238.91 MB** | uv latest | أدوات uvx وبناء بيئات بايثون | تخزين حزم وتوزيعات بايثون الافتراضية | Wheels, Python source builds | **Passive Cache** | **نعم (أولوية قصوى للنقل إلى D:)** | لا يتطلب بقاء ملفات إذا تم توجيه `UV_CACHE_DIR` | توقف مؤقت أثناء إعادة التنزيل إن حُذف دون نقل |
| **Claude Code Projects & Transcripts** | `C:\Users\asus\.claude\projects` | **6,550.23 MB** | Claude Code 2.1 | سجلات محادثات وملفات كاش | محلي | SQLite, JSON transcripts | **Active History** | **نعم (أرشفة السجلات القديمة إلى D:)** | ملف التكوين `~/.claude.json` (93 KB) | فقدان تاريخ المحادثات القديمة إن حذفت |
| **Antigravity Brain & Conversations** | `C:\Users\asus\.gemini\antigravity\brain` | **2,774.34 MB** | Antigravity 2.0 | سجلات وذاكرة المحادثات | محلي | Markdown artifacts, transcripts | **Active Session** | **نعم (أرشفة الجلسات المكتملة إلى D:)** | ملف التكوين ومسار الجلسة الحالية | انقطاع الجلسة الحالية إن نُقلت أثناء التشغيل |
| **Codex Runtime & Plugins Cache** | `C:\Users\asus\.codex\plugins` + `.sandbox-bin` | **949.17 MB** | Codex CLI 0.167 | بيئات حزم Codex والـ sandboxes | محلي | Node REPL, browser-service | **Active Cache** | يمكن تنظيفه وإعادة بنائه على D: | `config.toml` (5.7 KB) | إعادة تنزيل الإضافات عند أول تشغيل |
| **Temp Previews (Bridge)** | `C:\Users\asus\AppData\Local\Temp\brainferno-mcp-bridge` | 0.01 MB | Temporary | صور معاينة مؤقتة للطبقات | محلي | PNG files | **Transient** | يمكن توجيهه إلى `D:\MCP\runtime\temp` | لا يتطلب أي بقاء | لا توجد مخاطر |

---

## 3. حساب المساحة المتوقع تحريرها من القرص C: (Space Liberation Analysis)

1. **إعادة توجيه كاش `uv` (المسؤول عن حزم Python وBlender MCP):**  
   - الحجم الحالي على C:: **11,238.91 MB (~11.24 GB)**.  
   - الإجراء: ضبط متغير البيئة للنظام: `UV_CACHE_DIR=D:\MCP\runtime\uv-cache`.  
   - الوفر المحقق على C:: **11.24 GB فوراً**.
2. **أرشفة مشاريع وسجلات Claude Code القديمة (`~/.claude/projects`):**  
   - الحجم الحالي على C:: **6,550.23 MB (~6.55 GB)**.  
   - الإجراء: نقل الجلسات والمشاريع المؤرشفة غير النشطة إلى `D:\MCP\archives\claude-projects\`.  
   - الوفر المحقق على C:: **من 4 GB إلى 5.5 GB**.
3. **أرشفة جلسات Antigravity السابقة (`~/.gemini/antigravity/brain`):**  
   - الحجم الحالي على C:: **2,774.34 MB (~2.77 GB)**.  
   - الإجراء: أرشفة المحادثات السابقة المنجزة إلى `D:\MCP\archives\antigravity-sessions\`.  
   - الوفر المحقق على C:: **حوالي 2 GB**.
4. **تنظيف كاش sandboxes المؤقت لـ Codex (`~/.codex/.tmp` و `.sandbox-bin`):**  
   - الحجم الحالي على C:: **~473 MB**.  
   - الإجراء: تفريغ الملفات المؤقتة التي يعاد بناؤها تلقائياً.  
   - الوفر المحقق على C:: **~0.47 GB**.

### إجمالي المساحة المحررة المتوقعة من قرص النظام (C:):
$$\text{Total Freed Space} \approx 11.24\text{ GB} + 5.0\text{ GB} + 2.0\text{ GB} + 0.47\text{ GB} = \mathbf{18.71\text{ GB}}$$

---

## 4. الملفات التي يجب أن تبقى على القرص C: وأسبابها الفنية

| الملف / المجلد على C: | الحجم التقريبي | السبب التقني الإلزامي للبقاء على C: |
| :--- | :---: | :--- |
| `C:\Users\asus\.claude.json` | 93 KB | المسار الافتراضي الصارم والمبرمج داخل `claude.exe` لقراءة إعدادات MCP العامة. الملف يوجه الخوادم للعمل من `D:\MCP` عبر stdio. |
| `C:\Users\asus\.codex\config.toml` | 5.7 KB | المسار الافتراضي الثابت لتكوين بيئة OpenAI Codex CLI وDesktop. يشير لملفات التشغيل على `D:\MCP`. |
| `C:\Users\asus\.gemini\config\mcp_config.json` | 1 KB | ملف تكوين خوادم MCP الخاص بمنصة Google Antigravity. يشير لملفات التشغيل على `D:\MCP`. |
| `C:\Users\asus\.brainferno-mcp-bridge\bridge.json` | 120 Bytes | ملف الهاندشيك الصغير جداً الذي تقرأه لوحة Photoshop UXP عند إقلاعها لاكتشاف منفذ ورمز WebSocket. |
| `C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External\...` | 60 KB | المجلد المسجل والمعتمد رسمياً لدى تطبيق Adobe Creative Cloud Desktop ومحرك Photoshop لتحميل إضافات UXP. |
