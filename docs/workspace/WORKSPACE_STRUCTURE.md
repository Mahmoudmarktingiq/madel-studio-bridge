# MADEL Studio Bridge — معمارية وهيكل مساحة العمل النهائية (Workspace Structure)
**المسار الرئيسي:** `D:\MCP`  
**المالك والمهندس المشرف:** Mahmoud Adel — محمود عادل  
**تاريخ الاعتماد:** 10 نوفمبر 2026  
**الإصدار:** 1.0.0 — FINAL ADOPTION  

---

## 1. فلسفة المعمارية الموحدة

تم تصميم وتثبيت الهيكل الهرمي لمساحة العمل `D:\MCP` ليكون المرجع الشامل لجميع مشاريع خوادم وأدوات بروتوكول MCP، والمشاريع الإبداعية المعتمدة على برامج التصميم، ومستودعات التطوير البرمجي:
1. **جذر نظيف ومحكم (Strict Root):** لا توجد أي مشاريع حرة أو ملفات مؤقتة في جذر `D:\MCP`؛ الجذر محجوز فقط لملفات توجيه الذكاء الاصطناعي والمجلدات الرئيسية المرقمة.
2. **استبعاد طبقة `Creative-Workspaces` نهائياً:** مجلدات البرامج الإبداعية تقع مباشرة داخل `D:\MCP` بأرقام تسلسلية ثنائية الخانة (`02-Blender`, `03-CapCut`, إلخ).
3. **الفصل التام بين بيئات التشغيل والتطوير:** المشاريع البرمجية مفصولة بصرامة داخل `01-Projects` بين `Installed` (بيئات التشغيل الحية) و `Source` (مستودعات التطوير المصدرية).
4. **التوحيد القياسي للمشاريع الإبداعية:** هيكل موحد من 8 مستويات داخل كل مشروع إبداعي مع بطاقة معلومات المشروع الإلزامية `PROJECT_INFO.md`.

---

## 2. المخطط الشجري الكامل للمساحة المعتمدة

```text
D:\MCP
│
├── AGENTS.md                          # المرجع الموحد الشامل لجميع وكلاء ونماذج AI
├── CLAUDE.md                          # توجيهات Claude Code مع الربط بـ AGENTS.md
├── CODEX.md                           # توجيهات OpenAI Codex
├── GEMINI.md                          # توجيهات Google Antigravity & Gemini CLI
├── .cursorrules                       # قواعد محرر Cursor
├── .windsurfrules                     # قواعد محرر Windsurf
├── .clinerules                        # قواعد إضافة Cline
├── .roomodes                          # أوضاع Roo Code المخصصة
│
├── 01-Projects                        # المشاريع والأدوات البرمجية وخوادم MCP
│   ├── Installed                      # الخوادم والأدوات المثبتة محلياً والمشغلة فعلياً
│   │   ├── MADEL-Studio-Bridge        # المنصة الموحدة كحزمة تشغيلية
│   │   ├── Adobe-Bridge               # خادم جسر أدوبي الفعلي ومضاعف الجلسات
│   │   ├── Blender-MCP                # خادم ومحول Blender MCP
│   │   ├── CapCut-CLI                 # أدوات وسكربتات مونتاج CapCut
│   │   └── Other-MCP-Tools            # أدوات Chrome DevTools, Stitch, Science
│   │
│   └── Source                         # مشاريع التطوير البرمجي ومستودعات Git
│       ├── MADEL-Studio-Bridge        # المستودع المصدري الرئيسي لمنصة MADEL
│       ├── Test-MCP-Tool              # مشروع برمجي تجريبي للتحقق من السقالة
│       └── Other-GitHub-Projects      # أي مشاريع برمجية مستقبلية
│
├── 02-Blender                         # مشاريع Blender (Brand / Project)
│   └── AlMawada-CNC
│       └── CNC-Product-Ad             # مشروع إعلان وإظهار المنتجات 3D
│
├── 03-CapCut                          # مشاريع CapCut (Brand / Project)
│   └── AlMawada-CNC
│       └── Raw-Edit-Commercial        # مشروع مونتاج وترجمة إعلانات الفيديو
│
├── 04-Photoshop                       # مشاريع Photoshop (Brand / Project)
│   ├── MADEL
│   │   └── Multi-Client-Acceptance    # مشروع التحقق متعدد العملاء
│   └── Loris
│       └── Social-Design-01           # مشروع تصميمات التواصل الاجتماعي
│
├── 05-Premiere                        # مشاريع Premiere Pro
├── 06-Illustrator                     # مشاريع Illustrator
├── 07-AfterEffects                    # مشاريع After Effects
├── 08-Office                          # مشاريع وأتمتة Office
├── 09-VideoScribe                     # مشاريع الرسوم التوضيحية VideoScribe
├── 10-Aspire                          # مشاريع ماكينات الراوتر CNC Vectric Aspire
└── 11-Other-Apps                      # أي تطبيقات إبداعية إضافية مستقبلية
```

---

## 3. تفصيل طبقات التنظيم

### أ. المشاريع البرمجية (01-Projects):
- **`01-Projects\Installed`:** مخصص للأدوات التنفيذية التي يجب أن تبقى متصلة وتعمل كخدمات محلية.
- **`01-Projects\Source`:** مخصص للتطوير البرمجي مع توفير الهيكل القياسي الموحد المكون من:
  `src/`, `config/`, `docs/`, `reports/`, `errors/`, `logs/`, `tests/`, `builds/`, `releases/`, `backups/`.

### ب. المشاريع الإبداعية (02 إلى 11):
- يتبع مسار كل مشروع التسلسل:  
  `D:\MCP\<App-Folder>\<Brand-Name>\<Project-Name>`
- يحتوي كل مشروع إبداعي على التقسيم الثماني الصارم:
  - `01-Source`: الملفات الأصلية والتسجيلات الخام.
  - `02-Assets`: الخطوط، الشعارات، الخامات، الأصوات.
  - `03-Project`: ملفات العمل المفتوحة (`.blend`, `.psd`, مسودات CapCut).
  - `04-Previews`: صور المعاينة وإطارات المراجعة.
  - `05-Exports`: المخرجات النهائية الجاهزة للتسليم.
  - `06-Reports`: التقارير الهندسية وملفات Markdown التحليلية.
  - `07-Errors`: سجلات المشاكل التقنية والأخطاء.
  - `08-Backups`: النسخ الاحتياطية المؤرخة لنقاط الاستعادة.
- بطاقة تعريف المشروع الإلزامية `PROJECT_INFO.md` وسجل التقدم `PROJECT_PROGRESS.md`.
