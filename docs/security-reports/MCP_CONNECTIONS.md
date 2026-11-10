# اتصالات MCP

10 نوفمبر 2026. مستويات الدليل منفصلة بين التسجيل وبدء العملية واستجابة التطبيق.

| العميل والنطاق | الخادم | النقل والهدف | دليل الحالة |
|---|---|---|---|
| Claude Code، المستخدم، `C:\Users\asus\.claude.json` | `blender` | `stdio` عبر `uvx.exe mcp-for-blender`، مع قسم بيئة | المسار قابل للحل. Blender حي ومستمع. لا توجد عملية Claude حية ظاهرة ولا نتيجة أداة Blender مطابقة ضمن عينة آخر 100 ملف JSONL مفحوص |
| Claude Code، المشروع `D:\GoogleAntigravity\casher\.mcp.json` | `stitch` | HTTPS إلى `stitch.googleapis.com`، اعتماد في `headers` | تسجيل خاص بالمشروع. حالة الثقة والاتصال من داخل المشروع غير مختبرة |
| Codex، `C:\Users\asus\.codex\config.toml` | `blender` | `stdio` عبر `uvx.exe mcp-for-blender`، مع قسم بيئة | استجابة `get_addon_status` حيّة. الحزمة المخزنة محلياً `2.2.7` والملحق `1.8` |
| Codex، الملف نفسه | `node_repl` | `stdio`، `node_repl.exe` داخل موارد حزمة Codex | توجد عمليات حية للثنائية المرفقة |
| Codex، الملف نفسه | `stitch` | HTTPS إلى `stitch.googleapis.com`، `env_http_headers` | مسجّل وتظهر مساحة أدوات Stitch لهذه الجلسة. نجاح المصادقة وتنفيذ الأداة غير مختبرين |
| Antigravity، `~\.gemini\config\mcp_config.json` | `blender` | `stdio` عبر `uvx.exe mcp-for-blender` | رُصد `uvx.exe` تابعاً لـ`language_server.exe` مع خادم Python. لم تُرصد جلسة TCP ثابتة تخص هذه السلسلة في اللقطة، ولم تُستدع أداة منه |
| Antigravity، الملف نفسه | `chrome-devtools` | `stdio` عبر Node وملف JS مرفق، `1.9.0` | العملية بدأت من `language_server.exe`. استجابة أدوات المتصفح غير مختبرة |
| Antigravity، الملف نفسه | `stitch` | HTTPS إلى `stitch.googleapis.com`، اعتماد في `headers` | مسجّل. لا يوجد اختبار مصادقة في التدقيق |
| Antigravity، إضافة `science` | `biomolecular_structure_viewer_mcp` | `stdio` عبر `agy-node` وsidecar محلي | مكوّن إضافة مفعلة. يوجد `agy-node.cmd` في مجلد Roaming الخاص بالتطبيق، ولا يُحل من PATH العام لهذه الجلسة. نجاح التشغيل غير مختبر |
| جميع العملاء | Brainferno وComfyUI وCapCut وGraphify | لا تعريف في نطاقات التسجيل النشطة المفحوصة | Brainferno حزمة على القرص، ComfyUI API تاريخي، CapCut CLI، و`graphify-mcp.exe` ثنائية مكتشفة |

## مصادر الإعداد والنسخ المتداخلة

- **Claude** ظهر `mcpServers` الشخصي في `~\.claude.json`. النسخة داخل `~\.claude\.claude.json` وملف `settings.json` لم يتضمنا تسجيل MCP في الفحص. فُحصت أيضاً ملفات المشروع ومصادر Windows المحلية الشائعة لـ`managed-mcp.json` و`managed-settings.json`. لم تظهر سياسة MCP محلية مُدارة فيها. تطبيق سياسة سحابية يعتمد على الحساب ولا يحسمه فحص القرص. الأولوية حسب الوثائق للـlocal ثم project ثم user عند تعارض الاسم. [وثائق Claude MCP](https://code.claude.com/docs/en/mcp)
- **Codex** حُلل TOML مباشرة. احتوت ثلاث نسخ تاريخية بتاريخ 19 أغسطس على `node_repl` فقط. نسخة 9 نوفمبر تضيف Stitch. لا تُدمج النسخ الاحتياطية في العدد الحالي. مسار `node_repl` يشير إلى إصدار حزمة محدد، وتغير الحزمة قد يتطلب تحققاً من المسار الذي يديره التطبيق. [وثائق OpenAI عن MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- **Antigravity** تعريفات `~\.gemini\config\mcp_config.json` و`~\.gemini\antigravity\mcp_config.json` متطابقة في المقارنة البنيوية. `~\.gemini\antigravity-ide\mcp_config.json` يتضمن تعريف Stitch المطابق فقط. `config\mcp_config.json.bak` يتضمن Stitch وChrome DevTools. وجود أكثر من ملف لا يثبت أن التطبيق يجمعها جميعاً. رصد التشغيل يثبت تحميل التعريف المكافئ للخادمين المحليين، لكنه لا يعيّن مسار الملف من بين النسختين المتطابقتين.
- **مسار الإدارة المعتمد** في Antigravity استخدم لوحة الوكيل ثم `MCP Servers → Manage MCP Servers → View raw config` لتحديد الملف الذي يعرضه السطح المفتوح. المسار الموثق للنسخة الحالية `~/.gemini/config/mcp_config.json` أو `.agents/mcp_config.json` للمشروع. استخدم مخطط `command/args/env` لـstdio و`serverUrl` للبعيد وفق وثائق السطح. لا يُفترض من وجود `Antigravity.exe` وجود `agy` أو أنه يستخدم ملف IDE القديم. [وثائق Google عن MCP](https://antigravity.google/docs/mcp?tab=ide)
- **الأسرار** تحتوي ملفات JSON المذكورة على حقول رؤوس مصادقة لـStitch في أكثر من نطاق. يستخدم Codex مرجع متغير بيئة للرأس. المقارنة أجريت داخل العملية دون عرض القيم أو أخذ نسخة من الملفات. لا يكفي وجود مرجع بيئة لإثبات أن متغير الاعتماد متاح للعميل.

## مشاركة Blender

مشاركة مثيل Blender والملحق على loopback ممكنة بالفعل من عمليات خوادم متعددة. `stdio` يعني أن كل وكيل يبدأ عملية MCP خاصة به، ثم تتصل العملية بمنفذ الملحق نفسه. تعدد العمليات ليس بحد ذاته تعارضاً. الكتابة المتزامنة إلى الحالة نفسها قد تغير المشهد المفتوح، وواجهة الملحق تعرض `execute_code`. في المرحلة التالية استخدم مشهداً تجريبياً، وعميل كتابة واحداً، وإصدار حزمة مثبتاً، وتحقق من `get_addon_status` لكل عميل على حدة. [المصدر الأولي لحزمة MCP for Blender](https://github.com/ahujasid/mcp-for-blender)
