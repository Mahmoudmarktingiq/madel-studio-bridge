# MADEL Studio Bridge — السجل التعريفي لعملاء الذكاء الاصطناعي (Client Registry)
**المشروع:** MADEL Studio Bridge — Phase P18  
**المالك والمهندس المشرف:** Mahmoud Adel — محمود عادل  
**المسار المصدري:** `packages/server/src/clients/registry.ts`  
**تاريخ التوثيق:** 10 نوفمبر 2026  
**الحالة:** **PRODUCTION READY & EXTENSIBLE**

---

## 1. الفلسفة المعمارية: التصريح المعياري المستقل (Declarative Client Specifications)

بدلاً من كتابة كود مخصص لكل عميل مبعثر في أرجاء المشروع، يعتمد نظام **Client Registry** في منصة MADEL Studio Bridge على نموذج **السجل التعريفي الموحد (Declarative Registry)**.

كل عميل ذكاء اصطناعي يُعرّف ككائن تصريحي مستقل (`ClientDefinition`) يحدد خصائصه ومنصات تشغيله، وصيغة ملفات إعداداته، وطرق استكشافه، دون الحاجة لأي مسارات مشفرة أو أسماء مستخدمين مخصصة، بل بالاعتماد الكامل على متغيرات بيئة النظام القياسية (`%USERPROFILE%`, `%APPDATA%`, `$HOME`, `%LOCALAPPDATA%`).

---

## 2. هيكل تعريف العميل (ClientDefinition Contract)

```typescript
export interface ClientDefinition {
  readonly id: string;                           // المعرف الفريد للعميل (claude-code, cursor, codex...)
  readonly displayName: string;                  // الاسم التجاري الكامل المعروض
  readonly description: string;                  // وصف وظيفي لمجال عمل العميل
  readonly platforms: readonly Platform[];       // المنصات المدعومة ("win32" | "darwin" | "linux")
  readonly configFormat: ConfigFormat;           // صيغة الإعدادات ("json" | "jsonc" | "toml" | "yaml")
  readonly supportedTransports: readonly TransportType[]; // وسائط النقل المدعومة (stdio, namedPipe...)
  readonly defaultTransport: TransportType;      // وسيط النقل المفضل افتراضياً
  readonly mcpServersKey: string;                // مفتاح خوادم MCP ("mcpServers", "mcp_servers", "extensions")
  readonly reloadRequirements: string;           // إرشادات إعادة التحميل المطلوبة بعد التعديل
  readonly notes?: string;                       // ملاحظات تشغيلية خاصة
  readonly unsupportedFeatures?: readonly string[]; // الميزات غير المدعومة لهذا العميل

  getConfigLocations(platform: Platform, env?: Record<string, string | undefined>): string[];
  getExecutableLocations(platform: Platform, env?: Record<string, string | undefined>): string[];
  getProcessNames(platform: Platform): string[];
  generateServerConfig(options: MadelServerConfigOptions): Record<string, unknown>;
  extractMadelEntry(configData: Record<string, unknown>): { exists: boolean; entry?: unknown; entryKey?: string };
  insertMadelEntry(configData: Record<string, unknown>, entry: Record<string, unknown>): Record<string, unknown>;
  removeMadelEntry(configData: Record<string, unknown>): { modified: boolean; data: Record<string, unknown> };
}
```

---

## 3. مصفوفة العملاء السبعة عشر المسجلين (Supported Clients Matrix)

| # | المعرف (Client ID) | الاسم المعروض | المنصات | الصيغة | مسار التكوين القياسي (Windows) | مفتاح الخوادم |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: |
| 1 | `claude-code` | Claude Code CLI | Win/Mac/Linux | JSON | `%USERPROFILE%\.claude.json` | `mcpServers` |
| 2 | `claude-desktop` | Claude Desktop | Win/Mac | JSON | `%APPDATA%\Claude\claude_desktop_config.json` | `mcpServers` |
| 3 | `openai-codex` | OpenAI Codex CLI | Win/Mac/Linux | TOML | `%USERPROFILE%\.codex\config.toml` | `mcp_servers` |
| 4 | `google-antigravity` | Google Antigravity IDE | Win/Mac/Linux | JSON | `%USERPROFILE%\.gemini\config\mcp_config.json` | `mcpServers` |
| 5 | `gemini-cli` | Google Gemini CLI | Win/Mac/Linux | JSON | `%USERPROFILE%\.gemini\settings.json` | `mcpServers` |
| 6 | `cursor` | Cursor IDE | Win/Mac/Linux | JSON | `%USERPROFILE%\.cursor\mcp.json` | `mcpServers` |
| 7 | `vscode` | Visual Studio Code | Win/Mac/Linux | JSONC | `%APPDATA%\Code\User\settings.json` | `mcp.servers` |
| 8 | `vscode-insiders` | VS Code Insiders | Win/Mac/Linux | JSONC | `%APPDATA%\Code - Insiders\User\settings.json` | `mcp.servers` |
| 9 | `windsurf` | Windsurf Editor | Win/Mac/Linux | JSON | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | `mcpServers` |
| 10 | `cline` | Cline Extension | Win/Mac/Linux | JSON | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` | `mcpServers` |
| 11 | `roo-code` | Roo Code Extension | Win/Mac/Linux | JSON | `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json` | `mcpServers` |
| 12 | `continue` | Continue Extension | Win/Mac/Linux | JSON | `%USERPROFILE%\.continue\config.json` | `mcpServers` |
| 13 | `opencode` | OpenCode | Win/Mac/Linux | JSON | `%USERPROFILE%\.opencode\config.json` | `mcpServers` |
| 14 | `jetbrains` | JetBrains IDEs | Win/Mac/Linux | JSON | `%APPDATA%\JetBrains\mcp.json` | `mcpServers` |
| 15 | `github-copilot` | GitHub Copilot | Win/Mac | JSON | `%APPDATA%\GitHub Copilot\mcp.json` | `mcpServers` |
| 16 | `goose` | Block Goose | Win/Mac/Linux | YAML | `%USERPROFILE%\.config\goose\config.yaml` | `extensions` |
| 17 | `generic-mcp` | Generic MCP Client | Win/Mac/Linux | JSON | `mcp_config.json` | `mcpServers` |

---

## 4. آلية التوسع الديناميكي دون تعديل النواة (Dynamic Extensibility)

يمكن لأي أداة أو إضافة تابعة لجهات خارجية تسجيل عميل ذكاء اصطناعي جديد أثناء التشغيل ببساطة عبر:

```typescript
import { globalClientRegistry } from "./dist/clients/index.js";

globalClientRegistry.register({
  id: "my-assistant",
  displayName: "My Custom AI Assistant",
  description: "Proprietary internal AI client",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart Assistant",
  getConfigLocations: (p, env) => ["path/to/custom/config.json"],
  getExecutableLocations: () => ["my-assistant.exe"],
  getProcessNames: () => ["my-assistant.exe"],
  generateServerConfig: (opts) => ({ command: "node", args: [opts.serverPath] }),
  extractMadelEntry: (c) => ({ exists: Boolean(c.mcpServers?.madel) }),
  insertMadelEntry: (c, e) => ({ ...c, mcpServers: { ...(c.mcpServers || {}), madel: e } }),
  removeMadelEntry: (c) => ({ modified: true, data: c }),
});
```

يصبح العميل الجديد متاحاً فوراً لأوامر `madel clients list` و `detect` و `plan` و `connect`.
