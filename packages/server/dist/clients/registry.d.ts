/**
 * MADEL Studio Bridge — Declarative AI Client Registry
 * Developed & Maintained by Mahmoud Adel
 * Universal ClientDefinition specifications for 17+ AI and coding clients
 */
import { type ClientDefinition } from "./types.js";
export declare const claudeCodeDefinition: ClientDefinition;
export declare const claudeDesktopDefinition: ClientDefinition;
export declare const openaiCodexDefinition: ClientDefinition;
export declare const googleAntigravityDefinition: ClientDefinition;
export declare const geminiCliDefinition: ClientDefinition;
export declare const cursorDefinition: ClientDefinition;
export declare const vsCodeDefinition: ClientDefinition;
export declare const vsCodeInsidersDefinition: ClientDefinition;
export declare const windsurfDefinition: ClientDefinition;
export declare const clineDefinition: ClientDefinition;
export declare const rooCodeDefinition: ClientDefinition;
export declare const continueDefinition: ClientDefinition;
export declare const openCodeDefinition: ClientDefinition;
export declare const jetbrainsDefinition: ClientDefinition;
export declare const githubCopilotDefinition: ClientDefinition;
export declare const gooseDefinition: ClientDefinition;
export declare const genericMcpDefinition: ClientDefinition;
export declare class ClientRegistry {
    private readonly definitions;
    constructor();
    register(definition: ClientDefinition): void;
    get(clientId: string): ClientDefinition | undefined;
    getAll(): ClientDefinition[];
    has(clientId: string): boolean;
}
export declare const globalClientRegistry: ClientRegistry;
