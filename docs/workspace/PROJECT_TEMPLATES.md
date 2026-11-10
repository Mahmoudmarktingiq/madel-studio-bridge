# MADEL Studio Bridge — نماذج وقوالب المشاريع المعتمدة (Project Templates)
**المسار الرئيسي:** `D:\MCP`  
**المالك:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0 — REFERENCE TEMPLATES  

---

## 1. نموذج المشاريع البرمجية (Software Project Template)

يتم إنشاؤه عبر المولد:
`node D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\generator.js software --name <Name> --tech <ts|node|python> [--git]`

### هيكل المجلدات:
```text
<Project-Root>/
├── src/                # الأكواد المصدرية الأساسية
├── config/             # ملفات الضبط والإعدادات
├── docs/               # التوثيق المعماري وشرح المكونات
├── reports/            # تقارير الجودة والاختبارات والأمان
├── errors/             # سجلات الأخطاء والحلول
├── logs/               # سجلات التشغيل
├── tests/              # اختبارات الوحدة والتكامل
├── builds/             # المخرجات المبنية (Compiiled)
├── releases/           # الحزم التنفيذية الجاهزة للتوزيع
├── backups/            # النسخ الاحتياطية المؤرخة
├── PROJECT_INFO.md     # بطاقة تعريف المشروع
├── PROJECT_PROGRESS.md # سجل التقدم والمراحل
├── README.md           # نظرة عامة وتعليمات التشغيل
└── .gitignore          # استبعاد node_modules و env و logs
```

---

## 2. نموذج المشاريع الإبداعية (Creative Project Template)

يتم إنشاؤه عبر المولد:
`node D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\generator.js creative --app <AppFolder> --brand <Brand> --name <Name> --desc <Objective>`

### هيكل المجلدات الإلزامي (The 8 Levels):
```text
<App-Folder>/<Brand-Name>/<Project-Name>/
├── 01-Source/          # الملفات الخام والمراجع والتسجيلات غير المعدلة
├── 02-Assets/          # الخطوط، الشعارات، الخامات، الأصوات
├── 03-Project/         # ملفات العمل المفتوحة (.blend, .psd, مسودات CapCut)
├── 04-Previews/        # صور المعاينة وإطارات المراجعة ولقطات الشاشة
├── 05-Exports/         # المخرجات النهائية الجاهزة للتسليم
├── 06-Reports/         # التقارير وملفات Markdown التحليلية
│   └── INITIAL_BRIEF.md
├── 07-Errors/          # سجلات الأخطاء والمشاكل التقنية والإصلاحات
├── 08-Backups/         # النسخ الاحتياطية المؤرخة لنقاط الاستعادة
├── PROJECT_INFO.md     # بطاقة تعريف المشروع الإلزامية
└── PROJECT_PROGRESS.md # سجل متابعة مراحل الإنتاج
```

### قالب ملف `PROJECT_INFO.md`:
```markdown
# PROJECT_INFO — <Project-Name>
- **Application:** <Application Name>
- **Brand Name:** <Brand Name>
- **Project Name:** <Project Name>
- **Objective:** <Clear statement of purpose>
- **Primary Project Path:** \`03-Project/\`
- **Owner & Designer:** Mahmoud Adel
- **Version:** 1.0.0
- **Creation Date:** <YYYY-MM-DD>
- **Status:** <INITIALIZED | IN_PROGRESS | COMPLETED | ARCHIVED>
```
