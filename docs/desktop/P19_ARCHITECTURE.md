# MADEL Studio Bridge — معمارية تطبيق سطح المكتب (P19 Desktop Architecture)
**المشروع:** MADEL Studio Bridge — Phase P19  
**المالك والمهندس المشرف:** محمود عادل — Mahmoud Adel  
**المسار المصدري:** `apps/desktop/`  
**تاريخ التوثيق:** 10 نوفمبر 2026  
**الإصدار:** 0.5.0-Desktop

---

## 1. المخطط المعماري العام (System Architecture Overview)

```mermaid
flowchart TD
    subgraph UI ["الواجهة الأمامية (Vue 3 + Pinia + TypeScript)"]
        SHELL["App Shell (App.vue)"]
        ROUTER["Navigation Tabs"]
        STORES["Pinia Stores\n(Gateway, Clients, Apps, Servers, Activity, Settings)"]
        VIEWS["Modular Views\n(Dashboard, Apps, Clients, Servers, Logs, Diag, Settings)"]
        COMPONENTS["Reusable Fluent Components\n(MetricCard, StatusBadge, DiffViewer, ConfirmModal)"]
    end

    subgraph TAURI ["طبقة تطبيق ويندوز الأصلية (Tauri v2 Core - Rust)"]
        WEBVIEW["Windows WebView2 Runtime"]
        TRAY["Windows System Tray & Notification Icon"]
        CMD_ROUTER["Restricted Tauri IPC Command Handlers\n(Least Privilege - No Arbitrary Shell)"]
        LIFECYCLE["Window Lifecycle Manager\n(Close Requested -> Hide Window)"]
    end

    subgraph IPC ["قناة الاتصال الآمنة (Local Safe IPC Dispatcher)"]
        DISPATCHER["Desktop Bridge RPC Runner\n(packages/server/dist/desktop/bridge-rpc.js)"]
    end

    subgraph CORE ["نواة منصة MADEL Studio Bridge (Node.js Core)"]
        GW["P17 Core Gateway & Concurrency\n(WorkLimiter, Metrics, RequestContext)"]
        CM["P18 AI Client Manager\n(Declarative Registry, Atomic Writer, 17 Clients)"]
        DAEMON["Primary Daemon (Photoshop 2026)\n(PID 15940, WebSocket ws://127.0.0.1:7897)"]
        PIPE["Windows Named Pipe Multiplexer\n(\\\\.\\pipe\\brainferno-mcp-bridge)"]
    end

    SHELL --> ROUTER
    ROUTER --> VIEWS
    VIEWS --> STORES
    STORES -->|Tauri Invoke| WEBVIEW
    WEBVIEW --> CMD_ROUTER
    CMD_ROUTER --> DISPATCHER
    DISPATCHER --> GW
    DISPATCHER --> CM
    DISPATCHER --> DAEMON
    DISPATCHER --> PIPE

    TRAY -.->|Show / Focus / Events| WEBVIEW
    LIFECYCLE -.->|Intercept Close| TRAY
```

---

## 2. الأنظمة الفرعية للواجهة وتطبيق سطح المكتب (Desktop Subsystems)

### 1. غلاف التطبيق وهيكل التصفح (App Shell & Navigation):
- تصميم سطح مكتب استجابي يعتمد إطار Microsoft Fluent و Apple HIG.
- شريط علوي (`AppHeader.vue`) يعرض حالة البوابة اللحظية، ومؤشرات الاتصال، وزر التحديث الفوري، ومبدل الوضع الليلي والنهاري، واختيار اللغة (EN / AR).
- قائمة جانبية عمودية ثابتة (`AppSidebar.vue`) للتنقل السريع بين الأقسام السبعة دون إعادة تحميل الصفحة.
- شريط سفلي (`AppFooter.vue`) يعرض رقم العملية الحالية، وحالة الأنبوب المسمى، ومعلومات حقوق التطوير ("Developed and maintained by Mahmoud Adel").

### 2. إدارة الحالة المركزية (Pinia Stores):
- **`useGatewayStore`**: مراقبة ومزامنة حالة خادم البوابة وإحصائيات التزامن الحقيقية من P17 كل 5 ثوانٍ.
- **`useClientsStore`**: إدارة استكشاف العملاء، وفحص التكوين، وتوليد الفوارق (Diff Preview)، وتطبيق التعديل الذري مع النسخ الاحتياطي التلقائي.
- **`useAppsStore`**: تصنيف البرامج حسب مستوى الجاهزية الفعلي وعزل البرامج قيد التخطيط.
- **`useServersStore`**: تدقيق خوادم وقنوات MCP وعدد الأدوات المتاحة.
- **`useActivityStore`**: تجميع وتصفية سجلات الأحداث وتطهير البيانات الحساسة ونسخ تقارير التشخيص.
- **`useSettingsStore`**: إدارة تفضيلات المظهر، وسلوك شريط المهام، وبدء التشغيل، واللغة.

### 3. معمارية التوصيل الآمن بين Rust ونواة MADEL (Safe IPC Bridge Architecture):
- **حظر تام للأوامر العشوائية:** لا يُسمح للواجهة الرسومية بتنفيذ أي أوامر Shell مباشرة.
- **المنفذ الحصري المعتمد:** تقوم دالة `invoke_bridge_op` في لغة Rust باستدعاء ملف `bridge-rpc.js` المبني والموثوق حصراً باستخدام `std::process::Command::new("node")` دون وسيط شل.
- **التحقق الصارم من العمليات:** تقبل النواة 12 عملية محددة فقط ضمن قائمة بيضاء (Whitelist). أي عملية غير مصرح بها تُرفض فوراً.
- **حماية العمليات قيد التشغيل:** لا يقوم التطبيق بإعادة تشغيل خادم Photoshop أو إيقافه أو إنشاء ديمون مكرر (No Secondary Daemon).

### 4. سلوك ودورة حياة شريط المهام (Windows System Tray Lifecycle):
- دمج أيقونة مخصصة في منطقة الإشعارات بجوار ساعة ويندوز عبر `TrayIconBuilder`.
- القائمة السريعة:
  1. **Open MADEL Studio Bridge:** إظهار النافذة والتركيز عليها.
  2. **Gateway Status: Active:** بيان حالة البوابة.
  3. **Open Diagnostics:** فتح شاشة الفحص والتشخيص مباشرة.
  4. **Settings:** فتح شاشة الإعدادات.
  5. **Quit MADEL Desktop:** إنهاء تطبيق الواجهة الرسومية فقط.
- **قاعدة فصل النافذة عن الخوادم (Close Window ≠ Stop MCP Servers):**  
  عند النقر على زر إغلاق النافذة `[X]`، يتم اعتراض الحدث عبر `WindowEvent::CloseRequested` وإخفاء النافذة في منطقة الإشعارات دون إيقاف خوادم MCP، لحماية جلسات Claude Code و OpenAI Codex و Google Antigravity النشطة.
