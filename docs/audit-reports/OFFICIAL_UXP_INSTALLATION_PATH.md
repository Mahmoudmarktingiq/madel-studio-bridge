# Official Adobe UXP Installation Path & Security Analysis
**مشروع:** Brainferno MCP Bridge  
**البرنامج المستهدف:** Adobe Photoshop 2026 (v27.8.0 / Architecture PHSP)  
**تاريخ التقرير:** 10 نوفمبر 2026  
**الحالة:** تحديد المسار الرسمي المعتمد وتوضيح أسباب فشل الطرق السابقة بامتثال أمني كامل.

---

## 1. أسباب فشل الطرق السابقة (Technical Root Cause Analysis)

### أ. فشل طريقة النسخ اليدوي إلى مجلد External:
1. **سياسة الحماية في UXP v5:** في الإصدارات الحديثة من Photoshop (2024-2026)، لم يعد مجلد `External` وسيلة معتمدة لتثبيت الإضافات دون توقيع.
2. **آلية عمل محرك `upic v2.6.0`:** عندما يرصد Photoshop مجلداً غير مسجل في قاعدة بيانات Adobe المركزية، يسجل المحرك رمز الخطأ الأمني `E001` (Unregistered Plugin) ويطلب تحديثاً من وكيل التثبيت `UPI`.
3. **تصفير سجل الإضافات:** يقوم `UPI` بإعادة كتابة ملف `AppData\Roaming\Adobe\UXP\PluginsInfo\v1\PS.json` بالقيمة `{"plugins":[]}`، مما يؤدي لمسح الإضافة وحجبها من قائمة `Plugins` في واجهة المستخدم.

### ب. حقيقة الحزمة المجمعة يدوياً (Manual CCX):
- ملف الـ CCX المجمع يدوياً هو عبارة عن أرشيف Zip تمت إعادة تسميته.
- **هذا الملف ليس حزمة رسمية معتمدة من Adobe** ولا يحمل توقيعاً رقمياً (Digital Signature) أو شهادة مطور مصرحة.
- محاولة تشغيل وكيل التثبيت `UnifiedPluginInstallerAgent.exe` في الخلفية برمجياً تفشل في تثبيتها تلقائياً لأن نظام أمان Adobe يمنع صراحة "التثبيت الصامت" (Silent Install) للإضافات غير الموقعة، ويشترط موافقة بصرية صريحة من المستخدم عبر واجهة Creative Cloud.

---

## 2. التحقق من جاهزية بيئة Adobe الحالية

- **Adobe Photoshop 2026 (v27.8.0):** مثبت ويعمل بصورة سليمة.
- **Adobe Creative Cloud Desktop (CCD):** 
  - العمليات الأساسية قيد التشغيل ونشطة (`Responding: True`):
    - `Creative Cloud.exe` (PID 35312)
    - `Adobe Desktop Service.exe` (PID 23856)
    - `Creative Cloud UI Helper.exe`
    - `AdobeUpdateService.exe`
- **Adobe UXP Developer Tool (UDT):**
  - **غير مثبتة حالياً** على الجهاز.
- **ملفات اللوحة المحصنة:**
  - تم تحصين `manifest.json` وقصر الشبكة على Loopback المحلي (`ws://127.0.0.1:7897`).
  - تم حذف صلاحية `clipboard`.
  - تم تصحيح صيغة `host` إلى كائن وتوفير مقاسات الأيقونات (1x و 2x).

---

## 3. المسارات الرسمية المعتمدة من Adobe لتشغيل إضافات UXP

وفقاً لتوثيق Adobe الرسمي للمطورين، هناك **مساران رسميان فقط** لتشغيل إضافة UXP محلية:

### المسار الأول (المسار الأقل خطراً والأسرع - End-User Local Sideloading):
1. **المفهوم:** استخدام حزمة CCX المحصنة محلياً وتمريرها عبر نافذة الموافقة الرسمية لتطبيق Creative Cloud Desktop.
2. **المزايا الأمنية:**
   - لا يتطلب تثبيت أي برامج إضافية.
   - لا يتطلب تفعيل `Developer Mode` داخل Photoshop.
   - لا يتطلب أي صلاحيات Administrator.
   - يعتمد كلياً على موافقة المستخدم البصرية الصريحة داخل واجهة Adobe.
3. **الخطوة اليدوية المطلوبة:**
   - فتح مستكشف الملفات والنقر المزدوج على:
     `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace\Brainferno-MCP-Bridge.ccx`
   - في نافذة Creative Cloud Desktop، يضغط المستخدم على **"Install locally"**.

---

### المسار الثاني (مسار المطورين الرسمي - Adobe UDT Workflow):
1. **المفهوم:** تثبيت أداة `Adobe UXP Developer Tool` الرسمية وتفعيل وضع المطور.
2. **الخطوات المطلوبة:**
   - فتح تطبيق **Creative Cloud Desktop**.
   - الانتقال إلى تبويب **Apps** ثم **Beta apps** (أو البحث في التطبيقات) والضغط على **Install** بجانب **Adobe UXP Developer Tool**.
   - فتح Photoshop وتفعيل وضع المطور من:
     `Edit -> Preferences -> Plugins -> Enable Developer Mode`.
   - فتح أداة UDT واختيار **Add Plugin** ثم الضغط على **Load**.
3. **الملاحظة الأمنية:** هذا المسار يتطلب تفعيل Developer Mode، وهو ما التزمنا بعدم تنفيذه إلا بموافقة صريحة وفق الشرط 7.

---

## 4. القرار والتوصية التنفيذية

**المسار الموصى به (الأقل خطراً والمتوافق مع توثيق Adobe):**  
اعتماد **المسار الأول**، حيث يتيح تثبيت اللوحة المحصنة محلياً عبر وكيل Adobe المعتمد مع الإبقاء على Developer Mode معطلاً ودون الحاجة لأي صلاحيات إضافية.

---

## 5. التدخل اليدوي الواحد المطلوب من المستخدم

> **الخطوة الواحدة:**  
> يرجى فتح المجلد:  
> `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace`  
> والنقر المزدوج على ملف: **`Brainferno-MCP-Bridge.ccx`**  
> ثم الضغط على **"Install locally"** داخل نافذة Adobe Creative Cloud الظاهرة أمامك.
