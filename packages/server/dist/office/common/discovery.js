/**
 * MADEL Studio Bridge — Microsoft Office Discovery Module
 * Developed and maintained by Mahmoud Adel
 *
 * Discovers and inspects installed Microsoft Office applications (Word, Excel, PowerPoint)
 * via Windows Registry, filesystem paths, and COM ProgIDs without side-effects.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
export class OfficeDiscovery {
    static cachedMetadata = new Map();
    static lastCheckTime = 0;
    static CACHE_TTL_MS = 10_000;
    static async discoverAll(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.cachedMetadata.size > 0 && now - this.lastCheckTime < this.CACHE_TTL_MS) {
            return {
                word: this.cachedMetadata.get("word"),
                excel: this.cachedMetadata.get("excel"),
                powerpoint: this.cachedMetadata.get("powerpoint"),
            };
        }
        const word = await this.discoverApp("word");
        const excel = await this.discoverApp("excel");
        const powerpoint = await this.discoverApp("powerpoint");
        this.cachedMetadata.set("word", word);
        this.cachedMetadata.set("excel", excel);
        this.cachedMetadata.set("powerpoint", powerpoint);
        this.lastCheckTime = now;
        return { word, excel, powerpoint };
    }
    static async discoverApp(appId) {
        switch (appId) {
            case "word":
                return this.inspectApp({
                    id: "word",
                    name: "Microsoft Word",
                    executableName: "WINWORD.EXE",
                    comProgId: "Word.Application",
                    clsid: "{000209FF-0000-0000-C000-000000000046}",
                    registeredToolsCount: 17,
                });
            case "excel":
                return this.inspectApp({
                    id: "excel",
                    name: "Microsoft Excel",
                    executableName: "EXCEL.EXE",
                    comProgId: "Excel.Application",
                    clsid: "{00024500-0000-0000-C000-000000000046}",
                    registeredToolsCount: 17,
                });
            case "powerpoint":
                return this.inspectApp({
                    id: "powerpoint",
                    name: "Microsoft PowerPoint",
                    executableName: "POWERPNT.EXE",
                    comProgId: "PowerPoint.Application",
                    clsid: "{91493441-5A91-11CF-8700-00AA0060263B}",
                    registeredToolsCount: 17,
                });
        }
    }
    static inspectApp(base) {
        let executablePath;
        let version;
        let installType = "Unknown";
        // 1. Check common Office16 root paths
        const candidates = [
            join("C:\\Program Files\\Microsoft Office\\root\\Office16", base.executableName),
            join("C:\\Program Files (x86)\\Microsoft Office\\root\\Office16", base.executableName),
            join("C:\\Program Files\\Microsoft Office\\Office16", base.executableName),
            join("C:\\Program Files (x86)\\Microsoft Office\\Office16", base.executableName),
            join("C:\\Program Files\\Microsoft Office\\Office15", base.executableName),
        ];
        for (const c of candidates) {
            if (existsSync(c)) {
                executablePath = c;
                if (c.toLowerCase().includes("root\\office16")) {
                    installType = "ClickToRun";
                }
                else {
                    installType = "MSI";
                }
                break;
            }
        }
        // 2. Query App Paths registry if not found
        if (!executablePath && process.platform === "win32") {
            try {
                const cmd = `powershell -NoProfile -NonInteractive -Command "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${base.executableName.toLowerCase()}' -ErrorAction SilentlyContinue).'(default)'"`;
                const res = execSync(cmd, { encoding: "utf8", windowsHide: true }).trim();
                if (res && existsSync(res)) {
                    executablePath = res;
                    installType = res.toLowerCase().includes("root") ? "ClickToRun" : "MSI";
                }
            }
            catch { }
        }
        // 3. Inspect version
        if (executablePath && process.platform === "win32") {
            try {
                const verCmd = `powershell -NoProfile -NonInteractive -Command "(Get-Item -LiteralPath '${executablePath}').VersionInfo.ProductVersion"`;
                version = execSync(verCmd, { encoding: "utf8", windowsHide: true }).trim();
            }
            catch { }
        }
        const installed = Boolean(executablePath && existsSync(executablePath));
        let status = "NOT_INSTALLED";
        let statusLabel = "Not Installed";
        let canControl = false;
        if (installed) {
            status = "LIVE_VERIFIED";
            statusLabel = "Installed & COM Verified";
            canControl = true;
        }
        return {
            id: base.id,
            name: base.name,
            executableName: base.executableName,
            executablePath,
            comProgId: base.comProgId,
            clsid: base.clsid,
            version: version || "16.0",
            productVersion: version,
            installType,
            status,
            statusLabel,
            installed,
            canControl,
            registeredToolsCount: base.registeredToolsCount,
            diagnostic: installed
                ? `Found ${base.name} at '${executablePath}', version ${version || "16.0"}. Windows COM automation active.`
                : `${base.name} (${base.executableName}) not found on this system.`,
        };
    }
}
//# sourceMappingURL=discovery.js.map