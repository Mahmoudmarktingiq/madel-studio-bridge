# MADEL Studio Bridge — Architecture & Technical Design
**المشروع:** MADEL Studio Bridge  
**المطور والمشرف:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0-Architecture  
**تاريخ التوثيق:** 10 نوفمبر 2026

---

## 1. المخطط المعماري العام (High-Level Architecture)

```mermaid
flowchart TD
    subgraph AIClients ["عملاء الذكاء الاصطناعي (AI Clients)"]
        AGY["Google Antigravity"]
        CLAUDE["Claude Code CLI"]
        CODEX["OpenAI Codex CLI"]
        OTHER["Other MCP Clients\n(Cursor, VS Code)"]
    end

    subgraph IPC ["قنوات الاتصال المحلية (Local IPC)"]
        PIPE["Windows Named Pipe\n\\\\.\\pipe\\brainferno-mcp-bridge"]
        STDIO["Stdio Server Transport\n(Per-Client Session)"]
    end

    subgraph CoreEngine ["نواة منصة MADEL Studio Bridge"]
        ROUTER["MCP Core Router & Session Registry"]
        SUPERVISOR["Process Supervisor & Health Watchdog"]
        CAP_REG["Capability & Tool Registry"]
        SEC_GATE["Security & Sandbox Gate\n(Raw Scripts: OFF | Insecure: OFF)"]
    end

    subgraph Adapters ["محولات التطبيقات (Application Adapters)"]
        AD_PS["Photoshop Adapter\n(UXP BatchPlay / DOM)"]
        AD_BL["Blender Adapter\n(Python uvx 9876)"]
        AD_CP["CapCut Adapter\n(Project JSON / CLI)"]
        AD_PR["Premiere Pro Adapter\n(UXP API)"]
        AD_OTHER["Illustrator / AE / AME\n(Extensibility APIs)"]
    end

    subgraph TargetApps ["برامج الإنتاج والتصميم المستهدفة"]
        PS_APP["Adobe Photoshop 2026\n(Panel: MADEL Studio Bridge)"]
        BL_APP["Blender 4.x / 5.x\n(Socket 9876)"]
        CP_APP["CapCut Desktop\n(Draft Projects)"]
        PR_APP["Adobe Premiere Pro\n(UXP Host)"]
    end

    AIClients -->|Stdio Stream| STDIO
    STDIO -->|Local Connect| PIPE
    PIPE --> ROUTER
    ROUTER --> SEC_GATE
    SEC_GATE --> CAP_REG
    CAP_REG --> Adapters

    AD_PS -->|WebSocket ws://localhost:7897| PS_APP
    AD_BL -->|Local Socket| BL_APP
    AD_CP -->|File & CLI Automation| CP_APP
    AD_PR -->|WebSocket Loopback| PR_APP
```

---

## 2. الأنظمة الفرعية العشرة للمنصة (The 10 Core Subsystems)

### 1. النواة المركزية لـ MCP (MCP Core Engine):
- تستقبل تدفقات JSON-RPC القياسية عبر موصلات Stdio لكل عميل على حدة.
- تدير جلسات العملاء المتزامنة وتربط كل جلسة بنسخة معزولة من `McpServer` تتشارك نفس حالة التشغيل `Runtime`.

### 2. محولات التطبيقات المعيارية (Application Adapters):
- تطبق نمط التصميم **Adapter Pattern** بحيث يمتلك كل برنامج (Photoshop، Blender، CapCut) محولاً مستقلاً تماماً ومفصولاً عن الآخر.
- يوفر المحول دوال موحدة: `detect()`, `connect()`, `disconnect()`, `listCapabilities()`, `execute()`, `healthCheck()`.

### 3. موصلات العملاء (Client Connectors):
- وحدات تكوين سريعة لقراءة وكتابة إعدادات العملاء المدعومة:
  - Antigravity: `~/.gemini/config/mcp_config.json`
  - Claude Code: `~/.claude.json`
  - OpenAI Codex: `~/.codex/config.toml`

### 4. مدير المهارات (Skills Manager):
- يربط الأدوات البرمجية المعقدة بملفات تعليمات الوكلاء (Agent Skills) مثل مهارة `capcut-edit` ومهارات الرسم ثلاثي الأبعاد لـ Blender.

### 5. بوابة الأمان والصلاحيات (Security & Permissions Gate):
- تطبيق مبدأ **Least Privilege**:
  - `BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0` (حظر السكربتات العشوائية افتراضياً).
  - `BRAINFERNO_MCP_BRIDGE_INSECURE=0` (فرض مصادقة التوكن).
  - حظر الاتصال عبر `0.0.0.0` وحصر الشبكة على Loopback `127.0.0.1` و `localhost`.

### 6. خدمة استكشاف البرامج (Application Discovery Service):
- فحص مسارات التثبيت في ويندوز وسجلات النظام (Registry / Program Files / AppData) لاكتشاف وجود التطبيقات وإصداراتها الدقيقة قبل محاولة ربطها.

### 7. مدير التشخيص والاتصال (Connection & Diagnostic Manager):
- التحقق اللحظي من حالة المقابس والمنافذ (`7897`, `9876`) وقراءة حالة الاتصال عبر أداة `cc_connected_apps` الموحدة.

### 8. مدير الحزم والمثبت الموحد (Installer & Package Manager):
- تجميع إضافات UXP في حزم CCX رسمية (`MADEL-Studio-Bridge-Photoshop.ccx`)، وتوليد ملفات التكوين التلقائية.

### 9. نظام السجلات والتدقيق (Logs & Audit System):
- توحيد سجلات الخوادم واللوحات في مجلد `D:\MCP\logs\` ومطابقة السجلات الميدانية للوحة Photoshop.

### 10. محرك التحديث والتراجع (Update & Rollback Engine):
- إدارة النسخ الاحتياطية واسترجاع الإعدادات بضغطة زر عند الرغبة في التراجع أو التحديث.

---

## 3. معمارية مضاعفة الاتصال المحلي (Named Pipe Multiplexer Architecture)

لحل مشكلة تنازع المنفذ 7897 بين عملاء الذكاء الاصطناعي:
1. **Primary Daemon:** العملية الأولى التي تبدأ تربط مقبس WebSocket على المنفذ `7897` لاستقبال لوحة Photoshop، وتفتح مستمع الأنبوب المسمى:
   `\\.\pipe\brainferno-mcp-bridge`
2. **Client Multiplexers:** أي عملية ثانية أو ثالثة (سواء استدعاها Claude Code أو Codex أو Antigravity) تفحص الأنبوب المسمى، وبمجرد اكتشافه تتصل به فوراً وتقوم بتمرير (pipe) تدفقات Stdio إلى الخادم الأساسي.
3. **النتيجة:** صفر تضارب في المنافذ، صفر كتابة مكررة لملف `bridge.json`، وجلسات متزامنة كاملة ومستقرة.

---

## 4. نظام سياق الطلب وإدارة التزامن في البوابة (Gateway Request Scoping & Concurrency — P17)

لإدارة الطلبات المتزامنة بأمان دون حدوث تضارب في محركات التطبيقات أحادية المسار (Single-Threaded Engines):

1. **سياق الطلب غير المتزامن (AsyncLocalStorage Request Context):**
   - توليد `requestId` و `correlationId` فريدين لكل طلب وتمريرهما تلقائياً عبر سلاسل الـ Promises.
   - ربط إشارة إلغاء `AbortSignal` بالطلب لإلغاء العمليات فور انقطاع العميل.
   - حجب وتطهير كامل لأي أسرار أو مفاتيح أو بيانات شخصية.

2. **منظم العمليات المقيد (Bounded FIFO WorkLimiter):**
   - طابور FIFO صارم يحدد الحد الأقصى للمهام النشطة والمهام المنتظرة.
   - تطبيق ضغط عكسي (Backpressure) فوري عند امتلاء الطابور برمز `QUEUE_OVERFLOW` (-32001).
   - مهلة مزدوجة: مهلة انتظار الطابور (`queueWaitTimeoutMs`) ومهلة التنفيذ القصوى (`executionTimeoutMs`).

3. **الطوابير المعزولة حسب نطاق المورد (Resource-Scoped Concurrency Manager):**
   - عزل طوابير التطبيقات المستقلة؛ عمليات Photoshop لا تحظر عمليات Blender أو معالجات FFmpeg الصوتية.
   - تسلسل إجباري للعمليات المعدلة للمستندات والمشاهد (`photoshop:mutation`, `blender:mutation`).
   - إخلاء فوري للمهام المعلقة لعميل معين عند انقطاع اتصاله (`cancelTasksForClient`).

4. **مقاييس الرصد والمراقبة اللحظية (Observability & Metrics):**
   - قياس وتتبع لحظي لعدد الطلبات النشطة، والمنتظرة، والمكتملة، والملغاة، ومتوسط زمن الانتظار والتنفيذ.
   - توفير لقطات إحصائية (Snapshots) جاهزة للربط مع لوحة التحكم المستقبلية (P19 Dashboard).

---

## 5. المدير الموحد لعملاء الذكاء الاصطناعي ونظام التكوين الذري (Unified AI Client Manager & Atomic Config Subsystem — P18)

لإدارة اكتشاف وتكوين عملاء الذكاء الاصطناعي بأعلى معايير الأمان الموثوقة:

1. **السجل التعريفي الشامل (Declarative Client Registry):**
   - تعريف تصريحي متكامل لـ 17+ عميل ذكاء اصطناعي (Claude Code, Claude Desktop, OpenAI Codex, Google Antigravity, Gemini CLI, Cursor, VS Code, VS Code Insiders, Windsurf, Cline, Roo Code, Continue, OpenCode, JetBrains, GitHub Copilot, Goose, Generic MCP).
   - اعتماد مسارات ديناميكية خالية تماماً من المسارات الصلبة (Zero Hardcoded Paths) بالاعتماد على متغيرات بيئة النظام (`%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%`, `$HOME`).
   - دعم التوسع الديناميكي عبر واجهة تسجيل برمجية (`register(client)`).

2. **محرك الاكتشاف غير التدخلي (Non-Invasive Discovery Engine):**
   - فحص آمن ومقروء فقط (Read-Only) لمسارات التثبيت، والملفات التنفيذية، والعمليات النشطة، وملفات الإعدادات.
   - تحديد دقيق لحالة العميل عبر 7 حالات محددة: `not_installed`, `installed`, `detected`, `configured`, `connected`, `unsupported`, `not_verified`.

3. **المحللات المعيارية متعددة الصيغ (Multi-Format Parsers):**
   - معالجة سلسة لأربع صيغ تكوين شائعة:
     - **JSON:** التكوين القياسي لمعظم العملاء.
     - **JSONC:** تجريد آمن للتعليقات أحادية ومتعددة الأسطر مع حماية علامات التنصيص والروابط.
     - **TOML:** محلل مستقل ونظيف تماماً (Clean-Room) لهيكل تكوين OpenAI Codex (`[mcp_servers]`).
     - **YAML:** محلل هرمي متدرج لقوائم وإعدادات عملاء مثل Goose.

4. **محرك الكتابة الذرية ذو الخطوات التسع (9-Step High-Assurance Atomic Writer):**
   - **الخطوة 1:** حساب بصمة SHA-256 للملف الحالي قبل أي تعديل.
   - **الخطوة 2:** إنشاء نسخة احتياطية مختومة بالوقت (`.bak.<timestamp>`) تلقائياً.
   - **الخطوة 3:** فحص تصادم التعديلات الخارجية (Anti-Race Condition check).
   - **الخطوة 4:** كتابة البيانات الجديدة إلى ملف مؤقت عشوائي في نفس المجلد الأصلي لضمان تجنب عبر حدود وسائط التخزين (Cross-Device Move).
   - **الخطوة 5:** فحص ومطابقة محتوى وبصمة الملف المؤقت قبل النقل.
   - **الخطوة 6:** استبدال الملف الأصلي ذرياً عبر `fs.rename` مع حلقة إعادة محاولة ذكية (Retry Loop with Jitter) لتجاوز أقفال ملفات ويندوز المؤقتة (`EBUSY` / `EPERM`).
   - **الخطوة 7:** التأكد النهائي من وجود وبصمة الملف المستبدل.
   - **الخطوة 8:** تنظيف أي ملفات مؤقتة متبقية.
   - **الخطوة 9:** الاسترجاع التلقائي (Automatic Rollback) للنسخة الاحتياطية الأصلية في حال حدوث أي خطأ طارئ.

5. **سياسة الحفاظ التام على الإعدادات المسبقة (Preservation Policy):**
   - الحفاظ الإلزامي بنسبة 100% على خوادم MCP التابعة لأطراف أخرى والموجودة مسبقاً في ملفات تكوين العميل.
   - الحفاظ على الحقول الإضافية وإعدادات واجهات المستخدم دون حذف أو تشويه.

6. **واجهة سطر الأوامر (CLI) والواجهة البرمجية (API):**
   - توفير أدوات سطر أوامر متكاملة: `madel clients [list|detect|inspect|plan|connect|disconnect|backup|restore|verify]`.
   - توفير واجهة برمجية TypeScript جاهزة للربط المباشر مع واجهة التحكم المستقبلية (P19 Desktop Dashboard).

---

## 6. تطبيق سطح المكتب الأصلي وشريط المهام لويندوز (Native Desktop Dashboard & System Tray — P19)

بناء تطبيق مكتبي أصلي متكامل يجمع بين السرعة الفائقة والأمان الهندسي لمراقبة وإدارة المنصة:

1. **حزمة التقنيات المعتمدة (Technology Stack):**
   - **Tauri v2:** إطار عمل مكتبي خفيف وسريع يعتمد لغة Rust لتقليل استهلاك الذاكرة (RAM < 45 MB).
   - **Vue 3 + Pinia + TypeScript:** إدارة حالة استجابية حديثة ومكونات واجهة نموذجية.
   - **Microsoft Edge WebView2:** محرك عرض صفحات نظام ويندوز الافتراضي دون تضمين متصفحات ثقيلة كـ Chromium.
   - **Vite 6:** بيئة بناء فائقة السرعة بزمن توليد حزم 722 مللي ثانية.

2. **قناة الاتصال الآمنة (Secure IPC Bridge):**
   - استدعاء عمليات محددة فقط عبر وسيط `bridge-rpc.js` بالاعتماد على `std::process::Command::new("node")` دون وسيط شل ودون إمكانية حقن الأوامر.
   - حظر كامل لاستدعاء أي أوامر نظام أو Shell من الواجهة الرسومية.
   - حظر فتح أي منافذ شبكية جديدة أو تشغيل ديمون مكرر (No Secondary Daemon).

3. **سلوك شريط المهام ودورة حياة النافذة (System Tray & Lifecycle):**
   - دمج أيقونة مخصصة في منطقة الإشعارات (Tray Icon) مع قائمة سريعة للتحكم.
   - تطبيق قاعدة **`Close Window != Stop All MCP Servers`**؛ إغلاق النافذة يخفيها فقط ويحافظ على استمرار خوادم MCP في العمل لخدمة نماذج الذكاء الاصطناعي دون انقطاع.

4. **نظام التصميم المستقل (Visual Design System):**
   - واجهة مستوحاة من Microsoft Fluent و Apple HIG.
   - وضع ليلي أساسي (Fluent Obsidian) ووضع نهاري اختياري (Fluent Clean).
   - دعم التدويل واللغة العربية (i18n & RTL Ready).



