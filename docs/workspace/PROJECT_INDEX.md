# MADEL Studio Bridge — الفهرس الشامل للمشاريع المعتمدة (Master Project Index)
**المسار الرئيسي:** `D:\MCP`  
**المالك:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.4.0 — P14 FINAL PRODUCTION CATALOG  
**تاريخ التحديث:** 10 نوفمبر 2026 — 18:45:00  

---

## 1. فهرس المشاريع البرمجية (Software Projects Index)

### أ. المشاريع المصدرية والتطويرية (`01-Projects\Source\`):
1. **MADEL Studio Bridge (Canonical Source Repository):**
   - **المسار:** `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge`
   - **التقنية:** Node.js, TypeScript, Adobe UXP API, Named Pipe IPC, Zod 4.6.7.
   - **الوظيفة:** المنصة الموحدة لإدارة وتكامل خوادم MCP، وأدوات ومحولات برامج التصميم، ومضاعف اتصالات العملاء.
   - **الحالة:** **ACTIVE & PRIMARY ENGINE**
2. **Test-MCP-Tool (Scaffold Verification):**
   - **المسار:** `D:\MCP\01-Projects\Source\Test-MCP-Tool`
   - **التقنية:** Node.js.
   - **الوظيفة:** مشروع تجريبي معتمد عبر مولد المشاريع التلقائي للتحقق من هيكلية السقالة البرمجية (10 مجلدات).
   - **الحالة:** **VERIFIED (Scaffold Test)**

### ب. المشاريع التشغيلية المثبتة (`01-Projects\Installed\`):
1. **MADEL-Studio-Bridge (Installed Runtime Package):**
   - **المسار:** `D:\MCP\01-Projects\Installed\MADEL-Studio-Bridge`
   - **الوظيفة:** نسخة التشغيل المباشرة لمنصة MADEL للمستخدم والعملاء.
   - **الحالة:** **OPERATIONAL**
2. **Adobe-Bridge Server (Active Primary Daemon):**
   - **المسار:** `D:\MCP\01-Projects\Installed\Adobe-Bridge\stable-candidate\dist\index.js`
   - **الوظيفة:** الخادم المعالج الفعلي الذي يدير WebSocket المحلي (`127.0.0.1:7897`) ومضاعف أنبوب الويندوز المسمى (`\\.\pipe\brainferno-mcp-bridge`).
   - **الحالة:** **ACTIVE & IN-USE (All Clients Connected)**
3. **Blender-MCP Integration:**
   - **المسار:** `D:\MCP\01-Projects\Installed\Blender-MCP`
   - **الوظيفة:** بيئة تشغيل خادم Blender 5.2.3 LTS عبر `uvx mcp-for-blender` الموجهة لكاش قرص D.
   - **الحالة:** **OPERATIONAL**
4. **CapCut-CLI Tool & Skill:**
   - **المسار:** `D:\MCP\01-Projects\Installed\CapCut-CLI`
   - **الوظيفة:** محرك مونتاج الفيديو الآلي وتحليل مسودات CapCut وتوليد المؤثرات والترجمات.
   - **الحالة:** **OPERATIONAL**
5. **Other-MCP-Tools:**
   - **المسار:** `D:\MCP\01-Projects\Installed\Other-MCP-Tools`
   - **الوظيفة:** وثائق ومراجع Chrome DevTools و Stitch و Science Suite.
   - **الحالة:** **OPERATIONAL**

---

## 2. فهرس المشاريع الإبداعية (Creative Projects Index)

### أ. مشاريع Blender (`02-Blender\`):
- **البراند:** `AlMawada-CNC`
- **المشروع:** `CNC-Product-Ad`
- **المسار المعتمد:** `D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad`
- **الملفات الماستر:**
  - `03-Project\AlMawada_CNC_Product_Ad.blend`
  - `03-Project\AlMawada_CNC_Product_Ad_Geometry_Fixed.blend`
  - `03-Project\AlMawada_M131_Product_Master.blend`
- **الأصول والخامات:** كافة خامات الإكساء والأصول ثلاثية الأبعاد في `02-Assets`.
- **مخرجات الريندر:** صور وفيديوهات الريندر بدقة 1080x1920 في `05-Exports`.
- **الحالة:** **OPERATIONAL & PRODUCTION READY**

### ب. مشاريع CapCut (`03-CapCut\`):
- **البراند:** `AlMawada-CNC`
- **المشروع:** `Raw-Edit-Commercial`
- **المسار المعتمد:** `D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial`
- **ملفات المسودة والتايم لاين:**
  - `03-Project\AlMawada_Raw_Edit_01\draft_content.json`
  - `03-Project\AlMawada_Raw_Edit_02\draft_content.json`
- **المقاطع الخام المحمية:** 25 مقطع فيديو لتشغيل ماكينة CNC في `01-Source\01-Rashez\` (`1.mp4` إلى `25.mp4`).
- **المخرجات المصدرة:** الفيديوهات النهائية والمقاطع الترويجية في `05-Exports`.
- **الحالة:** **OPERATIONAL & PRODUCTION READY**

### ج. مشاريع Photoshop (`04-Photoshop\`):
- **البراند:** `MADEL`
- **المشروع:** `Multi-Client-Acceptance`
- **المسار المعتمد:** `D:\MCP\04-Photoshop\MADEL\Multi-Client-Acceptance`
- **المستندات الماستر:**
  - `03-Project\audit-test.psd`
  - `03-Project\antigravity-test.psd`
  - `03-Project\claude-code-test.psd`
  - `03-Project\codex-test.psd`
- **الحالة:** **OPERATIONAL & PRODUCTION READY**

---

## 3. مجلد البيئة المشتركة المحمي (`runtime/`)

- **المسار:** `D:\MCP\runtime\uv-cache`
- **الوظيفة:** كاش الحزم المشترك لـ Python و uvx و Blender MCP.
- **الحجم:** **11,238.91 MB (75,823 ملفاً)**.
- **الحالة:** **PROTECTED PERMANENT & OPERATIONAL**.

---

## 4. حالة المجلدات القديمة السابقة (Cleaned Legacy Folders)

كافة المجلدات القديمة التالية في جذر `D:\MCP` تم تفريغ مكرراتها بالكامل بنسبة 100% وحذفها بأمان في المرحلة P14:
- `Capcat` (تم الحذف ➔ المسار البديل: `03-CapCut`)
- `blender` (تم الحذف ➔ المسار البديل: `02-Blender`)
- `security-reports` (تم الحذف ➔ المسار البديل: `01-Projects\Source\MADEL-Studio-Bridge\docs\security-reports`)
- `Adobe-Bridge` (تم الحذف ➔ المسار البديل: `01-Projects\Installed\Adobe-Bridge`)
- `Adobe-Bridge-Audit` (تم الحذف ➔ المسار البديل: `01-Projects\Source\docs` و `04-Photoshop`)
- `MADEL-Studio-Bridge` (تم الحذف ➔ المسار البديل: `01-Projects\Source\MADEL-Studio-Bridge`)
- `legacy` (تم الحذف ➔ المسار البديل: `01-Projects\Installed\Adobe-Bridge\legacy-dist`)
- `backups` (تم الحذف ➔ المسار البديل: `01-Projects\Source\MADEL-Studio-Bridge\backups`)
- `archives` و `logs` (تم الحذف في P13 لكونهما فارغين تماماً).
