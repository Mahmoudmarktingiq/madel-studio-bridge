# Photoshop CCX Installation & UXP Tooling Audit Report
**مشروع:** Brainferno MCP Bridge  
**التطبيق المستهدف:** Adobe Photoshop 2026 (v27.8.0 / Architecture PHSP)  
**تاريخ التدقيق:** 10 نوفمبر 2026  
**المسار الأساسي للحزمة المحصنة:** `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace\Brainferno-MCP-Bridge.ccx`  
**حالة الحزمة:** جاهزة ومحصنة بالكامل وفق المتطلبات الأمنية.  
**حالة التثبيت التفاعلي:** بانتظار موافقة المستخدم على مطالبة التثبيت في واجهة Adobe Creative Cloud (امتثالاً للقاعدة 12).

---

## 1. جدول النتائج والتحقق (Audit Verification Matrix)

| البند / الاختبار | النتيجة | التفاصيل والتحقق الفعلي |
| :--- | :---: | :--- |
| **1. فحص وجود Adobe UXP Developer Tool** | **FAIL (Not Installed)** | تم البحث في كافة مسارات `Program Files` و `AppData` و `PATH`، وتبين أن الأداة غير مثبتة على الجهاز. |
| **2. إمكانية تثبيت UDT من Creative Cloud** | **BLOCKED (Rule 3)** | تثبيت UDT واستخدامه يتطلب تفعيل `Developer Mode` داخل Photoshop وتثبيت تطبيقي نظامي؛ تم التوقف امتثالاً للشرط 3. |
| **3. استخدام ملفات اللوحة المحصنة** | **PASS** | تم التحقق من أن الحزمة `Brainferno-MCP-Bridge.ccx` تستخدم كود ومواصفات النسخة المحصنة وليس الأصلية. |
| **4. تقييد network.domains محلياً** | **PASS** | النطاقات محصورة بـ `ws://127.0.0.1:7897` و `http://127.0.0.1:7897` مع منع الاتصال الخارجي. |
| **5. إزالة صلاحية clipboard** | **PASS** | تم حذف صلاحية `clipboard` بالكامل من `manifest.json`، وتأمين كود زر النسخ لمنع الأخطاء غير المعالجة. |
| **6. توثيق localFileSystem: fullAccess** | **PASS** | الصلاحية متبقية لتأمين قراءة ملف الـ Bridge وتصدير ملفات PSD برمجياً دون حوارات تفاعلية مستمرة. |
| **7. عدم استخدام PS.json Lockdown** | **PASS** | لم يتم فرض سمات قفل القراءة فقط على ملف `PS.json` التزاماً بمسار التثبيت الرسمي لـ Adobe. |
| **8. سلامة التوقيع وسياسة Creative Cloud** | **PENDING USER ACTION** | يتطلب نظام Adobe نقر المستخدم على "Install locally" لتخويل الإضافة غير الموقعة محلياً. |
| **9. ظهور الإضافة داخل Photoshop** | **NOT VERIFIED** | بانتظار نقر المستخدم على زر التثبيت في نافذة Adobe Creative Cloud ثم إطلاق Photoshop. |
| **10. اختبار الاتصال الحقيقي WebSocket** | **NOT VERIFIED** | بانتظار فتح اللوحة داخل Photoshop للتأكد من `photoshop connected: true`. |
| **11. اختبار إنشاء وحفظ مستند PSD تجريبي** | **NOT VERIFIED** | سيتم تنفيذه حصرياً داخل `photoshop-test-workspace\audit-test.psd` فور اتصال اللوحة. |
| **12. ربط MCP مع Claude/Codex/Antigravity** | **HOLD (Rule 17)** | محظور التسجيل أو الربط قبل استكمال واجتياز الاختبار الحي الفعلي مع Photoshop. |

---

## 2. تفاصيل فحص أداة UXP Developer Tool (UDT)

1. **نتائج المسح:**
   - فحص المسار: `C:\Program Files\Adobe\Adobe UXP Developer Tool` -> **غير موجود**.
   - فحص مسارات البرامج: `Get-Command *udt*` -> **غير مسجل في بيئة التشغيل**.
   - فحص الحزم العالمية لـ npm: لا توجد حزم أدوات UXP مثبتة عالمياً.
2. **شروط تثبيت واستخدام UDT وفق سياسات Adobe:**
   - تتطلب أداة UDT تفعيل وضع المطور الصريح من داخل Photoshop:
     `Edit -> Preferences -> Plugins -> Enable Developer Mode`
   - كما يتطلب تنزيلها من Creative Cloud Desktop تثبيت ملفات تطبيق في مسار النظام `Program Files`.
   - **الامتثال للشرط 3:** تنص تعليمات المهمة صراحة على:
     *"إذا لم يكن مثبتاً، افحص إمكانية تثبيته من Adobe Creative Cloud الرسمي فقط، وتوقف قبل التثبيت إذا احتاج صلاحيات Administrator أو تغيير Developer Mode."*
     وبناءً عليه تم التوقف عن فرض تثبيت UDT تلقائياً والانتقال لبناء الحزمة المعتمدة.

---

## 3. تدقيق بنية حزمة CCX المحصنة (`Brainferno-MCP-Bridge.ccx`)

- **المسار الفعلي:**
  `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace\Brainferno-MCP-Bridge.ccx`
- **الحجم:** 30,024 بايت (أرشيف مضغوط يتوافق 100% مع معايير Adobe UXP Packaging).
- **المحتويات المحققة داخلياً:**
  ```text
  manifest.json       (1,723 bytes - النسخة المحصنة والمعدلة)
  index.html          (3,553 bytes - واجهة اللوحة)
  main.js             (4,155 bytes - منطق واجهة المستخدم مع تعطيل الحافظة الآمن)
  bridge-client.js    (7,146 bytes - عميل WebSocket المقيد بـ 127.0.0.1:7897)
  commands.js         (24,064 bytes - محرك تنفيذ أوامر Photoshop)
  icons/icon.png      (3,355 bytes)
  icons/icon@1x.png   (3,355 bytes - المولد خصيصاً لحل خطأ التحجيم)
  icons/icon@2x.png   (7,360 bytes)
  icons/logo.svg      (4,672 bytes)
  README.md           (1,951 bytes)
  ```

---

## 4. تقييم المخاطر وتوثيق الصلاحيات (Security & Risk Assessment)

### أ. تضييق نطاق الشبكة (`network.domains`)
- **القيمة السابقة:** `"all"` (خطر أمني مرتفع يسمح للوحة بفتح اتصالات إلى أي خادم خارجي).
- **القيمة الحالية:**
  ```json
  "domains": [
    "ws://127.0.0.1:7897",
    "ws://localhost:7897",
    "ws://127.0.0.1",
    "ws://localhost",
    "http://127.0.0.1:7897",
    "http://localhost:7897"
  ]
  ```
- **الأثر الأمني:** منع أي تسريب خارجي للبيانات، وضمان أن الاتصال محصور حصرياً بخادم Brainferno المحلي.

### ب. إزالة صلاحية الحافظة (`clipboard`)
- تم إزالة `"clipboard": "readAndWrite"` نهائياً من `manifest.json`.
- تم تعديل دالة زر نسخ السجلات داخل `main.js` لتعمل بأمان وتتجاهل العملية أو تطبعها في كونسول UXP فقط، مما يمنع حدوث انهيار برمجيات غير معالج (`Unhandled Promise Rejection`).

### ج. توثيق مخاطر بقاء `localFileSystem: fullAccess`
- **سبب البقاء:**
  1. تحتاج اللوحة إلى قراءة رمز المصافحة والإعدادات تلقائياً من المسار المخصص (`C:\Users\asus\.brainferno-mcp-bridge\bridge.json`).
  2. تحتاج أوامر الحفظ والتصدير المؤتمتة (مثل حفظ `audit-test.psd` وتصدير طبقات PNG) إلى الكتابة على مسار مجلد الاختبار المحدد دون إظهار نوافذ الحفظ التفاعلية لنظام Windows عند كل عملية.
- **المخاطر والضوابط الوقائية:**
  - *الخطر:* الصلاحية تمنح الإضافة القدرة على قراءة/كتابة ملفات يملكها حساب المستخدم.
  - *الضوابط المفروضة:*
    - كود `commands.js` و `bridge-client.js` لا ينفذ إلا الأوامر الموجهة صراحة من الخادم المحلي.
    - خادم الـ Bridge مضبوط بحظر السكربتات الخام (`BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0`).
    - مسارات العمليات محصورة حصراً داخل مجلد العمل المعزول `photoshop-test-workspace`.

---

## 5. التدخل اليدوي المطلوب من المستخدم (Manual Action Required)

امتثالاً للقاعدة رقم 12:
*"عند ظهور مطالبة التثبيت الرسمية، اعرض التفاصيل وانتظر موافقتي داخل واجهة Adobe."*

### الإجراء المطلوب من المستخدم الآن:

1. توجه إلى المجلد:
   `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace`
2. انقر نقراً مزدوجاً (Double Click) على ملف:
   **`Brainferno-MCP-Bridge.ccx`**
   *(أو اضغط بالزر الأيمن واختر "Open with Adobe Creative Cloud Desktop")*.
3. ستفتح نافذة Adobe الرسمية وتعرض رسالة التحقق الأمني:
   > *"This plugin is not from Adobe Marketplace. Do you want to install it?"*
   > *Plugin: Brainferno MCP Bridge (v0.3.4)*
4. اضغط على زر: **Install locally** (أو **Install anyway**).
5. سيتولى Creative Cloud تسجيل الإضافة رسمياً في قاعدة بياناته وتفعيلها داخل Photoshop 2026.
6. أبلغني فور اكتمال هذه الخطوة لنباشر اختبار فتح اللوحة والاتصال الحي.
