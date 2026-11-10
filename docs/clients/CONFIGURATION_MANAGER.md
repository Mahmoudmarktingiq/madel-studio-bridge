# MADEL Studio Bridge — مدير التكوين والأتمتة (Configuration Manager)
**المشروع:** MADEL Studio Bridge — Phase P18  
**المالك والمهندس المشرف:** Mahmoud Adel — محمود عادل  
**المسار المصدري:** `packages/server/src/clients/config-manager.ts`  
**تاريخ التوثيق:** 10 نوفمبر 2026  
**الحالة:** **PRODUCTION READY & TESTED**

---

## 1. نظرة عامة (Overview)

فئة `ConfigManager` هي النواة المسؤولة عن تنسيق عمليات قراءة، وتعديل، ومطابقة، وحفظ إعدادات عملاء الذكاء الاصطناعي عبر مختلف صيغ الملفات (`JSON`, `JSONC`, `TOML`, `YAML`).

تضمن هذه الفئة الحفاظ المطلق على إعدادات المستخدم الأصلية، وعدم حذف أي خادم MCP موجود مسبقاً، وتوفير معاينة فورية (Dry Run Diff) قبل كتابة أي بايت على القرص الصلب.

---

## 2. العمليات البرمجية الأساسية (Core Operations)

### 1. الاستكشاف والمعاينة (Inspection):
```typescript
const details = configManager.inspect("claude-code");
console.log(details.status);            // INSTALLED | CONFIGURED...
console.log(details.configPath);        // المسار المحسوب للملف
console.log(details.rawConfigSummary);  // قائمة الخوادم الأخرى الموجودة مسبقاً
```

### 2. التخطيط والمعاينة المسبقة (Dry Run Plan):
```typescript
const plan = configManager.planConnect("claude-code");
console.log(plan.otherServersPreserved); // ["sqlite", "github", "filesystem"]
console.log(plan.diffPreview);           // معاينة أسطر التغيير بتنسيق Unified Diff
```

### 3. التطبيق الذري (Atomic Apply):
```typescript
const result = configManager.applyConnect("claude-code", {
  serverPath: "D:\\MCP\\01-Projects\\Installed\\MADEL-Studio-Bridge\\dist\\index.js"
});
if (result.success) {
  console.log(`Updated: ${result.configPath}`);
  console.log(`Backup created at: ${result.backupPath}`);
}
```

### 4. الإزالة الآمنة (Clean Disconnect):
```typescript
const result = configManager.applyDisconnect("claude-code");
// تحذف مدخل MADEL فقط وتحافظ بنسبة 100% على كافة الخوادم الأخرى
```

### 5. الاسترجاع من النسخ الاحتياطية (Restore):
```typescript
const result = configManager.restore("claude-code");
// تسترجع تلقائياً أحدث نسخة احتياطية .bak لهذا الملف
```

---

## 3. قاعدة الحفاظ الصارم على البيانات (Strict Preservation Rule)

> [!IMPORTANT]
> **قاعدة ذهبية لا استثناء فيها:**  
> يُحظر تماماً استبدال ملف التكوين بكائن جديد يحتوي على خادم MADEL فقط.  
> يقوم النظام بقراءة كافة الكائنات والخوادم والمفاتيح غير المرتبطة بـ MADEL (مثل مفاتيح الثيمات، أو خوادم `sqlite`، أو أدوات `github`) وإعادة دمجها بالكامل في الملف الجديد دون أي حذف أو تشويه.
