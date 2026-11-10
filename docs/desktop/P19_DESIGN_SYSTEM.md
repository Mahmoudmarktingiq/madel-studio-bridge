# MADEL Studio Bridge — نظام التصميم والهوية البصرية (P19 Design System)
**المشروع:** MADEL Studio Bridge — Phase P19  
**المالك والمهندس المشرف:** محمود عادل — Mahmoud Adel  
**المسار المصدري:** `apps/desktop/src/assets/styles/`  
**تاريخ التوثيق:** 10 نوفمبر 2026  

---

## 1. فلسفة التصميم (Design Philosophy)

تم تصميم واجهة تطبيق سطح المكتب لمنصة **MADEL Studio Bridge** لتجمع بين:
1. **مبادئ Microsoft Fluent Design:** الواجهات الزجاجية الشبه شفافة (Acrylic Surfaces)، والحدود الدقيقة، والتسلسل الهرمي للبطاقات ذات الظلال الناعمة.
2. **مبادئ Apple Human Interface Guidelines (HIG):** التباين الواضح في النصوص، وسهولة الوصول، واستقرار العناصر التفاعلية.
3. **بيئة المطورين والمصممين المحترفين:** الوضع الليلي الغامر (Deep Obsidian Dark Mode) الذي يقلل إجهاد العين أثناء العمل على برامج مثل Photoshop و Blender و CapCut، مع توفير وضع نهاري عالي الوضوح (Fluent Clean Light Mode).
4. **الاستقلالية وحماية الملكية الفكرية:** استلهام بساطة أدوات Adobe دون نسخ أي أصول محمية أو علامات تجارية لأي طرف ثالث.

---

## 2. لوحة الألوان المعتمدة (Color Palette)

### أ. الوضع الليلي الأساسي (Primary Dark Mode — Fluent Obsidian):
- **الخلفية الرئيسية (`--bg-primary`):** `#0D1117` — أسود عميق يمنح الشاشة هدوءاً بصرياً.
- **خلفية الألواح والبطاقات (`--bg-secondary`):** `#161B22` — رمادي فحمي يوفر تدرجاً مريحاً.
- **خلفية العناصر التفاعلية (`--bg-surface`):** `#21262D`.
- **النصوص الأساسية (`--text-primary`):** `#F0F6FC` — أبيض ناصع عالي القراءة.
- **النصوص الثانوية (`--text-secondary`):** `#8B949E`.
- **الحدود الدقيقة (`--border-subtle`):** `rgba(240, 246, 252, 0.1)`.

### ب. الوضع الفاتح الاختياري (Light Mode — Fluent Clean):
- **الخلفية الرئيسية (`--bg-primary`):** `#F6F8FA`.
- **خلفية الألواح (`--bg-secondary`):** `#FFFFFF`.
- **خلفية الأسطح (`--bg-surface`):** `#F1F5F9`.
- **النصوص الأساسية (`--text-primary`):** `#1F2328`.

### ج. ألوان الحالات والمؤشرات (Semantic Status Colors):
- **النشط / النجاح (Active / Success):** `#3FB950` (Emerald Green) — يعبر عن اتصال الخادم والتحقق.
- **الانتظار / التحذير (Pending / Warning):** `#D29922` (Amber) — يعبر عن التثبيت بانتظار التشغيل أو تعارضات الإعدادات.
- **التعثر / الانفصال (Error / Disconnected):** `#F85149` (Crimson) — يعبر عن انقطاع الاتصال أو غياب الملفات.
- **المخطط / المعلومات (Planned / Info):** `#58A6FF` (Electric Azure) — يعبر عن خطط الطريق المستقبلية وقنوات النقل.

---

## 3. مقياس المسافات والطباعة (Typography & Spacing Scale)

- **الخط الأساسي:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **خط الأكواد والمسارات والأرقام:** `"Cascadia Code", Consolas, "Fira Code", monospace` مع تفعيل خاصية الأرقام المتساوية العرض `tnum`.
- **مقياس الأحجام:**
  - العناوين الرئيسية: `16px / Bold (700)`.
  - العناوين الفرعية: `13px - 14px / Semi-Bold (600)`.
  - نصوص المتن: `12px - 13px / Regular (400)`.
  - البطاقات الإحصائية الكبيرة: `24px / Bold (700)`.
  - الوسوم والشارات (Badges): `10px - 11px / Bold (600-700)`.
- **نصف قطر الحواف (Border Radius):**
  - البطاقات الكبيرة: `8px - 10px`.
  - الأزرار وحقول الإدخال: `6px`.
  - شارات الحالة (Badges): `12px` (Pill Shape).

---

## 4. بنية التدويل ودعم اللغة العربية (i18n & RTL Readiness)

- تم تأسيس قواميس الترجمة في ملفين مستقلين:
  - الإنجليزية الافتراضية: [`apps/desktop/src/locales/en.ts`](file:///D:/MCP/01-Projects/Source/MADEL-Studio-Bridge/apps/desktop/src/locales/en.ts)
  - العربية الكاملة: [`apps/desktop/src/locales/ar.ts`](file:///D:/MCP/01-Projects/Source/MADEL-Studio-Bridge/apps/desktop/src/locales/ar.ts)
- عند اختيار العربية يتم تحويل اتجاه المستند تلقائياً إلى `dir="rtl"` وتعديل المحاذاة بسلاسة.
