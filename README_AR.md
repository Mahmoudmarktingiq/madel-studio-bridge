# منصة MADEL Studio Bridge
**المنصة الموحدة لربط تطبيقات التصميم والمونتاج ببروتوكول MCP**  
**تطوير وإشراف: محمود عادل — Mahmoud Adel**  
*مبني جزئياً على مشروع Brainferno MCP Bridge (رخصة Apache-2.0)*

[![الرخصة: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![بروتوكول MCP](https://img.shields.io/badge/MCP-2024--11--05-brightgreen.svg)](https://modelcontextprotocol.io)
[![النظام: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6.svg)](#)
[![الأمان: 0 ثغرات](https://img.shields.io/badge/Security-0%20Vulnerabilities-success.svg)](#)

---

## ما هي منصة MADEL Studio Bridge؟

**MADEL Studio Bridge** هي منصة متقدمة ومحلية قائمة على بروتوكول [Model Context Protocol (MCP)](https://modelcontextprotocol.io)، تمنح وكلاء ومساعدي الذكاء الاصطناعي (مثل Antigravity و Claude Code و Codex و Cursor) القدرة على التحكم المباشر والآمن في برامج الإنتاج والتصميم والمونتاج على نظام ويندوز.

بدلاً من تشغيل أدوات منفصلة تستهلك مساحات هائلة وتتصادم على منافذ الشبكة، توفر منصة MADEL Studio Bridge **بوابة موحدة** تدعم مضاعف الأنابيب المسمّاة (Windows Named Pipe Multiplexer)، مما يتيح لخادم خلفي واحد خدمة عدة عملاء ذكاء اصطناعي بالتوازي دون أي تضارب.

---

## الحالة التشغيلية الحالية للمنصة

### ✅ المكونات العاملة والمختبرة حياً (Production Ready)
- **Adobe Photoshop 2026 (عبر لوحة UXP BatchPlay):**
  - اتصال WebSocket محلي آمن (`ws://127.0.0.1:7897`) مع توثيق Handshake.
  - إنشاء المستندات، وإدارة الطبقات، وإضافة نصوص قابلة للتحرير دون تنقيط (Non-destructive Text Layers)، وتلوين الأشكال المتجهية.
  - تصدير ومعاينة الصور بدقة كاملة وحفظ ملفات PSD.
  - تأمين كامل للمخططات عبر **Zod 4.6.7** وسد الثغرات المعروفة.
- **Blender 4.x / 5.x LTS:**
  - أتمتة المجسمات ثلاثية الأبعاد والخامات والكاميرات والإضاءة والتصيير (Render) عبر جسر بايثون.
  - كاش مشترك ومعزول على قرص التخزين الإضافي (`D:\MCP\runtime\uv-cache`).
- **CapCut Desktop (نظام ويندوز):**
  - الفحص البرمجي التلقائي لمسودات المونتاج والتايم لاين (`draft_content.json`).
  - توليد الترجمات، وتطبيق حركة الكاميرا Ken-Burns، وإدارة مقاطع البروكسي.
- **دعم تعدد عملاء الذكاء الاصطناعي بالتوازي (Multi-Client Concurrency):**
  - تم التحقق الميداني من تشغيل **Google Antigravity** و **Claude Code** و **OpenAI Codex** في وقت واحد عبر الأنبوب المسمّى (`\\.\pipe\brainferno-mcp-bridge`).

### 🚧 المكونات قيد التطوير وفق خريطة الطريق (Roadmap)
- **محول Adobe Premiere Pro:** أتمتة التايم لاين والمقاطع (مخطط في P22).
- **محول Adobe Illustrator:** توليد المسارات الفيكتورية و Artboards (مخطط في P21).
- **بوابة Browser MCP:** أتمتة المتصفح وجلب المراجع البصرية (مخطط في P23).
- **لوحة التحكم المكتبية Dashboard:** واجهة تفاعلية لمراقبة الاتصالات (مخطط في P19).
- **حزمة التثبيت Windows Setup:** مثبت تنفيذي مستقل MSI/EXE (مخطط في P25 — *التشغيل الحالي عبر CLI ومستودع السورس فقط*).

---

## عملاء الذكاء الاصطناعي المختبرون

- **Google Antigravity**
- **Claude Code CLI**
- **OpenAI Codex CLI**
- **Cursor IDE**
- **VS Code (Cline / Roo Code / Continue)**
- **Gemini CLI**

---

## متطلبات التشغيل

- **نظام التشغيل:** Windows 10 أو Windows 11 (معمارية 64-bit).
- **بيئة التشغيل:** [Node.js](https://nodejs.org) إصدار 20 أو أحدث (تم الاختبار على Node v26.13.0).
- **البرامج الإبداعية (اختياري بحسب الاستخدام):**
  - Adobe Photoshop 2024–2026.
  - Blender 4.x أو 5.x LTS.
  - CapCut Desktop لويندوز.

---

## دليل تشغيل نسخة المطور (Developer Build)

### 1. استنساخ المستودع
```bash
git clone https://github.com/Mahmoudmarktingiq/madel-studio-bridge.git
cd madel-studio-bridge
```

### 2. تثبيت الحزم والتبعيات
```bash
npm install
```

### 3. بناء المشروع من السورس
```bash
npm run build
```

### 4. تشغيل حزمة الاختبارات
```bash
npm test
```
*يتم تشغيل 13 فحص توافقية بالإضافة إلى اختبار بروتوكول MCP عبر Stdio.*

### 5. تشغيل الخادم
```bash
npm start
```

---

## نموذج الأمان والخصوصية

- **اتصال محلي حصري (Localhost Only):** كافة المنافذ مقيدة بـ `127.0.0.1`.
- **أدنى صلاحيات (Least Privilege):** يعمل الخادم في مساحة المستخدم دون الحاجة لصلاحيات المدير Administrator.
- **حظر السكربتات المجهولة افتراضياً:** المتغير `BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0` يمنع تمرير نصوص برمجية عشوائية دون موافقة صريحة.
- **خلو تام من الثغرات الأمنية:** تم فحص المشروع عبر `npm audit` بنسبة 0 ثغرات.

---

## التراخيص والحقوق

- مرخص بموجب رخصة **[Apache License, Version 2.0](LICENSE)**.
- تطوير وإشراف وتصميم المعمارية: **محمود عادل (Mahmoud Adel)**.
- مبني جزئياً على مشروع [Brainferno MCP Bridge](https://github.com/Brainferno)، حقوق النشر 2026 محفوظة لشركة Brainferno, LLC ومطورها Vincent Parker. طالع ملف [NOTICE](NOTICE) وملف [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) للتفاصيل القانونية ونسب الفضل لأصحابه.
