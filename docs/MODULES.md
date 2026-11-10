# MADEL Studio Bridge — Modules & Adapters Specification
**المشروع:** MADEL Studio Bridge  
**المطور والمشرف:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0-Modules  
**تاريخ التوثيق:** 10 نوفمبر 2026

---

## 1. تصنيف آليات التكامل (Integration Modes Classification)

لضمان الدقة والاحترافية البرمجية، تُصنف تكاملات البرامج داخل المنصة وفق الفئات التقنية الصريحة التالية:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MADEL Studio Bridge Integration Modes                │
├───────────────────┬────────────────────────────────────────────────────┤
│ Native MCP        │ اتصال بروتوكول MCP مباشر عبر لوحة UXP / CEP داخلية│
├───────────────────┼────────────────────────────────────────────────────┤
│ MCP Wrapper       │ خادم وسيط يترجم أوامر MCP إلى بروتوكول محلي للبرنامج│
├───────────────────┼────────────────────────────────────────────────────┤
│ CLI Integration   │ أتمتة عبر واجهة سطر الأوامر وملفات المشاريع       │
├───────────────────┼────────────────────────────────────────────────────┤
│ Agent Skill       │ مهارة ذكاء اصطناعي تفاعلية (SKILL.md) لتوجيه الوكلاء│
├───────────────────┼────────────────────────────────────────────────────┤
│ Desktop Automation│ تحكم برمجي بنظام التشغيل والنوافذ (OS Scripting)  │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 2. تفاصيل ومواصفات الوحدات والمحولات (Module Specifications)

### 1. محول Photoshop (Photoshop Adapter):
- **المسار:** `D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter\`
- **طريقة التكامل:** **Native MCP (UXP Panel + BatchPlay Engine)**.
- **الحالة الحالية:** **LIVE: PASS (تم اختباره واعتماده 100%)**.
- **منفذ الاتصال:** WebSocket محلي على `ws://localhost:7897`.
- **البرنامج المستهدف:** Adobe Photoshop 2026 (v27.8.0+).
- **أهم القدرات:**
  - `ps_create_document`: إنشاء مستندات جديدة بمقاسات ودقة مخصصة.
  - `ps_create_layer` / `ps_fill`: إنشاء طبقات بكسل وتلوينها.
  - `ps_create_text_layer`: إنشاء طبقات نصوص نقطية أصلية قابلة للتعديل دون أي تنقيط.
  - `ps_list_documents` / `ps_list_layers`: قراءة واسترجاع بيانات الطبقات والحدود بدقة.
  - `ps_save_document` / `ps_open_document`: حفظ وفتح ملفات PSD كاملة.
  - `ps_get_preview` / `ps_export`: تصدير صور PNG والمعاينات السريعة.

### 2. محول Blender (Blender Adapter):
- **المسار:** `D:\MCP\MADEL-Studio-Bridge\adapters\blender-adapter\`
- **طريقة التكامل:** **MCP Wrapper (Python uvx Daemon)**.
- **الحالة الحالية:** **مُهيأ ومربوط بنجاح (Configured & Active)**.
- **طريقة التشغيل:** `uvx mcp-for-blender` على المنفذ `9876` مع ربط محلي بـ Blender.
- **البرنامج المستهدف:** Blender 4.x / 5.x.
- **أهم القدرات:**
  - استدعاء أكواد بايثون للتحكم في مشهد Blender.
  - إضافة وتعديل المجسمات والكاميرات والإضاءة.
  - ضبط المواد والخامات (Materials / Shaders).
  - تصيير المشهد (Render) وتصدير الصور والنماذج ثلاثية الأبعاد.

### 3. محول CapCut (CapCut Video Adapter):
- **المسار:** `D:\MCP\MADEL-Studio-Bridge\adapters\capcut-adapter\`
- **طريقة التكامل:** **CLI Integration + Agent Skill**.
- **الحالة الحالية:** **متاح على D: وجاهز للاستدعاء عبر المهارات**.
- **المسار الفعلي للأصول:** `D:\MCP\Capcat` (2.62 GB).
- **البرنامج المستهدف:** CapCut Desktop / JianYing.
- **أهم القدرات:**
  - فحص وقراءة مسودات المشاريع `draft_content.json`.
  - كتابة وتعديل الترجمات التلقائية (Subtitles) والتوقيتات وسرعة المقاطع.
  - قص المقاطع الطويلة إلى فيديوهات قصيرة (Long-form to Shorts).
  - إضافة قوالب الرسوم المتحركة (Animations / Fade / Ken-Burns).

### 4. محول Premiere Pro (Premiere Pro Adapter — Phase P4):
- **المسار:** `D:\MCP\MADEL-Studio-Bridge\adapters\premiere-adapter\`
- **طريقة التكامل:** **Native MCP (UXP Panel + Premiere Pro Extensibility API)**.
- **الحالة الحالية:** **جاهز معمارياً وتوثيقياً للبدء**.
- **البرنامج المستهدف:** Adobe Premiere Pro 25.6+.
- **القدرات المخططة:**
  - أتمتة التايم لاين وإنشاء الـ Sequences.
  - إدراج وترتيب مقاطع الفيديو والصوت.
  - إدراج قوالب Motion Graphics templates (.mogrt).
  - إرسال مهام التصدير إلى Adobe Media Encoder في الخلفية.

---

## 3. مساحات الأسماء المقترحة للأدوات (Tool Namespaces Design Proposal)

> [!NOTE]
> هذه الأسماء هي تصميم مستقبلي موحد مقترح للمنصة لتوحيد الواجهات تحت اسم MADEL، بينما تعمل الأدوات حالياً بأسمائها التشغيلية المعتمدة (`ps_*`, `pp_*`, `blender_*`) لضمان التوافق التام مع العملاء.

```text
madel.photoshop.create_document
madel.photoshop.create_layer
madel.photoshop.create_text_layer
madel.photoshop.save_psd
madel.photoshop.export_png

madel.blender.create_object
madel.blender.set_material
madel.blender.render_frame

madel.capcut.read_draft
madel.capcut.update_subtitles
madel.capcut.cut_video

madel.premiere.create_sequence
madel.premiere.insert_clip
madel.premiere.export_sequence
```
