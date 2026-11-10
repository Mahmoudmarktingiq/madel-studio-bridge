# MADEL Studio Bridge — Compatibility Matrix & Client Guidelines
**المشروع:** MADEL Studio Bridge  
**المطور والمشرف:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0-Compatibility  
**تاريخ التوثيق:** 10 نوفمبر 2026

---

## 1. مصفوفة توافق البرامج الإبداعية (Creative Applications Matrix)

| التطبيق | الإصدارات المتوافقة | نظام التشغيل المدعوم | نوع التكامل | حالة الاختبار الفعلي |
| :--- | :---: | :---: | :---: | :---: |
| **Adobe Photoshop** | 2026 (v27.8.0+ / Architecture PHSP) | Windows 11 / 10 (x64) | Native UXP WebSocket | **LIVE TESTED: PASS (100%)** |
| **Blender** | 4.0, 4.1, 4.2, 5.0 (Beta) | Windows 11 / 10 (x64) | Python uvx Daemon (Socket 9876) | **CONFIGURED & ACTIVE** |
| **CapCut Desktop** | 3.x, 4.x, 5.x (Global & JianYing) | Windows 11 / 10 (x64) | Project CLI + Agent Skill | **AVAILABLE ON D: (TESTED)** |
| **Adobe Premiere Pro** | 2025 (v25.6+), 2026 | Windows 11 / 10 (x64) | Native UXP Extension | **ARCHITECTURE READY (Phase P4)** |
| **Adobe Illustrator** | 2024, 2025, 2026 | Windows 11 / 10 (x64) | COM Scripting / Native MCP | **COMPATIBLE** |
| **Adobe After Effects** | 2024, 2025, 2026 | Windows 11 / 10 (x64) | CEP Panel + aerender | **COMPATIBLE** |
| **Adobe Media Encoder** | 2024, 2025, 2026 | Windows 11 / 10 (x64) | Headless Web Service (:8080) | **COMPATIBLE** |

---

## 2. مصفوفة توافق عملاء ومنصات الذكاء الاصطناعي (AI Clients Matrix)

| عميل الذكاء الاصطناعي (AI Client) | بروتوكول النقل (Transport) | ملف الإعداد المعتمد | بيئة التشغيل | حالة التحقق الميداني |
| :--- | :---: | :--- | :---: | :---: |
| **Google Antigravity** | `stdio` + Named Pipe | `~/.gemini/config/mcp_config.json` | IDE / Agent | **LIVE: PASS (تم التحقق وإنشاء PSD)** |
| **Claude Code** | `stdio` + Named Pipe | `~/.claude.json` | Terminal CLI | **LIVE: PASS (تم التحقق وإنشاء PSD)** |
| **OpenAI Codex** | `stdio` + Named Pipe | `~/.codex/config.toml` | Terminal CLI | **LIVE: PASS (تم التحقق وإنشاء PSD)** |
| **Gemini CLI** | `stdio` | `~/.gemini/settings.json` | CLI | **COMPATIBLE** |
| **Cursor IDE** | `stdio` | Cursor MCP Settings | Desktop IDE | **COMPATIBLE** |
| **VS Code (Copilot / Cline / Roo)** | `stdio` | VS Code MCP JSON | Desktop IDE | **COMPATIBLE** |
| **Windsurf / Continue** | `stdio` | Config JSON | Desktop IDE | **COMPATIBLE** |

---

## 3. إيضاح هام وحاسم: الفرق بين ChatGPT و OpenAI Codex

> [!IMPORTANT]
> **توضيح الحدود التقنية الحقيقية:**
> - **OpenAI Codex (Codex CLI / Codex App):** هو بيئة مطور محلية متكاملة تدعم بروتوكول Model Context Protocol (MCP) بشكل مباشر وأصيل عبر Stdio، وتستطيع تشغيل أوامر محرك Windows والتحكم ببرامج Adobe وBlender محلياً داخل الحاسبة.
> - **ChatGPT (موقع الويب وتطبيق المحادثة العام):** هو نموذج دردشة سحابي لا يمتلك وصولاً مباشراً إلى قنوات Stdio أو أنابيب Named Pipes المحلية على جهازك. لا يمكن لـ ChatGPT السحابي التحكم في Photoshop المثبت على حاسبتك إلا من خلال خادم MCP سحابي عام مع فتح منافذ ومصادقة سحابية معقدة وهو ما يتعارض مع مبدأ الأمان المحلي (Local-First).
> - **الخلاصة:** MADEL Studio Bridge يدعم تكامل **OpenAI Codex** المحلي الكامل، ولا يدّعي التحكم السحابي المباشر عبر واجهة ChatGPT العادية حفاظاً على دقة التوصيف التقني.
