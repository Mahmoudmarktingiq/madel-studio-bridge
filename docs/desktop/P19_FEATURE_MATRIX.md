# MADEL Studio Bridge — مصفوفة ميزات تطبيق سطح المكتب (P19 Feature Matrix)
**المشروع:** MADEL Studio Bridge — Phase P19  
**المالك والمهندس المشرف:** محمود عادل — Mahmoud Adel  
**تاريخ التوثيق:** 10 نوفمبر 2026  
**الإصدار:** 0.5.0-Desktop  

---

## 1. مصفوفة صفحات وشاشات التطبيق (Page Capabilities Matrix)

| الصفحة (View) | الميزات الرئيسية المنفذة | مصدر البيانات (Data Source) | حالة التحقق (Validation) |
| :--- | :--- | :--- | :---: |
| **لوحة التحكم (Dashboard)** | - مؤشرات حية لحالة البوابة (Running / Disconnected / Not Verified)<br>- 6 بطاقات مقاييس تزامن P17 (Active, Queue, Completed, Failed, Waits, Times)<br>- ملخص سريع لتطبيقات التصميم والعملاء<br>- جدول تدفق أحداث MCP الحديثة | `get_gateway_status`<br>`globalMetricsTracker` (P17)<br>`bridge.json` Handshake | **VERIFIED (LIVE)** |
| **التطبيقات (Applications)** | - فحص 8 تطبيقات إبداعية ومكتبية (Photoshop, Blender, CapCut, Illustrator, Premiere, AE, Browser, Office)<br>- التمييز الصارم بين 5 مستويات جاهزية<br>- حظر التحكم التشغيلي للتكاملات غير المكتملة | `get_applications_status`<br>فحص مقابس 7897 و 9876<br>فحص مسارات CapCut الفعلية | **VERIFIED (LIVE)** |
| **عملاء الذكاء الاصطناعي (AI Clients)** | - مصفوفة 17 عميل ذكاء اصطناعي من سجل P18<br>- فحص مسارات التثبيت والتكوين دون مسارات صلبة<br>- معاينة الفوارق (Diff Preview) قبل التعديل<br>- الربط والفصل الذري مع النسخ الاحتياطي التلقائي<br>- الحفاظ التام على خوادم الأطراف الثالثة | `getClientsStatus`<br>`planConnect` / `applyConnect`<br>`planDisconnect` / `applyDisconnect`<br>`restoreClient` | **VERIFIED (LIVE)** |
| **خوادم MCP (Servers)** | - فحص خادم Photoshop الأساسي (129 أداة مسجلة)<br>- فحص مستمع الأنبوب المسمى Windows Named Pipe<br>- فحص خدمة Blender ومحول CapCut<br>- عرض التشخيصات وحالة المقابس والمنافذ | `get_servers_status`<br>فحص المنافذ والعمليات | **VERIFIED (LIVE)** |
| **النشاط والسجلات (Activity & Logs)** | - تدفق السجلات المنظمة لمعرفات الارتباط (Correlation IDs)<br>- تصفية حسب التطبيق وحسب مستوى الخطورة<br>- تطهير تلقائي للأسرار والمفاتيح والتوكنات<br>- نسخ تقرير تشخيصي آمن للحافظة | `get_activity_logs`<br>خوارزمية `redactSecrets` | **VERIFIED (LIVE)** |
| **التشخيص المتقدم (Diagnostics)** | - فحص ذاكرة V8 (Heap Used, Heap Total, RSS)<br>- فحص إصدار Node.js ومنصة ويندوز<br>- التحقق من مسار وبصمة ملف المصافحة<br>- إحصائيات العملاء المسجلين والمهيئين | `get_system_diagnostics`<br>`process.memoryUsage()` | **VERIFIED (LIVE)** |
| **الإعدادات (Settings)** | - التبديل الفوري بين الوضع الليلي (Dark) والنهاري (Light)<br>- سلوك التصغير لشريط المهام عند إغلاق النافذة<br>- خيار التشغيل عند بدء ويندوز (معطل افتراضياً)<br>- التبديل بين الواجهة الإنجليزية والعربية | `useSettingsStore`<br>تطبيق خواص DOM والـ CSS | **VERIFIED (LIVE)** |

---

## 2. مصفوفة تطبيقات التصميم المستهدفة ومستوى الدعم (Applications Support Matrix)

| التطبيق (Host Application) | الفئة | حالة الدعم الفعلية المرصودة | طبقة المحول البرمجي (Adapter) | إمكانية التحكم المباشر |
| :--- | :---: | :---: | :--- | :---: |
| **Adobe Photoshop 2026** | Design | **Supported & Verified** | UXP BatchPlay WebSocket (`ws://127.0.0.1:7897`) | **نعم (Active)** |
| **Blender 4.x / 5.x** | 3D | **Configured (Awaiting Launch)** | Python Socket Server (`127.0.0.1:9876`) | معطل حتى الاتصال |
| **CapCut Desktop** | Video | **Configured (Draft Store Detected)** | Draft JSON & CLI Skill | معطل حتى الطلب |
| **Adobe Illustrator** | Design | **Planned (Phase P21)** | UXP / ExtendScript Vector Engine | معطل (مخطط) |
| **Adobe Premiere Pro** | Video | **Planned (Phase P22)** | UXP Sequence & Timeline Automation | معطل (مخطط) |
| **Adobe After Effects** | Video | **Planned (Phase P24)** | ExtendScript Composition Renderer | معطل (مخطط) |
| **Browser MCP** | Browser| **Planned (Phase P23)** | Puppeteer / Chrome DevTools Protocol | معطل (مخطط) |
| **Office Automation** | Office | **Planned (Phase P24)** | Word / Excel / PowerPoint Automation | معطل (مخطط) |

---

## 3. مصفوفة السجل التعريفي لعملاء الذكاء الاصطناعي الـ 17 (AI Clients Matrix)

| العميل (AI Client) | صيغة الملف | وسيلة النقل | الحالة الميدانية على جهاز المطور | مسار التكوين القياسي |
| :--- | :---: | :---: | :---: | :--- |
| **Claude Code CLI** | JSON | Stdio | **Configured** | `%USERPROFILE%\.claude.json` |
| **OpenAI Codex CLI** | TOML | Stdio | **Configured** | `%USERPROFILE%\.codex\config.toml` |
| **Google Antigravity** | JSON | Stdio | **Configured** | `%USERPROFILE%\.gemini\config\mcp_config.json` |
| **Claude Desktop** | JSON | Stdio | Not Installed | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Cursor** | JSON | Stdio | Not Installed | `%USERPROFILE%\.cursor\mcp.json` |
| **VS Code** | JSONC | Stdio | Not Installed | `%APPDATA%\Code\User\mcp.json` |
| **VS Code Insiders** | JSONC | Stdio | Not Installed | `%APPDATA%\Code - Insiders\User\mcp.json` |
| **Windsurf** | JSON | Stdio | Not Installed | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| **Cline** | JSON | Stdio | Not Installed | `%APPDATA%\Code\User\globalStorage\...\settings.json` |
| **Roo Code** | JSON | Stdio | Not Installed | `%APPDATA%\Code\User\globalStorage\...\settings.json` |
| **Continue** | JSON | Stdio | Not Installed | `%USERPROFILE%\.continue\config.json` |
| **OpenCode** | JSON | Stdio | Not Installed | `%USERPROFILE%\.opencode\mcp.json` |
| **JetBrains** | JSON | Stdio | Not Installed | `%APPDATA%\JetBrains\mcp.json` |
| **GitHub Copilot CLI**| JSON | Stdio | Not Installed | `%USERPROFILE%\.copilot\mcp-config.json` |
| **Goose CLI** | YAML | Stdio | Not Installed | `%USERPROFILE%\.config\goose\config.yaml` |
| **Gemini CLI** | JSON | Stdio | Not Installed | `%USERPROFILE%\.gemini\mcp.json` |
| **Generic MCP** | JSON | Stdio | Configurable | Custom Path |
