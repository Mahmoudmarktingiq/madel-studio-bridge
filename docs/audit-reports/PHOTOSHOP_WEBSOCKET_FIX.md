# Photoshop UXP WebSocket Permission Fix Report
**مشروع:** Brainferno MCP Bridge  
**التطبيق المستهدف:** Adobe Photoshop 2026 (v27.8.0 / Architecture PHSP)  
**تاريخ الفحص والإصلاح:** 10 نوفمبر 2026  
**حالة الإضافة:** مثبتة وتعمل (Panel loaded v0.3.4 = PASS, Handshake read = PASS).  
**حالة إصلاح WebSocket:** تم الإصلاح برمجياً وبناء الحزمة المحدثة (بانتظار إعادة تحميل اللوحة في Photoshop).

---

## 1. السبب التقني المؤكد للخطأ (Confirmed Root Cause)

### نص الخطأ المرصود:
```text
WebSocket ctor threw: Permission denied to the url ws://127.0.0.1:7897. Manifest entry not found.
```

### التحليل البرمجي عبر الهندسة العكسية لمحرك Adobe UXP:
من خلال فحص مكتبة محرك UXP الأساسية `dynamic-torqnative.dll`، تم اكتشاف آلية التحقق من صلاحيات العناوين الشبكية (`_validateURL`):
1. **آلية الفلترة المسبقة للنطاقات (`_processDomainList`):**
   ```javascript
   _hasAValidTopLevelDomain(e) {
     return null != r(e, { customTlds: /localhost/ })
   }
   _processDomainList() {
     this.nativeValue.network.allowType === this.NETWORK_DOMAINS_LIST &&
     this.nativeValue.network.domains.forEach(e => {
       this._hasAValidTopLevelDomain(e) && this.processedDomainList.push(e)
     })
   }
   ```
2. **استبعاد عناوين IP المجردة (`127.0.0.1`):**
   تعتمد دالة `_hasAValidTopLevelDomain` على مكتبة `tldts/psl` لفحص النطاقات، مع تفعيل خيار مخصص للنطاقات المحلية عبر التعبير النمطي: `/localhost/`.
   - العنوان `localhost` يُقبل لأنه يطابق `/localhost/`.
   - العنوان `127.0.0.1` **يُرفض ويسقط تلقائياً** لأنه عنوان IP رقمي مجرد وليس نطاقاً علوياً (Top-Level Domain) ولا يطابق كلمة `localhost`.
   - بالتالي، يتم حذف `127.0.0.1` بصمت من قائمة النطاقات المعالجة `processedDomainList` داخل ذاكرة UXP.
3. **تناقض عنوان الاتصال في كود `bridge-client.js`:**
   كان كود العميل يطلب الاتصال حصرياً عبر:
   ```javascript
   var url = "ws://127.0.0.1:" + port;
   ```
   وعند استدعاء `new WebSocket(url)`، يقوم المحرك بمقارنة `ws://127.0.0.1:7897` مع النطاقات المتبقية في القائمة المعالجة (والتي تحتوي فقط على `localhost`). ولأن النطاقين غير متطابقين نصياً، يرمي مشيد الـ WebSocket استثناء الأمان:
   `Permission denied to the url ws://127.0.0.1:7897. Manifest entry not found.`

---

## 2. مقارنة قبل وبعد (Before & After)

### أ. ملف `manifest.json`

| الحالة السابقة | الحالة الجديدة بعد الإصلاح | الأثر التقني |
| :--- | :--- | :--- |
| ```json
"network": {
  "domains": [
    "ws://127.0.0.1:7897",
    "ws://localhost:7897",
    "ws://127.0.0.1",
    "ws://localhost",
    "http://127.0.0.1:7897",
    "http://localhost:7897"
  ]
}
``` | ```json
"network": {
  "domains": [
    "ws://localhost:7897",
    "ws://localhost",
    "http://localhost:7897",
    "http://localhost",
    "localhost:7897",
    "localhost",
    "ws://127.0.0.1:7897",
    "ws://127.0.0.1",
    "http://127.0.0.1:7897",
    "http://127.0.0.1"
  ]
}
``` | وضع `localhost` بكافة بروتوكولاته في مقدمة القائمة لضمان اجتياز فحص `_hasAValidTopLevelDomain`. |

### ب. ملف `bridge-client.js`

| الكود السابق (المسبب للخطأ) | الكود المعدل والآمن | الأثر التقني |
| :--- | :--- | :--- |
| ```javascript
var url = "ws://127.0.0.1:" + port;
log("connecting " + url + " …");
onStatus("connecting");
try {
  ws = new WebSocket(url);
} catch (e) {
  log("WebSocket ctor threw: " + e.message);
  onStatus("error");
  ws = null;
  scheduleRetry();
  return;
}
``` | ```javascript
var url = "ws://localhost:" + port;
log("connecting " + url + " …");
onStatus("connecting");
try {
  ws = new WebSocket(url);
} catch (e) {
  try {
    url = "ws://127.0.0.1:" + port;
    log("retrying with " + url + " …");
    ws = new WebSocket(url);
  } catch (e2) {
    log("WebSocket ctor threw: " + e.message);
    onStatus("error");
    ws = null;
    scheduleRetry();
    return;
  }
}
``` | الاتصال عبر `ws://localhost:7897` المتوافق مع فحص النطاقات، مع الإبقاء على محاولة الارتداد لـ `127.0.0.1` عند الحاجة. |

---

## 3. النسخ الاحتياطية وإعادة بناء الحزمة

1. **النسخ الاحتياطية المأخوذة قبل التعديل:**
   - مجلد لوحة العمل: `D:\MCP\Adobe-Bridge\stable-candidate\panels\panel-uxp-backup-wsfix`
   - مجلد الإضافة المثبتة: `C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External\com.brainferno.mcp-bridge.photoshop_0.3.4.bak`
2. **تطبيق التعديلات في كافة المواقع:**
   - تم تحديث `bridge-client.js` و `manifest.json` في النسخة المرشحة `panel-uxp`.
   - تم تحديث الملفات مباشرة داخل مجلد الإضافة المثبتة لدى المستخدم.
3. **إعادة بناء حزمة CCX:**
   - تم بناء الحزمة المحدثة بنجاح:
     `D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace\Brainferno-MCP-Bridge.ccx` (الحجم: 30,097 بايت).

---

## 4. حالة الاتصال الفعلي والمصفوفة الأمنية

| البند | الحالة | الملاحظات والتحقق |
| :--- | :---: | :--- |
| **خادم Brainferno MCP Bridge** | **RUNNING (Port 7897)** | يستمع محلياً على `127.0.0.1:7897`، وتم توليد `bridge.json` برمز أمان حديث. |
| **قراءة Handshake في Photoshop** | **PASS** | اللوحة قرأت المنفذ `7897` ورقم البروتوكول بنجاح. |
| **إصلاح خطأ Manifest Entry** | **READY ON DISK** | تم تعديل الكود على القرص داخل مجلد الإضافة والحزمة. |
| **Photoshop connected: true** | **NOT VERIFIED** | يتطلب إعادة تحميل اللوحة داخل Photoshop لتفريغ الكود القديم من ذاكرة V8 وتحميل الكود المصلح. |
| **تعديل ملفات PSD الأصلية** | **NONE** | لم يتم لمس أي مستندات للمستخدم التزاماً بقواعد الأمان. |

---

## 5. الخطوة المطلوبة لإتمام الاتصال

لتجاوز الكود القديم المحفوظ في ذاكرة Photoshop الحالية:
1. **الخيار الأسهل:** إغلاق لوحة `Brainferno MCP Bridge` داخل Photoshop ثم إعادة فتحها من القائمة:
   `Plugins -> Brainferno MCP Bridge`.
   *(أو إغلاق Photoshop وإعادة فتحه)*.
2. ستتصل اللوحة فوراً بعنوان `ws://localhost:7897` بالخادم المحلي النشط حالياً، وتتحول الحالة من `error` إلى **`connected`** باللون الأخضر.
