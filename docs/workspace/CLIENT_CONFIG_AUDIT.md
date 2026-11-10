# MADEL Studio Bridge — تدقيق ملفات إعدادات عملاء AI (Client Config Audit)
**المسار الرئيسي:** `D:\MCP`  
**المالك:** Mahmoud Adel — محمود عادل  
**الإصدار:** 1.0.0 — P12 CLIENT CONFIGURATION AUDIT  

---

## 1. جدول تدقيق العملاء المعتمدين

| العميل (AI Client) | مسار ملف الإعداد | المسار السابق في الإعداد | المسار الجديد المعتمد | النسخة الاحتياطية | حالة التدقيق |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Google Antigravity** | `C:\Users\asus\.gemini\config\mcp_config.json` | `D:\MCP\Adobe-Bridge\stable-candidate\...` | `D:\MCP\01-Projects\Installed\Adobe-Bridge\stable-candidate\dist\index.js` | `mcp_config.json.p12.bak` | **VERIFIED PASS** |
| **Claude Code** | `C:\Users\asus\.claude.json` | `D:\MCP\Adobe-Bridge\stable-candidate\...` | `D:\MCP\01-Projects\Installed\Adobe-Bridge\stable-candidate\dist\index.js` | `claude.json.p12.bak` | **VERIFIED PASS** |
| **OpenAI Codex** | `C:\Users\asus\.codex\config.toml` | `D:/MCP/Adobe-Bridge/stable-candidate/...` | `D:/MCP/01-Projects/Installed/Adobe-Bridge/stable-candidate/dist/index.js` | `config.toml.p12.bak` | **VERIFIED PASS** |
| **Claude Desktop** | `C:\Users\asus\AppData\Roaming\Claude\claude_desktop_config.json` | - | - | غير مثبت على الجهاز | **NOT INSTALLED** |
| **Cursor MCP** | `C:\Users\asus\AppData\Roaming\Cursor` | - | - | غير مثبت على الجهاز | **NOT INSTALLED** |
| **VS Code MCP** | `C:\Users\asus\AppData\Roaming\Code\User\settings.json` | - | - | غير مهيأ محلياً | **NOT CONFIGURED** |

---

## 2. مقتطفات من الإعدادات النشطة بعد التحديث

### أ. Google Antigravity (`mcp_config.json`):
```json
"brainferno-adobe-bridge": {
  "command": "node",
  "args": [
    "D:\\MCP\\01-Projects\\Installed\\Adobe-Bridge\\stable-candidate\\dist\\index.js"
  ],
  "env": {
    "BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS": "0",
    "BRAINFERNO_MCP_BRIDGE_INSECURE": "0"
  }
}
```

### ب. Claude Code (`.claude.json`):
```json
"brainferno-adobe-bridge": {
  "type": "stdio",
  "command": "node",
  "args": [
    "D:\\MCP\\01-Projects\\Installed\\Adobe-Bridge\\stable-candidate\\dist\\index.js"
  ],
  "env": {
    "BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS": "0",
    "BRAINFERNO_MCP_BRIDGE_INSECURE": "0"
  }
}
```

### ج. OpenAI Codex (`config.toml`):
```toml
[mcp_servers.brainferno-adobe-bridge]
command = "node"
args = ["D:/MCP/01-Projects/Installed/Adobe-Bridge/stable-candidate/dist/index.js"]

[mcp_servers.brainferno-adobe-bridge.env]
BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS = "0"
BRAINFERNO_MCP_BRIDGE_INSECURE = "0"
```

---

## 3. التحقق من النسخ الاحتياطية

تم حفظ النسخ الاحتياطية في:
`D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\backups\mcp-configs`
- `mcp_config.json.p12.bak`
- `claude.json.p12.bak`
- `config.toml.p12.bak`
كافة النسخ سليمة وكاملة ويمكن استرجاعها فوراً في أي وقت.
