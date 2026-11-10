# MADEL Studio Bridge — قائمة تنظيف جذر مساحة العمل (Root Cleanup Manifest)
**المشروع:** MADEL Studio Bridge — P13 Final Duplicate Audit & Root Cleanup  
**المالك والمهندس المشرف:** Mahmoud Adel — محمود عادل  
**المسار الرئيسي:** `D:\MCP`  
**تاريخ الإعداد:** 10 نوفمبر 2026 — 18:21:00  
**الحالة التشغيلية:** **SAFE CLEANUP READY — AWAITING EXPLICIT USER APPROVAL**

---

## 1. جدول تصنيف المجلدات في جذر `D:\MCP`

> [!IMPORTANT]
> **قاعدة أمان صارمة:** لا يتم حذف أي مجلد غير فارغ إلا بعد الحصول على الموافقة الصريحة والمباشرة من المطور محمود عادل. تم تنظيف المجلدات الفارغة فقط (`archives`, `logs`).

| المجلد في الجذر | الحجم الفعلي | عدد الملفات | الحالة الحالية | المسار البديل المعتمد في الهيكل الجديد | الإجراء المقترح |
| :--- | :---: | :---: | :---: | :--- | :---: |
| `archives` | 0 B | 0 | **تم التنظيف** | `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\docs\` | **ALREADY_REMOVED** |
| `logs` | 0 B | 0 | **تم التنظيف** | `D:\MCP\01-Projects\Installed\Adobe-Bridge\logs\` | **ALREADY_REMOVED** |
| `Capcat` | 2,619.66 MB | 492 | مكرر 100% | `D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `blender` | 451.01 MB | 252 | مكرر 100% | `D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `security-reports` | 162.49 MB | 7,789 | مكرر 100% | `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\docs\security-reports\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `Adobe-Bridge` | 33.88 MB | 7,412 | مكرر 100% | `D:\MCP\01-Projects\Installed\Adobe-Bridge\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `Adobe-Bridge-Audit` | 20.33 MB | 3,964 | مكرر 100% | `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\docs\` & `04-Photoshop\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `MADEL-Studio-Bridge` | 18.70 MB | 3,924 | مكرر 100% | `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `legacy` | 15.65 MB | 3,572 | مكرر 100% | `D:\MCP\01-Projects\Installed\Adobe-Bridge\legacy\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| `backups` | 0.15 MB | 13 | مكرر 100% | `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\backups\` | **READY_FOR_DELETE** (بانتظار الموافقة) |
| **runtime** | **11,238.91 MB** | **75,823** | **نشط ومحمي** | **D:\MCP\runtime\uv-cache (كاش البيئة النشطة)** | **PROTECTED_PERMANENT (ممنوع الحذف قطيعاً)** |

---

## 2. إحصائيات الاسترداد المتوقعة (Recovery Metrics)

- **إجمالي الملفات المرشحة للإزالة:** **27,418 ملفاً**
- **المساحة المستردة الفورية من قرص D:** **3,321.87 MB (~ 3.24 GB)**
- **حالة التطابق والنسخ الاحتياطي:** 100% SHA-256 Parity مع الهيكل الجديد.
- **تأثير الحذف على تكاملات MCP:** **صفر (Zero Downtime / Zero Broken Paths)**.

---

## 3. العناصر المحمية في الجذر بشكل دائم (Protected Permanent Items)

تعتبر العناصر التالية جزءاً لا يتجزأ من بيئة العمل التشغيلية ويحظر حذفها نهائياً:

### أ. الدلائل المحمية:
1. `D:\MCP\runtime` — مجلد الكاش المشترك لـ Python و uvx و Blender MCP.
2. المجلدات المرقمة من `01-Projects` إلى `11-Other-Apps`.
3. مجلدات تكوينات بيئات التطوير (`.cursor`, `.roo`, `.vscode`).

### ب. ملفات الدستور والتوجيه للذكاء الاصطناعي:
1. `D:\MCP\AGENTS.md`
2. `D:\MCP\CLAUDE.md`
3. `D:\MCP\CODEX.md`
4. `D:\MCP\GEMINI.md`
5. `.cursorrules`, `.clinerules`, `.windsurfrules`, `.roomodes`

---

## 4. أمر التنفيذ الآمن المجهز (Pending Safe Execution Command)

عند تلقي الموافقة الصريحة من المستخدم، سيتم تنفيذ الحذف الآمن للمجلدات الثمانية المكررة دون التأثير على `runtime` أو المجلدات المرقمة:

```powershell
# سيتم التنفيذ فقط بعد موافقة المستخدم
$candidates = @(
    'D:\MCP\Adobe-Bridge',
    'D:\MCP\Adobe-Bridge-Audit',
    'D:\MCP\MADEL-Studio-Bridge',
    'D:\MCP\blender',
    'D:\MCP\Capcat',
    'D:\MCP\security-reports',
    'D:\MCP\legacy',
    'D:\MCP\backups'
)

foreach ($dir in $candidates) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-Output "Cleaned legacy duplicate folder: $dir"
    }
}
```
