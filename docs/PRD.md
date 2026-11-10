# Product Requirements Document (PRD) — MADEL Studio Bridge
**اسم المنتج:** MADEL Studio Bridge  
**المطور والمشرف الأساسي:** Mahmoud Adel — محمود عادل  
**الإصدار المستهدف:** 1.0.0-Release  
**تاريخ الاعتماد:** 10 نوفمبر 2026

---

## 1. الرؤية التنفيذية للمنتج (Product Vision)

**MADEL Studio Bridge** هي منصة ذكاء اصطناعي موحدة ومفتوحة المعايير مبنية على بروتوكول Model Context Protocol (MCP)، تهدف إلى تمكين عملاء ووكلاء الذكاء الاصطناعي (مثل Google Antigravity، وClaude Code، وOpenAI Codex، وCursor) من التحكم المباشر والآمن في برامج الإنتاج والتصميم والمونتاج الاحترافية عبر حاسبة المستخدم المحلية.

توفر المنصة بديلاً موحداً ومنظماً للحلول الفردية المتفرقة، وتجمع تحت مظلتها محولات معيارية (Adapters) لتطبيقات Adobe (Photoshop، Premiere Pro، After Effects، Illustrator)، وبرنامج 3D مفتوح المصدر (Blender)، وبرامج تحرير الفيديو الحديثة (CapCut).

---

## 2. الأهداف الاستراتيجية (Strategic Goals)

1. **التوحيد الشامل (Consolidation):** منصة برمجية مركزية واحدة قابلة للتثبيت والإدارة على نظام التشغيل ويندوز، تجمع كافة الخوادم والأدوات والمهارات في مجلد مخصص `D:\MCP\MADEL-Studio-Bridge`.
2. **تحرير مساحة قرص النظام (Storage Optimization):** نقل كافة التبعيات الثقيلة والكاشات وسجلات المشاريع من القرص C: إلى القرص D: مع توفير أكثر من **18 GB** من مساحة النظام.
3. **التثبيت الموحد بنقرة واحدة (Unified Installer):** توفير مثبت ذكي يتعرف على البرامج المثبتة على حاسبة المستخدم ويقوم بتثبيت وضبط تكاملات MCP المناسبة دون تعقيد.
4. **تعدد العملاء المتزامن (True Multi-Client Concurrency):** تشغيل عدة عملاء ذكاء اصطناعي (Antigravity، Claude Code، Codex) بالتوازي على نفس البرنامج ودون أي تعارض في المنافذ أو تضارب في الجلسات.
5. **الأمان والخصوصية (Local-First Security):** حظر أي اتصال خارجي بدون مصادقة، وتعطيل السكربتات العشوائية افتراضياً، ومنع طلب صلاحيات Administrator.

---

## 3. المستخدمون المستهدفون (Target Personas)

1. **المصممون وصناع المحتوى الرقمي:** الذين يرغبون في أتمتة مهام Photoshop وPremiere وCapCut وتوليد التصاميم عبر محادثة ذكية طبيعية.
2. **فنانو الرسوم ثلاثية الأبعاد (3D Artists):** الذين يحتاجون إلى أتمتة Blender وبناء المجسمات وتعديل المشاهد عبر أوامر MCP.
3. **مهندسو ومطورو أنظمة الذكاء الاصطناعي (AI Engineers):** الذين يطورون وكلاء مخصصين (Autonomous Agents) لتنفيذ خطوط إنتاج الوسائط المتعددة (Pipelines).

---

## 4. نطاق البرامج المدعومة (Supported Applications Scope)

| البرنامج | طريقة التكامل الفعلي (Integration Mode) | مستوى الجاهزية | الأدوات الرئيسية المدعومة |
| :--- | :--- | :---: | :--- |
| **Adobe Photoshop** | Native UXP Extension (`ws://localhost:7897`) | **LIVE: PASS (جاهز ومفحوص 100%)** | مستندات، طبقات، نصوص نقطية، ملء، تصدير، حفظ PSD، معاينة |
| **Blender** | Native MCP via uvx (`mcp-for-blender`) | **جاهز ومربوط** | كائنات 3D، خامات، كاميرات، ريندر، تعديل المشهد |
| **CapCut Desktop** | CLI & JSON Project Engine | **متاح ومدمج على D:** | قراءة وكتابة المسودات، تعديل النصوص والتوقيتات، تقطيع الفيديو |
| **Premiere Pro** | UXP Panel Adapter (Phase P4) | **قيد التطوير المعماري** | Sequences، Clips، Transitions، أتمتة التايم لاين |
| **Illustrator** | External Scripting / Native MCP | **جاهز معمارياً** | Artboards، أشكال متجهة، تصدير SVG/PNG |
| **After Effects** | CEP Extension / aerender | **جاهز معمارياً** | Compositions، تصيير aerender، قوالب MOGRT |
| **Media Encoder** | Headless Web Service | **جاهز معمارياً** | قوائم التصدير الخلفية وترميز الفيديو |

---

## 5. المتطلبات الوظيفية (Functional Requirements)

- **FR-01 (Discovery):** فحص النظام تلقائياً واكتشاف إصدارات برامج التصميم المثبتة.
- **FR-02 (Adapter Isolation):** تشغيل كل محول تطبيق ككيان مستقل لا يؤثر تعطله على باقي التطبيقات.
- **FR-03 (Unified Installer):** حزمة تثبيت موحدة توجه إعدادات عملاء MCP (Antigravity، Claude Code، Codex) بضغطة زر.
- **FR-04 (Multi-Client Multiplexing):** مشاركة خادم Bridge محلي واحد بين كافة العملاء عبر Windows Named Pipe دون تضارب.
- **FR-05 (Native Document Integrity):** الحفاظ التام على سلامة طبقات النصوص والمتجهات داخل PSD دون أي تنقيط (Rasterization).
- **FR-06 (Rollback):** إمكانية التراجع عن أي خطوة تثبيت أو تعديل بضغطة زر واستعادة الإعدادات الأصلية.

---

## 6. المتطلبات غير الوظيفية (Non-Functional Requirements)

- **NFR-01 (Performance):** استجابة الأدوات البرمجية المحلية في أقل من 200 ميلي ثانية لكل عملية.
- **NFR-02 (Zero System Bloat):** منع تراكم الكاشات على C: وحصر التخزين الثقيل على D:.
- **NFR-03 (License Compliance):** حفظ كافة حقوق رخصة Apache-2.0 لشركة Brainferno مع توثيق اسم Mahmoud Adel كمطور ومدير للمنصة الموحدة.
- **NFR-04 (Security Fail-Closed):** رفض أي اتصال لا يحمل رمز المصادقة المحلي الصحيح أو يتجاوز نطاق Loopback.
