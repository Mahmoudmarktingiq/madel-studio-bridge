# MADEL Studio Bridge — وثيقة جرد الترحيل (Migration Manifest)
**المشروع:** MADEL Studio Bridge  
**المالك:** Mahmoud Adel — محمود عادل  
**المسار الرئيسي:** `D:\MCP`  
**تاريخ التوثيق:** 10 نوفمبر 2026 — 16:15:00  

---

## 1. جدول ترحيل الكيانات والمشاريع (Entity Migration Table)

| الكيان الأصلي | المسار الأصلي (Old Path) | المسار المعتمد الجديد (New Path) | عدد الملفات | الحجم الإجمالي | حالة الترحيل | حالة الحذف القديم |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **منصة MADEL الرئيسية** | `D:\MCP\MADEL-Studio-Bridge` | `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge` | 3,920 ملفاً | 18.69 MB | **MIGRATED (PASS)** | سليم (بانتظار الموافقة) |
| **نسخة MADEL التشغيلية** | `D:\MCP\MADEL-Studio-Bridge` | `D:\MCP\01-Projects\Installed\MADEL-Studio-Bridge` | 3,920 ملفاً | 18.69 MB | **MIGRATED (PASS)** | سليم (بانتظار الموافقة) |
| **خادم Adobe Bridge** | `D:\MCP\Adobe-Bridge` | `D:\MCP\01-Projects\Installed\Adobe-Bridge` | 7,412 ملفاً | 33.88 MB | **MIGRATED (PASS)** | سليم ونشط (PID 33328) |
| **مشروع Blender الإبداعي** | `D:\MCP\blender\AlMawada-CNC` | `D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad` | 251 ملفاً | 450.57 MB | **MIGRATED (PASS)** | سليم (بانتظار الموافقة) |
| **مشروع CapCut الإبداعي** | `D:\MCP\Capcat\almawada` | `D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial` | 492 ملفاً | 2,619.66 MB | **MIGRATED (PASS)** | سليم (بانتظار الموافقة) |
| **مشروع Photoshop الإبداعي**| `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace` | `D:\MCP\04-Photoshop\MADEL\Multi-Client-Acceptance` | 12 ملفاً | 1.84 MB | **MIGRATED (PASS)** | سليم (بانتظار الموافقة) |
| **أداة Blender MCP** | بيئة تشغيلية uvx | `D:\MCP\01-Projects\Installed\Blender-MCP` | وثائق + تشغيل | - | **ESTABLISHED** | نشط |
| **أداة CapCut CLI** | بيئة مهارات سكيل | `D:\MCP\01-Projects\Installed\CapCut-CLI` | وثائق + تشغيل | - | **ESTABLISHED** | نشط |
| **أدوات MCP الإضافية** | أدوات النظام | `D:\MCP\01-Projects\Installed\Other-MCP-Tools` | وثائق + ربط | - | **ESTABLISHED** | نشط |
| **كاش بيئة uv** | `C:\Users\asus\AppData\Local\uv\cache` | `D:\MCP\runtime\uv-cache` | 75,822 ملفاً | 11,238.91 MB | **COPIED (PASS)** | سليم (بانتظار الموافقة) |

---

## 2. جدول بصمات التحقق الرقمية (SHA-256 Hashes)

| الملف الأساسي | المسار داخل الهيكل المعتمد | بصمة التحقق (SHA-256) |
| :--- | :--- | :--- |
| **حزمة إضافة Photoshop CCX** | `01-Projects\Source\MADEL-Studio-Bridge\dist\MADEL-Studio-Bridge-Photoshop.ccx` | `E6ADEC4AD52F4CABA2BA39961A2F7DE69C3A6CDAD59F380EBD7DB39C7834D498` |
| **ملف مانيفيست إضافة Photoshop** | `01-Projects\Source\MADEL-Studio-Bridge\adapters\photoshop-adapter\manifest.json` | `41D86A29DE1BBA3F0C2C67182533C5CBA777D2E42740B6F2BD1D1CDC661B2DA6` |
| **واجهة لوحة Photoshop** | `01-Projects\Source\MADEL-Studio-Bridge\adapters\photoshop-adapter\index.html` | `AB6AC4A8C3CEE07D26FACBC3ECDDD5F9F8C5EE6495D9D48758A9FA14716DE586` |
| **محرك أوامر Photoshop** | `01-Projects\Source\MADEL-Studio-Bridge\adapters\photoshop-adapter\commands.js` | `75485A665658644FCAEF9F0D9D0161F0EA8EAC4A75D7886C366E1DBC313CCFE2` |
| **شعار منصة MADEL المتجهي** | `01-Projects\Source\MADEL-Studio-Bridge\assets\logo.svg` | `FB2FBA535EE5B473C5D25FD035EE120019E245544FB46D73BCABD85AA7BDB09C` |
| **مولد المشاريع الرئيسي** | `01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\generator.js` | `88A836D4DE92D2F387FFBCBD86043C0C044B29E3DCB8820E8DF4CD59868D8494` |
| **مشروع اختبار Blender الرئيسي** | `02-Blender\AlMawada-CNC\CNC-Product-Ad\03-Project\AlMawada_CNC_Product_Ad.blend` | محقق وثابت محلياً (450 MB) |
| **مستند اختبار Antigravity** | `04-Photoshop\MADEL\Multi-Client-Acceptance\03-Project\antigravity-test.psd` | محقق وثابت محلياً (350 KB) |
| **مستند اختبار Claude Code** | `04-Photoshop\MADEL\Multi-Client-Acceptance\03-Project\claude-code-test.psd` | محقق وثابت محلياً (350 KB) |
| **مستند اختبار OpenAI Codex** | `04-Photoshop\MADEL\Multi-Client-Acceptance\03-Project\codex-test.psd` | محقق وثابت محلياً (350 KB) |

---

## 3. وضع المجلدات السابقة وخطة التنظيف النهائي

| المجلد السابق | الحجم | الإجراء الموصى به | حالة التنفيذ |
| :--- | :---: | :--- | :---: |
| `D:\MCP\MADEL-Studio-Bridge` (في الجذر) | 18.69 MB | يُنقل كمرجع تاريخي أو يُحذف بعد استقرار مسار `01-Projects\Source` | بانتظار موافقة المستخدم |
| `D:\MCP\blender` (في الجذر) | 450.57 MB | يُحذف بعد التحقق من استقرار مسار `02-Blender` | بانتظار موافقة المستخدم |
| `D:\MCP\Capcat` (في الجذر) | 2,619.66 MB | يُحذف بعد التحقق من استقرار مسار `03-CapCut` | بانتظار موافقة المستخدم |
| `D:\MCP\Adobe-Bridge` (في الجذر) | 33.88 MB | يُترك مؤقتاً طالما أن خادم PID 33328 يعمل منه | نشط ومحمى |
| `D:\MCP\Adobe-Bridge-Audit` (في الجذر) | 20.33 MB | تم نقل تقاريره المعتمدة إلى توثيق MADEL ومستندات Photoshop | بانتظار موافقة المستخدم |
| `D:\MCP\security-reports` (في الجذر) | 162.49 MB | يمكن أرشفته في `01-Projects\Source\MADEL-Studio-Bridge\docs` | بانتظار موافقة المستخدم |
| `D:\MCP\runtime` (في الجذر) | 11,238.91 MB | يحتوي على كاش `uv` الفعلي المعتمد `UV_CACHE_DIR` | مستمر ونشط |
| `C:\Users\asus\AppData\Local\uv\cache` | 11,238.91 MB | جاهز للحذف الآمن عبر `cleanup-uv-cache.ps1` | بانتظار موافقة المستخدم |
