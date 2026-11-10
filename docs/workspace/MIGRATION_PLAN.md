# MADEL Studio Bridge — خطة الترحيل الآمن لمساحة العمل (Migration Plan)
**المشروع:** MADEL Studio Bridge  
**المالك:** Mahmoud Adel — محمود عادل  
**المسار:** `D:\MCP`  
**الحالة:** EXECUTED & VERIFIED  

---

## 1. استراتيجية ومبادئ الترحيل الآمن (Core Migration Principles)

تم وضع خطة الترحيل وفقاً لـ 12 قاعدة أمان إلزامية:
1. **الفحص والتحليل قبل النقل (Pre-inspection):** فحص كامل وتفصيلي للملفات والمجلدات القديمة قبل أي حركة.
2. **النسخ الآمن أولاً (Copy First):** عدم استخدام أمر النقل المباشر `move` أو الحذف `delete`؛ استخدام النسخ المتعدد المسارات `robocopy /MT:8 /XJ` لضمان بقاء المصادر القديمة سليمة 100%.
3. **عدم كسر العمليات الحية (Zero-Downtime):**
   - خادم Primary Daemon (PID 33328) مستمر في الاستماع على المنفذ `7897` ومسار `D:\MCP\Adobe-Bridge\stable-candidate` وقناة الأنبوب المسمى.
   - خادم Blender MCP ونسخة Blender 5.2.3 LTS تعمل باستمرار مع كاش `D:\MCP\runtime\uv-cache`.
4. **التحقق من بصمات SHA-256 وسلامة الملفات الأساسية.**
5. **إنشاء وثيقة جرد الترحيل المرجعية `MIGRATION_MANIFEST.md`.**
6. **الحفاظ التام على الملفات القديمة حتى الحصول على موافقة صريحة من المستخدم للتنظيف.**

---

## 2. مراحل خطة الترحيل المنفذة

### المرحلة 1: إنشاء شجرة المجلدات الهرمية
- إنشاء مجلدات المشاريع البرمجية: `01-Projects\Installed`, `01-Projects\Source`.
- إنشاء مجلدات البرامج الرئيسية مباشرة في `D:\MCP`:
  `02-Blender`, `03-CapCut`, `04-Photoshop`, `05-Premiere`, `06-Illustrator`, `07-AfterEffects`, `08-Office`, `09-VideoScribe`, `10-Aspire`, `11-Other-Apps`.
- إنشاء مجلدات الضبط الخاصة بمحررات الذكاء الاصطناعي: `.cursor/rules`, `.vscode`, `.roo`.

### المرحلة 2: ترحيل منصة MADEL Studio Bridge
- نقل المستودع المصدري الكامل إلى:  
  `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge`
- توفير نسخة تشغيلية جاهزة للربط المحلي في:  
  `D:\MCP\01-Projects\Installed\MADEL-Studio-Bridge`

### المرحلة 3: ترحيل مشاريع وأدوات البرامج
1. **Blender:**
   - نقل المشروع الإبداعي `AlMawada-CNC` من `D:\MCP\blender\AlMawada-CNC` إلى الهيكل القياسي الثماني:  
     `D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad`
   - توثيق وضبط أداة التشغيل في:  
     `D:\MCP\01-Projects\Installed\Blender-MCP`
2. **CapCut:**
   - نقل المشاريع الإبداعية ومسودات المونتاج من `D:\MCP\Capcat\almawada` إلى:  
     `D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial`
   - توثيق أداة وسكيل CapCut في:  
     `D:\MCP\01-Projects\Installed\CapCut-CLI`
3. **Photoshop:**
   - نقل ملفات مشاريع التحقق المفتوحة (`.psd`) ومعايناتها من `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace` إلى:  
     `D:\MCP\04-Photoshop\MADEL\Multi-Client-Acceptance`
   - الحفاظ على خادم Bridge الفعلي في:  
     `D:\MCP\01-Projects\Installed\Adobe-Bridge`

### المرحلة 4: التحقق والاختبار بعد الترحيل
- التحقق من اتصال Photoshop عبر أداة `cc_connected_apps` المباشرة.
- التحقق من استجابة Blender عبر أداة `get_addon_status` المباشرة.
- اختبار إنشاء مشاريع حقيقية عبر مولد المشاريع `generator.js`.
- التأكد من عدم حدوث أي حذف أو تلف في الملفات الأصلية.

---

## 3. خطة التراجع عند الطوارئ (Rollback Plan)

نظراً لأن الترحيل اعتمد على النسخ الآمن بنسبة 100% دون مساس بالمجلدات الأصلية (`Adobe-Bridge`, `blender`, `Capcat`, `runtime`, إلخ):
- في حال الرغبة في التراجع اللحظي، فإن كافة المسارات القديمة موجودة وتعمل بصورة تامة.
- لا توجد أي بيانات مفقودة أو مسارات مكسورة.
