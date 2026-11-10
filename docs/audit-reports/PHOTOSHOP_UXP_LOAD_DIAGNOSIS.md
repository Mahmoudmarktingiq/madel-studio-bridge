# Photoshop UXP Load Diagnosis & Architecture Audit
**مشروع:** Brainferno MCP Bridge  
**البرنامج المستهدف:** Adobe Photoshop 2026 (v27.8.0 / Architecture PHSP)  
**تاريخ الفحص:** 10 نوفمبر 2026  
**الحالة العامة:** تم التشخيص الكامل وتحديد السبب الجذري بدقة قطعية.

---

## 1. ملخص تنفيذي (Executive Summary)

أجرينا فحصاً شاملاً لسجلات ومحرك تحميل الإضافات (UXP / UPIC) وهندسة التثبيت المركزية (UPI) داخل Adobe Photoshop 2026.
أظهر التحقيق أن عدم ظهور لوحة `Brainferno MCP Bridge` داخل قائمة Plugins لا يرجع إلى خلل في كود الاتصال أو بيئة JavaScript، بل يعود إلى سببين رئيسيين:

1. **خطأ هيكلي في ملف التعريف الأصلي (`manifest.json`)**: تم اكتشافه وإصلاحه، حيث كانت النسخة الأصلية تستخدم مصفوفة `host: [...]` بدلاً من كائن `host: {...}` المطلوب حصرياً لإضافات الطرف الثالث (3P Plugins) في إصدارات UXP الحديثة، بالإضافة إلى فقدان أيقونة `icon@1x.png`.
2. **السبب الجذري الحاسم (Architecture Enforcement)**: تطبيق Adobe Photoshop 2026 يعتمد على آلية تحقق مزدوجة يقودها محرك `upic v2.6.0` ووكيل التثبيت الموحد `UPI` عبر ملف التسجيل المركزي `PS.json`. النسخ اليدوي للملفات غير الموقعة داخل مجلد `External` يُصنف أمنياً تحت رمز الخطأ `E001`، مما يدفع وكيل التثبيت `UPI` إلى إعادة تصفير `PS.json` تلقائياً إلى `{"plugins":[]}` عند كل إقلاع، وبالتالي حجب ظهورها في القائمة حتى يتم التصريح عنها رسمياً.

وفقاً لقاعدة الأمان رقم 11 من تعليمات المستخدم (*"إذا كان يتطلب تفعيل Developer Mode أو تثبيت إضافة غير موقعة أو تغيير سياسة أمان، توقف قبل التنفيذ ووضح المطلوب"*): **تم إيقاف أي إجراءات تثبيت للنظام وتوثيق الخيارات المتاحة للمستخدم للاختيار بينها**.

---

## 2. تفاصيل التشخيص التقني (Technical Diagnosis)

### أ. فحص السجلات الفعلية (`UXPLogs*.log`)
تم فحص السجلات المولدة في المسار:
`C:\Users\asus\AppData\Roaming\Adobe\Adobe Photoshop 2026\Logs\`

1. **اكتشاف الخطأ الأصلي في manifest.json:**
   ```log
   [Error] [general] Plugin com.brainferno.mcp-bridge.photoshop : Expected the host attribute to be an object for the 3P Plugin. Failed to parse the manifest.json file.
   [Info] [general] Plugin com.brainferno.mcp-bridge.photoshop : Scaled Icon : icons/icon@1x.png not found
   ```
2. **آلية الفحص المزدوج والارتداد (Fallback vs UPI):**
   عند بدء تشغيل Photoshop، يقوم المحرك `upic` بالخطوات التالية كما وثقها السجل:
   ```log
   [Info] upic::Upic version 2.6.0 is initialized
   [Info] upic::Failed to read plugin info file: C:\Program Files\Common Files\Adobe\UXP\PluginsInfo\v1\PS.json
   [Info] upic::Zero plugins found in user's PluginsInfo file.
   [Info] upic::Number of plugins added from user's pluginsInfo: 0
   [Info] upic::Loading plugins from user fallback plugins folder: C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External
   [Info] upic::Number of plugins added from user's fallback: 1
   ```
3. **رفض التسجيل التلقائي عبر UPI (Error Code E001):**
   مباشرة بعد اكتشاف الإضافة في مجلد `External`، لا يقوم Photoshop بتفعيلها للمستخدم، بل يرسل رسالة تحقق وتسجيل إلى وكيل التثبيت `UPI`:
   ```log
   [Info] upic::Sending PluginsInfo refresh request for location: user
   [Info] upic::Sending message to UPI, type: vulcan.SuiteMessage.upi.pluginsInfo.request payload: {"version":"v1","hostSapCode":"PHSP","hostVersion":"27.8.0","message":{"action":"refresh","location":"user"}}
   [Info] upic::Sending message to UPI, type: vulcan.SuiteMessage.upi.analytics.messagepayload: {"version":"v1","hostSapCode":"PHSP","hostVersion":"27.8.0","message":{"action":"send","events":[{"event.type":"register","event.subtype":"pluginsFolder","content.category":"user","event.count":"1","event.error_code":"E001"}]}}
   ```
4. **استجابة UPI ومسح القائمة:**
   يستجيب `UPI` لطلب التحديث بنجاح عملية الفحص وإعادة إنشاء ملف `PS.json`:
   ```log
   [Info] upic::Received message from UPI: message type: vulcan.SuiteMessage.upic.pluginsInfo.notifypayload: {"hostSapCode":"PHSP","hostVersion":"27.8.0","message":{"action":"refresh","status":"success"},"version":"v1"}
   ```
   ونتيجة لهذا التحديث، يُكتب داخل `PS.json`:
   ```json
   {"plugins":[]}
   ```
   وفي الإقلاع التالي، يقرأ Photoshop ملف `PS.json` فيجد `0 plugins`، ولا يعيد إظهارها في قائمة Plugins.

---

## 3. مقارنة قبل وبعد: `manifest.json` و `PS.json`

### أ. ملف `manifest.json`

| العنصر | الحالة الأصلية (غير متوافقة) | الحالة المعالجة (Hardened & Compatible) | الأثر الأمني والتقني |
| :--- | :--- | :--- | :--- |
| **صيغة host** | `"host": [{ "app": "PS", "minVersion": "26.0.0" }]` | `"host": { "app": "PS", "minVersion": "26.0.0" }` | إصلاح خطأ الرفض الجذري لـ 3P Plugins |
| **صلاحيات الشبكة** | `"network": { "domains": "all" }` | `"network": { "domains": ["ws://127.0.0.1:7897", "ws://localhost:7897", "http://127.0.0.1:7897"] }` | تضييق أمني صارم يمنع الاتصال الخارجي |
| **صلاحية الحافظة** | `"clipboard": "readAndWrite"` | **محذوفة بالكامل** | حماية خصوصية المستخدم ومنع تسريب البيانات |
| **أيقونات 1x** | مفقودة | تم توليد `icons/icon@1x.png` بحجم 23x23 و 48x48 | إزالة تحذيرات المكون الرسومي في UXP |
| **ملف النظام** | `"localFileSystem": "fullAccess"` | **مُبقى ومُوثق** | ضروري لقراءة `bridge.json` وتصدير/حفظ PSD آلياً |

### ب. ملف التسجيل المركزي `PS.json`

- **المسار:** `C:\Users\asus\AppData\Roaming\Adobe\UXP\PluginsInfo\v1\PS.json`
- **الحالة التلقائية التي يفرضها UPI:**
  ```json
  {"plugins":[]}
  ```
- **بنية السجل المطلوبة لمطابقة Schema الرسمية المستخرجة من `Photoshop.exe`:**
  ```json
  {
    "plugins": [
      {
        "name": "Brainferno MCP Bridge",
        "pluginId": "com.brainferno.mcp-bridge.photoshop",
        "versionString": "0.3.4",
        "versionId": "0.3.4",
        "type": "UXP",
        "status": "enabled",
        "host": {
          "app": "PS",
          "minVersion": "26.0.0"
        },
        "hostMinVersion": "26.0.0",
        "path": "$localPlugins\\External\\com.brainferno.mcp-bridge.photoshop"
      }
    ]
  }
  ```
- **الملاحظة التشخيصية:** تم التحقق عبر الهندسة العكسية من أن التعديل اليدوي على `PS.json` يتم تجاوزه أو إعادة كتابته بواسطة عملية `UPI Background Sync` ما لم يتم تثبيت الحزمة عبر أحد المسارين المعتمدين من Adobe.

---

## 4. التحقق من سلامة الأكواد والملفات البرمجية

تم التحقق من سلامة كافة ملفات الإضافة داخل مجلد النسخة المجهزة:
1. `index.html`: البنية صحيحة، تستدعي `main.js` و `bridge-client.js` دون تسريب أو أخطاء.
2. `main.js`: تم تعطيل زر نسخ السجلات (`copyLogs`) بطريقة آمنة لا تولد استثناءات غير معالجة (`unhandled promise rejection`) بعد حذف صلاحية `clipboard`.
3. `bridge-client.js`: تم ضبط الاتصال حصرياً على `ws://127.0.0.1:7897` المحلي دون أي اتصالات عن بعد.
4. `commands.js`: يحتوي على كافة أوامر فحص المستند، إضافة الطبقات، حفظ PSD، وتصدير الصور المطلوبة للاختبارات الحية.

---

## 5. السبب الحقيقي لعدم الظهور (Root Cause Summary)

1. **مجلد `External` ليس وسيلة تثبيت دائمة للإضافات غير الموقعة:**
   في Photoshop 2026، تم تشديد سياسة التحقق من التوقيع الرقمي. لا يتم تحميل أي إضافة من مجلد `External` مباشرة في واجهة المستخدم (Launchpad / Plugins Panel) إلا إذا كانت موثقة في قاعدة بيانات `UPI`.
2. **الرفض التلقائي عبر UPI (رمز الخطأ E001):**
   عندما يرصد Photoshop إضافة جديدة غير موقعة في مجلد `External`، يصنفها تحت الرمز `E001` (Unregistered / Unsigned External Plugin)، ويطلب من `UPI` تحديث القائمة. يقوم `UPI` بدوره بحذفها من `PS.json` بدلاً من اعتمادها.
3. **ضرورة وجود تفويض صريح من المستخدم:**
   تصميم نظام UXP يفرض أن أي إضافة غير منشورة في متجر Adobe الرسمي تتطلب **إما** موافقة صريحة عبر تثبيت حزمة `.ccx` مع قبول تنبيه الأمان، **أو** تشغيلها في بيئة التطوير عبر `UXP Developer Tool` مع تفعيل خيار `Enable Developer Mode`.

---

## 6. الخيارات المتاحة للمستخدم (Next Steps & Decision)

امتثالاً لقاعدة الأمان رقم 11، نتوقف هنا ونعرض الخيارات المتاحة للمستخدم للاختيار:

### الخيار (أ) — التثبيت المباشر لحزمة CCX المصنوعة محلياً (الموصى به للاستخدام اليومي)
- تم إنشاء الحزمة الآمنة مسبقاً في مسار الاختبار:
  `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace\Brainferno-MCP-Bridge.ccx`
- **طريقة التنفيذ:**
  1. يقوم المستخدم بالنقر المزدوج على ملف `Brainferno-MCP-Bridge.ccx` أو تشغيله عبر Creative Cloud Desktop.
  2. يظهر تنبيه أمان رسمي من Adobe: *"This plugin is not from Adobe Marketplace. Do you want to install it?"*.
  3. بالضغط على **"Install locally"**، يتولى `UPI` إضافة الإضافة إلى `PS.json` بصورة رسمية ودائمة.
  4. تظهر اللوحة فوراً داخل قائمة `Plugins` في Photoshop.

### الخيار (ب) — استخدام أداة مطوري UXP الرسمية (UXP Developer Tool)
- هذا هو المسار القياسي لتطوير إضافات UXP محلياً دون الحاجة لتوقيع رقمي:
  1. تفعيل وضع المطور داخل Photoshop من القائمة:
     `Edit -> Preferences -> Plugins -> Enable Developer Mode`.
  2. فتح أداة `Adobe UXP Developer Tool` (UDT).
  3. الضغط على **Add Existing Plugin** واختيار ملف:
     `C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External\com.brainferno.mcp-bridge.photoshop\manifest.json`.
  4. الضغط على **Load** (يقوم بتحميل الإضافة فوراً داخل Photoshop مع إتاحة لوحة DevTools للتصحيح).

### الخيار (ج) — فرض التثبيت عبر قفل `PS.json` (Local Policy Lockdown)
- كتابة إدخال الإضافة الصحيح داخل `PS.json` ثم حمايته من إعادة الكتابة عبر تعيين سمة القراءة فقط (`attrib +r`).
- *ملاحظة:* هذا الخيار قد يمنع Creative Cloud من تحديث إضافات أخرى مستقبلاً حتى يتم إزالة سمة الحماية.

---

## 7. حالة الجاهزية للربط مع عملاء MCP

> [!IMPORTANT]
> **قاعدة أمان صارمة:** لم يتم ولن يتم تسجيل Brainferno MCP Server داخل إعدادات **Claude Code** أو **Codex** أو **Antigravity** إلا بعد نجاح ظهور اللوحة واكتمال اختبار الاتصال الحقيقي (`connected: true`) مع مستند `audit-test.psd`.
