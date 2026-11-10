# MADEL Studio Bridge — Phase P25 Uninstallation & Rollback
## Uninstallation Safety Policy & Zero-Leak Cleanup Verification
**Platform Version:** v0.11.0  
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)

---

## 1. Safety & Preservation Policy

A fundamental tenet of the MADEL Studio Bridge installer is **Strict Non-Interference with User Creative Work and External Configuration Files**.

### Explicit Preservation List:
Under NO circumstances does the uninstaller modify, truncate, or delete:
1. **User Creative Directories:** Any path in `D:\MCP\`, including:
   - `D:\MCP\01-Projects\`
   - `D:\MCP\10-Video-Projects\`
   - `D:\MCP\11-Other-Apps\`
2. **AI Client Configuration Files:**
   - Claude Code CLI (`%USERPROFILE%\.claude.json`)
   - OpenAI Codex (`%USERPROFILE%\.codex\config.toml`)
   - Google Antigravity IDE (`%USERPROFILE%\.gemini\antigravity`)
   - Cursor / Windsurf settings.
3. **Atomic Config Backups:**
   - `%USERPROFILE%\.brainferno-mcp-bridge\backups\` (Kept so users can restore prior states).

---

## 2. Uninstallation Procedure

Uninstallation can be triggered through standard Windows mechanisms:
1. **Windows Settings:** `Settings > Apps > Installed apps > MADEL Studio Bridge > Uninstall`
2. **Control Panel:** `Programs and Features > MADEL Studio Bridge > Uninstall`
3. **Direct Executable:** `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\uninstall.exe`
4. **Silent Uninstallation:**
   ```powershell
   & "$env:LOCALAPPDATA\Programs\MADEL Studio Bridge\uninstall.exe" /S
   ```

---

## 3. Removal Verification & Zero-Leak Checklist

| Target Item | Path | Action | Status |
|---|---|---|---|
| **Binary Executable** | `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\madel-desktop.exe` | Deleted | **VERIFIED REMOVED** |
| **Bundled Backend** | `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\resources\` | Deleted | **VERIFIED REMOVED** |
| **Install Directory** | `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\` | Cleaned & Removed | **VERIFIED REMOVED** |
| **Start Menu Shortcut**| `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MADEL Studio Bridge.lnk` | Deleted | **VERIFIED REMOVED** |
| **Registry Entry** | `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\MADEL Studio Bridge` | Removed | **VERIFIED REMOVED** |
| **Creative Files** | `D:\MCP\**` | **UNTOUCHED** | **PRESERVED 100%** |
| **AI Client Configs** | `~/.claude.json`, `~/.codex/`, `~/.gemini/` | **UNTOUCHED** | **PRESERVED 100%** |

---

## 4. Upgrade & Rollback Behavior

- **In-Place Upgrade:** Running a newer version installer (e.g. `v0.12.0`) over an existing installation replaces the binary and bundled resources without resetting localStorage or requiring a full re-install.
- **Rollback:** In the event of a rollback, running the `v0.11.0` installer cleanly overwrites the binaries while maintaining user preferences.
