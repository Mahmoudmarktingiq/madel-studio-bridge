/**
 * MADEL Studio Bridge — Microsoft Office Discovery Module
 * Developed and maintained by Mahmoud Adel
 *
 * Discovers and inspects installed Microsoft Office applications (Word, Excel, PowerPoint)
 * via Windows Registry, filesystem paths, and COM ProgIDs without side-effects.
 */
import type { OfficeAppId, OfficeAppMetadata } from "./types.js";
export declare class OfficeDiscovery {
    private static cachedMetadata;
    private static lastCheckTime;
    private static readonly CACHE_TTL_MS;
    static discoverAll(forceRefresh?: boolean): Promise<Record<OfficeAppId, OfficeAppMetadata>>;
    static discoverApp(appId: OfficeAppId): Promise<OfficeAppMetadata>;
    private static inspectApp;
}
