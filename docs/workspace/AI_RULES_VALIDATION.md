# MADEL Studio Bridge — التحقق الفعلي من قواعد الذكاء الاصطناعي (AI Rules Validation)
**المسار الرئيسي:** `D:\MCP`  
**المالك:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0 — MULTI-CLIENT RULES COMPLIANCE  

---

## 1. الدستور الأساسي الموحد (Single Source of Truth)

تؤكد هذه الوثيقة أن ملف [`D:\MCP\AGENTS.md`](file:///D:/MCP/AGENTS.md) هو المرجع الأساسي والوحيد الملزم لجميع أنظمة ووكلاء ونماذج الذكاء الاصطناعي التي تتعامل مع مساحة العمل `D:\MCP`.

كافة الملفات الأخرى (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`, إلخ) لا تحتوي على قواعد مستقلة أو متعارضة، بل تعمل كمحولات توجيهية (Routing Shims) ترشد الوكيل المعني لقراءة وتطبيق قواعد `AGENTS.md`.

---

## 2. مصفوفة التحقق من آليات تحميل التعليمات لكل عميل

| العميل / الأداة | الملف المستخدم | آلية التحميل الموثقة رسمياً | نتيجة الفحص الفعلي | ملاحظات تقنية |
| :--- | :--- | :--- | :---: | :--- |
| **Google Antigravity** | `D:\MCP\AGENTS.md` | قراءة قواعد مساحة العمل تلقائياً عند فتح مجلد العمل | **PASS (NATIVE)** | يقرأ `AGENTS.md` كأولوية قصوى. |
| **Claude Code** | `D:\MCP\CLAUDE.md` | قراءة `CLAUDE.md` تلقائياً من جذر مساحة العمل في بداية كل جلسة | **PASS (NATIVE)** | تم إثبات قراءته؛ يحيل بدقة إلى `AGENTS.md`. |
| **OpenAI Codex** | `D:\MCP\CODEX.md` | تعليمات سياق المشروع أو التوجيه الصريح | **VERIFIED** | وجود `CODEX.md` يخدم السياق؛ يتم تضمين الإحالة لـ `AGENTS.md`. |
| **Cursor IDE** | `.cursorrules`<br>`.cursor\rules\workspace.mdc` | قراءة تلقائية لقواعد MDC الشاملة `**/*` مع `alwaysApply: true` | **PASS (NATIVE)** | مدعوم في محررات Cursor الحديثة. |
| **Windsurf IDE** | `.windsurfrules` | قراءة تلقائية لقواعد Windsurf في سياق المحادثة | **PASS (NATIVE)** | مدعوم رسمياً. |
| **Cline (VS Code)** | `.clinerules` | تحميل التعليمات في برومبت النظام المخصص لـ Cline | **PASS (NATIVE)** | مدعوم رسمياً. |
| **Roo Code** | `.roomodes`<br>`.roo\rules.md` | تعريف نمط مخصص وقواعد دائمة للوضع | **PASS (NATIVE)** | مدعوم رسمياً. |
| **VS Code Agents** | `.vscode\settings.json` | تصفية ملفات التبعيات والكاش لتقليل تشويش البحث | **PASS (NATIVE)** | مدعوم رسمياً. |

---

## 3. الضمانات البرمجية لمنع اختراق الهيكل

تم دمج التحقق الأمني داخل أداة مولد المشاريع [`generator.js`](file:///D:/MCP/01-Projects/Source/MADEL-Studio-Bridge/tools/project-generator/generator.js) بحيث:
1. يمنع منعاً باتاً إنشاء أي مشروع مباشرة داخل جذر `D:\MCP`.
2. يتم رفض أي مسار سطحي لا ينتمي إلى أحد المجلدات الرئيسية المعتمدة (`01-Projects` إلى `11-Other-Apps`).
3. يتم إجبار الوكيل أو المطور على تحديد التطبيق والبراند واسم المشروع قبل إنشاء أي مجلد.
