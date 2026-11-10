# حالة Blender وComfyUI وCapCut

## Blender

- ثنائية التشغيل الحية `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. طلب الحالة من رابط Codex الموجود أعاد Blender `5.2.3 LTS` والملحق `1.8` وبروتوكول `15/15` والحالة `up_to_date=true`. التليمترية معطلة، وكذلك مكتبات الأصول ومولدات 3D التي أبلغت عنها الحالة.
- الملف المحلي للملحق `C:\Users\asus\AppData\Roaming\Blender Foundation\Blender\5.2\scripts\addons\blender_mcp.py`. ظهر `userpref.blend` كبيانات إعداد، وظهرت الحزمة `mcp_for_blender-2.2.7.dist-info` في مخزن uv. منفذ الملحق كان `127.0.0.1:9876` وتملكه عملية Blender.
- Claude يسجل `uvx.exe mcp-for-blender` على مستوى المستخدم. ثُبتت سلامة التطبيق والملحق والوجهة المشتركة عملياً من Codex. لم تظهر عملية Claude وقت الفحص، ولم نجد نتيجة Blender مرتبطة باستدعاء في عينة 100 ملف JSONL، فحالة جلسة Claude نفسها تبقى غير معاد التحقق منها.
- Antigravity بدأ مثيل خادم من الحزمة نفسها عبر عملية `language_server.exe`. لم يُختبر استدعاء أداة من واجهته. رُصدت عدة اتصالات Codex إلى نفس منفذ الملحق. يمكن مشاركة الملحق بين العمليات؛ يوصى بتعيين عميل واحد لأي كتابة وتجربة اتصال كل عميل على نسخة مشهد معزولة. [MCP for Blender](https://github.com/ahujasid/mcp-for-blender)
- `D:\MCP\blender\AlMawada-CNC` مشروع إبداعي فيه `assets` و`exports` و`previews` و`project` و`renders` و`reports` و`scripts`، وملف `.blend` واحد في الجرد. لا يوجد تعريف MCP في هذا الجذر. لم يُفتح الملف أو تُشغّل سكربتات المشروع.

## ComfyUI Desktop

| العنصر | الدليل |
|---|---|
| تثبيت Desktop | `C:\Users\asus\AppData\Local\Programs\@comfyorgcomfyui-electron\ComfyUI.exe`، إصدار PE ‏`0.4.57` |
| تشغيل الخادم | Desktop يضم نواة Python في `resources\ComfyUI\main.py`. `comfyui_version.py` و`pyproject.toml` يطابقان `0.3.45`. الإعداد الحالي يشير إلى `C:\Users\asus\Documents\ComfyUI` وإلى CPU. لم يظهر مفسر `.venv\Scripts\python.exe` في ذلك المسار المتوقع |
| API محلي تاريخي | `%APPDATA%\ComfyUI\logs\comfyui.log` يتضمن بدء الخادم وعنوان `http://127.0.0.1:8000`. مصدر النواة يجعل `8188` افتراضياً عند التشغيل الخام. سجل Desktop يحتوي أيضاً على خروج عملية الخادم |
| رصد حي | لم تظهر عملية ComfyUI أو Python لتشغيل `ComfyUI\main.py`، ولم يظهر مستمع على `8000` أو `8188`. لذلك لم تُختبر استجابة API حية |
| الربط الممكن | `comfy-mcp` المحلي من Comfy-Org يعتمد على `comfy-cli` ويدعم ربط API محلي. لم يظهر في PATH أو إعدادات الوكلاء المفحوصة. توافقه مع النواة `0.3.45` وأسلوب Desktop يحتاج تجربة |
| اختبار قبول مؤجل | شغّل Desktop يدوياً وتحقق من المنفذ الذي يظهر في سجله، ثم GET لـ`/system_stats` و`/object_info` على loopback. بعد الموافقة، اربط نسخة مثبّتة من MCP بعميل واحد واستعرض الأدوات قبل تقديم أي workflow |

يفصل البروتوكول بين طلبات الاستعلام وتقديم المهام عبر `POST /prompt`. خدمات MCP المحلية والسحابية مساران منفصلان. [واجهات ComfyUI الرسمية](https://docs.comfy.org/development/comfyui-server/comms_routes) · [comfy-mcp المحلي](https://github.com/Comfy-Org/comfy-mcp)

## CapCut CLI ومسودة المشروع

المصدر المثبت `%APPDATA%\npm\node_modules\capcut-cli` إصدار `0.33.1`، ترخيص MIT ومشروع مستقل عن ByteDance. `capcut.ps1` و`capcut.cmd` واجهتان لنفس الحزمة، و`capcut-cli` اسم دخول إضافي. فحص `node --check` نقطة الدخول `dist\index.js` بنجاح. العمليات أدناه مأخوذة من سجل الأوامر الموزع مع الحزمة ومن journals المحلية. لم يُنفَّذ كود الحزمة أو إجراءات تحرير جديدة. [المصدر الأولي لـCapCut CLI](https://github.com/renezander030/capcut-cli)

| مجال | الأوامر التي يعلنها الإصدار المثبت | دليل التشغيل |
|---|---|---|
| استطلاع العقد والتشخيص | `describe`، `doctor`، `diagnose`، `info`، `tracks`، `segments`، `materials`، `diff` | موجودة في موزع الأوامر. قراءة Python لبنية draft نجحت. لم تستدع الأوامر |
| بناء الجدول الزمني | `add-video`، `add-text`، `add-audio`، `trim`، `text-anim`، مع `shift` و`speed` و`volume` و`opacity` و`keyframe` و`transition` و`batch` و`compile` | لكل journal 19 مدخلاً متسلسلاً بلا انقطاع داخلي. ستة `add-video` وستة `add-text` وخمسة `trim` وواحد `add-audio` وواحد `text-anim`. البقية ثابتة من السجل البرمجي فقط |
| الترجمة والصوت والإخراج | `import-srt`، `export-srt`، `import-ass`، `export-ass`، `caption`، `translate`، `tts`، `render`، `export`، `detect-scenes`، `detect-silence` | قدرات مصرّح بها، مع متطلبات مختلفة للوسائط أو محرك التفريغ أو الخدمات الخارجية. FFmpeg متاح. جودة العرض والترجمة ودعم محرر CapCut لم تُختبر |
| الأتمتة | `serve` و`describe --compact` | `serve` قارئ طابور JSONL من stdin أو ملف. تعريفه لا ينفذ بروتوكول MCP. لا يوجد تسجيل CapCut MCP في الوكلاء الثلاثة |

### محتوى `D:\MCP\Capcat`

الجرد أحصى 225 ملفاً في `almawada`، تشمل وسائط وصوراً ومسودات وسجلي تعديل ونسخ `.bak` و`.snap` وتقارير. تتضمن الأقسام `01-Rashez` و`02-Audio` و`03-brand` و`04-CapCut-Project` و`06-Reports`. يوجد مجلدا تصدير باسمَي `05- Exports` و`05-Exports`.

`04-CapCut-Project\AlMawada_Raw_Edit_01` يحوي `draft_content.json` بحجم 74,098 بايت و`draft_info.json` بحجم 31,792 بايت. كلاهما يُقرأ ويضم ثلاثة tracks، لكن بصمتيهما مختلفتان. كل اسم يطابق نسخته تحت `Timelines` بالـSHA-256، مما يدل على وجود تمثيلين متزامنين بالاسم بين الجذر والمجلد الفرعي. لا يطابق الملف الحالي آخر `after_sha256` في journal الخاص به. السبب والمرجع الصحيح غير محسومين، وقد تختلف طريقة تخزين بيانات الجدول عبر الإصدارات. تحقق من تاريخ الكتابة ونسخة المحرر قبل أي إصلاح، وابدأ بنسخة معزولة دون `--force-write` أو `sync-timelines` على الأصل.
