# حالة ربط Adobe

## الجسر المحلي

`D:\MCP\Adobe-Bridge\server` يحتوي Brainferno MCP Bridge `0.3.4` بترخيص Apache-2.0. نقطة الدخول `dist\index.js` تنشئ `StdioServerTransport`. يوجد مسار HTTP اختياري، والربط بين الخادم واللوحات يتم عبر WebSocket محلي. وجدت كل مسارات الحزم الـ97 التي يصفها lockfile الرئيسي، وNode المثبت `26.13.0` يحقق شرط `>=20` المعلن. هذه أدلة بنية الحزمة، وليست اختبار توافق تنفيذي. المشروع مستقل عن Adobe. [مستودع Brainferno](https://github.com/Brainferno/brainferno-mcp-bridge)

| الفحص | النتيجة |
|---|---|
| سلامة النسخ | جميع ملفات الأرشيف الـ126 تطابق محتوى المسارات المقابلة في `server`. SHA-256 للأرشيف `6cfa0cd4e10ee96ca3e20c785b4ec295e3c413d1670d8a4392c2f562c5796737`. هذه مقارنة محلية بين النسخ وليست توقيع ناشر |
| نسخة التدقيق | توجد حزمة tgz ونسخة مستخرجة و`compatibility-test`. تتطابق ملفات الدخول والخادم وmanifests المختارة بين النسخ. شجرة اختبار الاعتماديات مختلفة، و`package.json` فيها مختلف رغم ثبات الإصدار |
| نوع الاختبار الموجود | `test-suite.mjs` يختبر تحميل الوحدات ومخططات الإطارات وتسجيل الأدوات على Mock Bridge في الذاكرة. لم يُشغّل في هذا التدقيق. وجوده لا يثبت وصول UXP أو COM إلى تطبيق |
| حالة التشغيل | لا يوجد تسجيل Brainferno في إعدادات الوكلاء المفحوصة. لم يُرصد Node بأمر Brainferno أو مستمع على `7897` أو `18412` أو ملفات handshake في المسارين الحالي والقديم. لا يوجد دليل على اتصال فعلي |
| مواقع اللوحات | لم تُرصد هوية Brainferno في مسارات UXP وCEP الشائعة المفحوصة. مواقع CEP العامة تحوي لوحات Adobe عادية. واجهة UXP المرفقة في مجلد الخادم تُعد حزمة جاهزة للمراجعة، وتحميلها في المضيف لم يُتحقق |
| حالة المضيف | Photoshop وIllustrator وPremiere مثبتة ولم تظهر عملياتها في لقطة Windows. تعذرت قراءة قيمة CEP debug من HKCU ضمن العزل. لا تعتمد الخطة على تفعيل هذا الوضع |

## المضيفون والعمليات

| التطبيق | الإصدار الفعلي | المسار | واجهة التحكم التي يثبتها الكود | حالة الربط وما ينقص |
|---|---|---|---|---|
| Photoshop 2026 | 27.8 | `C:\Program Files\Adobe\Adobe Photoshop 2026\Photoshop.exe` | `panels\panel-uxp` للهدف PS بحد أدنى `26.0.0`. `dist\tools\photoshop.js` يتضمن استعلامات وأوامر طبقات وBatchPlay | يحقق شرط الإصدار. يلزم اعتماد الحزمة وتحميل لوحة UXP والمصافحة والتحقق من أداة استعلام على ملف تجريبي |
| Illustrator 2025 | 29.5.1 | `C:\Program Files\Adobe\Adobe Illustrator 2025\Support Files\Contents\Windows\Illustrator.exe` | ExtendScript عبر Windows COM. `Illustrator.Application` يحل إلى `.29` و`LocalServer32` يطابق هذه الثنائية مع `/Automation`. توجد سكربتات Adobe المرفقة مثل `ImageTracing.jsx` و`SaveDocsAsSVG.jsx` | مسار COM مسجل ولم يُنشأ كائن COM. المسار الاختياري لخادم Illustrator الخارجي `localhost:18412/v1/mcp` مستقل، ولم يظهر مستمعه. يلزم اختبار استعلام COM معزول ومراجعة صلاحياته |
| Premiere Pro 2026 | 26.3.2 | `C:\Program Files\Adobe\Adobe Premiere Pro 2026\Adobe Premiere Pro.exe` | `panels\panel-uxp-ppro` بحد أدنى `25.6.0`. توجد مجلدات UXP وScripts وEveScripts وPlugIns مع التطبيق. أدوات الجسر تشمل استعلام المشروع والتسلسل وعمليات تعديل | يحقق شرط الإصدار. يلزم اعتماد الحزمة وتحميل لوحة UXP ثم اختبار استعلام آمن على تسلسل اصطناعي |
| After Effects وAudition | غير مثبتين في جرد Adobe ضمن Program Files | حزمة `panels\panel-cep` | manifest لـ`AEFT` و`AUDT` من `22.0` وأدوات في `dist\tools` | دعم في الحزمة دون مضيف ظاهر في النطاق |
| Media Encoder | لم يظهر في جرد Adobe ضمن Program Files | `dist\drivers\ame-webservice.js` | مسار WebService مع برنامج المضيف واعتمادياته | دعم في الكود، لا اختبار لهذا المضيف |

يحقق Photoshop وPremiere حدود manifests الخاصة بالجسر. دعم UXP على مستوى Adobe موثّق لكل منهما. [Photoshop UXP](https://developer.adobe.com/photoshop/uxp/2022/) · [Premiere UXP](https://developer.adobe.com/premiere-pro/uxp/)

## المخاطر المثبتة

1. **P0، استنزاف الذاكرة عبر Zod.** ملف `D:\MCP\Adobe-Bridge-Audit\npm-security-audit.json` يسجل نتيجتين High، إحداهما Zod والأخرى اعتماد بروتوكول متأثر عبر Zod. لا يعني العدد وجود ثغرتين مستقلتين. lockfile الرئيسي يحتوي `3.25.76`. نسخة الاختبار تحتوي `4.6.7` في الجذر و`3.25.76` متداخلاً تحت `@brainferno/mcp-bridge-protocol`. تقرير npm تاريخي، أما وجود النسخة المتأثرة فثبته lockfile الحالي. لم تُنفَّذ تجربة استغلال أو تدقيق npm شبكي. [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
2. **P0، امتيازات اللوحتين.** يطلب كل manifest الشبكة لجميع النطاقات و`localFileSystem: fullAccess` وحافظة قراءة وكتابة. يستحق ذلك مراجعة كود ومصدر قبل التحميل في Photoshop أو Premiere.
3. **P0، التنفيذ والتسجيل.** يتيح كود الجسر أدوات تنفيذ سكربت خام وراء مفاتيح تمكين، ويستعمل مسار Illustrator `powershell.exe -ExecutionPolicy Bypass` وCOM وملفات JSX مؤقتة. المسار قد يطلق Illustrator بصلاحيات المستخدم. افصل عمله عن ملفات الإنتاج وحسابات المستخدم العادية في الاختبار.
4. **P1، واجهات محلية.** WebSocket يرتبط افتراضياً بـ`127.0.0.1:7897` مع فحص Origin/Host ومصافحة token. خيار insecure يعطل المصادقة. ملف `~\.brainferno-mcp-bridge\bridge.json` ينقل بيانات المصافحة ويتطلب حماية ACL. HTTP الاختياري معطل افتراضياً ويطلب Bearer بطول أدنى 16 عند تمكينه.
5. **P1، مشاركة العملية.** اختلاف نسخ الخادم أو بدء أكثر من مثيل قد يؤدي إلى تخصيص منفذ بديل وتنافس على ملف المصافحة. ابدأ بنسخة واحدة وعميل واحد بعد مراجعة P0.

**قرار المرحلة التالية:** التوافق البروتوكولي `stdio` ممكن لدى Claude وCodex وAntigravity. يجب إثبات الاعتماديات والنقل واللوحة والمضيف لكل تطبيق على حدة. يسبق أول اختبار تشغيل قرار موافقة مستقل.
