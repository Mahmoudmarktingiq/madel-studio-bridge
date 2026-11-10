# MADEL Studio Bridge — قواعد توجيه وكلاء ونماذج الذكاء الاصطناعي (AI Workspace Rules)
**المسار الرئيسي:** `D:\MCP`  
**المالك:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0 — MULTI-CLIENT AI SPECIFICATION  

---

## 1. مبدأ المرجع الموحد (Single Source of Truth)

تعتمد مساحة عمل `D:\MCP` وثيقة [`AGENTS.md`](file:///D:/MCP/AGENTS.md) بصفتها **الدستور والمرجع الأعلى** الملزم لجميع أنظمة ونماذج ووكلاء الذكاء الاصطناعي دون استثناء.

أي عميل أو إضافة تفتح مجلد `D:\MCP` يجب أن تطبق هذه القواعد فوراً:
1. عدم إنشاء أي ملفات أو مجلدات في جذر `D:\MCP`.
2. حظر استخدام مجلد `Creative-Workspaces` نهائياً.
3. التمييز الدقيق بين مجلد `01-Projects\Installed` (بيئات التشغيل) و `01-Projects\Source` (مستودعات التطوير).
4. الالتزام بالهيكل الثماني داخل أي مشروع إبداعي (`01-Source` .. `08-Backups`).
5. الحظر التام لرفع أو تسريب أي مفاتيح سرية أو ملفات مشاريع خاصة.

---

## 2. جدول آليات توجيه وتحميل القواعد لكل عميل (Client Instruction Mechanisms)

| العميل / الأداة (AI Client) | آلية التوجيه والملف المعتمد | المسار داخل D:\MCP | طريقة الربط والتحميل | الحالة والتوافق |
| :--- | :--- | :--- | :--- | :---: |
| **Google Antigravity** | `AGENTS.md` + Rules Engine | `D:\MCP\AGENTS.md` | قراءة تلقائية من جذر مساحة العمل | **NATIVE PASS** |
| **Claude Code** | `CLAUDE.md` | `D:\MCP\CLAUDE.md` | يحيل تلقائياً إلى `AGENTS.md` | **NATIVE PASS** |
| **OpenAI Codex** | `CODEX.md` | `D:\MCP\CODEX.md` | توجيهات تشغيلية صريحة | **NATIVE PASS** |
| **Gemini CLI** | `GEMINI.md` | `D:\MCP\GEMINI.md` | قراءة توجيهات مساحة العمل | **NATIVE PASS** |
| **Cursor IDE** | `.cursorrules` + MDC Rules | `D:\MCP\.cursorrules`<br>`D:\MCP\.cursor\rules\workspace.mdc` | يتم تطبيقها تلقائياً على كافة النوافذ والملفات | **NATIVE PASS** |
| **Windsurf IDE** | `.windsurfrules` | `D:\MCP\.windsurfrules` | يتم تطبيقها تلقائياً أثناء الجلسات | **NATIVE PASS** |
| **Cline (VS Code)** | `.clinerules` | `D:\MCP\.clinerules` | تحميل تعليمات النظام في سياق الوكيل | **NATIVE PASS** |
| **Roo Code** | `.roomodes` + `.roo/rules.md` | `D:\MCP\.roomodes`<br>`D:\MCP\.roo\rules.md` | تعريف نمط مخصص وقواعد دائمة | **NATIVE PASS** |
| **VS Code Agents** | `.vscode/settings.json` | `D:\MCP\.vscode\settings.json` | حجب وتصفية ملفات التبعيات والكاش | **NATIVE PASS** |

---

## 3. إرشادات خاصة للوكلاء عند إنشاء أو تعديل المشاريع

1. **قبل إنشاء مشروع جديد:**
   - تحقق أولاً من مجلد الوجهة الصحيح.
   - لا تنشئ المجلدات يدوياً بل استخدم المولد المعتمد:  
     `node D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\generator.js`
2. **عند تحديث أي مشروع:**
   - حدّث ملف `PROJECT_INFO.md` بتاريخ آخر تعديل والإصدار.
   - حدّث ملف `PROJECT_PROGRESS.md` بنسبة الإنجاز والمهام المكتملة.
3. **في حالات الأخطاء:**
   - سجّل تفاصيل الخطوة وسبب الخطأ وطريقة حله داخل مجلد `07-Errors` الخاص بالمشروع.
