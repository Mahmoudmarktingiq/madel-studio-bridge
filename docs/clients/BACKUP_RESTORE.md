# MADEL Studio Bridge — استراتيجية النسخ الاحتياطي والاسترجاع (Backup & Restore Strategy)
**المشروع:** MADEL Studio Bridge — Phase P18  
**المالك والمهندس المشرف:** Mahmoud Adel — محمود عادل  
**المسار المصدري:** `packages/server/src/clients/atomic-writer.ts`  
**تاريخ التوثيق:** 10 نوفمبر 2026  
**الحالة:** **PRODUCTION READY**

---

## 1. سياسة النسخ الاحتياطي التلقائي (Automatic Backup Policy)

قبل كتابة أي تعديل على ملف تكوين لأي عميل ذكاء اصطناعي، يتم إنشاء نسخة احتياطية كاملة ومطابقة 100% للملف الأصلي بجواره مباشرة:

- **صيغة التسمية القياسية:**  
  `${filePath}.bak.YYYY-MM-DDTHH-mm-ss-sssZ`
- **مثال حقيقي:**  
  `C:\Users\asus\.claude.json.bak.2026-11-10T17-15-30-120Z`

تضمن هذه السياسة:
1. عدم الكتابة فوق أي ملف دون وجود نسخة يمكن الرجوع إليها في أجزاء من الثانية.
2. القدرة على تتبع تاريخ التعديلات الزمنية.
3. سهولة استرجاع الإعدادات يدوياً أو برمجياً.

---

## 2. طرق الاسترجاع (Restore Mechanisms)

### أ. الاسترجاع عبر سطر الأوامر (CLI Restore):
- **استرجاع أحدث نسخة احتياطية متوفرة تلقائياً:**
  ```bash
  node dist/clients/cli.js restore claude-code
  ```
- **استرجاع نسخة احتياطية محددة:**
  ```bash
  node dist/clients/cli.js restore claude-code "C:\Users\asus\.claude.json.bak.2026-11-10T17-15-30-120Z"
  ```

### ب. الاسترجاع البرمجي عبر الواجهة الداخلية (API Restore):
```typescript
import { globalConfigManager } from "./dist/clients/index.js";

const result = globalConfigManager.restore("claude-code");
if (result.success) {
  console.log(`Restored from backup: ${result.restoredFromBackup}`);
}
```

### ج. الاسترجاع اليدوي للطوارئ (Manual Emergency Restore):
في حال رغب المستخدم في استرجاع إعداداته يدوياً دون استخدام أدوات سطر الأوامر، يكفي حذف الملف الحالي وإعادة تسمية ملف النسخة الاحتياطية `.bak` بإزالة اللاحقة الزمنية.
