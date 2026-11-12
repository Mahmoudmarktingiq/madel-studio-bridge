/**
 * MADEL Studio Bridge — Chrome DevTools Protocol (CDP) WebSocket Client
 * Developed and maintained by Mahmoud Adel
 *
 * Direct, lightweight, and resilient CDP client leveraging Node's native WebSocket (`ws`).
 * Manages two-way event and method RPC multiplexing with the browser page target.
 */
export interface ConsoleLogEntry {
    type: string;
    text: string;
    url?: string;
    lineNumber?: number;
    timestamp: string;
}
export interface FailedNetworkEntry {
    url: string;
    method?: string;
    status?: number;
    errorText?: string;
    timestamp: string;
}
export interface CdpResponse<T = unknown> {
    id: number;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: string;
    };
}
export declare class CDPClient {
    readonly wsUrl: string;
    private ws;
    private messageId;
    private isClosing;
    private readonly pendingRequests;
    private readonly eventListeners;
    readonly consoleLogs: ConsoleLogEntry[];
    readonly failedRequests: FailedNetworkEntry[];
    private readonly pendingNetworkMap;
    constructor(wsUrl: string);
    /**
     * Connects to the CDP target WebSocket URL.
     */
    connect(timeoutMs?: number): Promise<void>;
    /**
     * Initializes base CDP domains and attaches event listeners.
     */
    private initializeBaseDomains;
    private recordConsoleLog;
    private recordFailedNetwork;
    /**
     * Sends a typed JSON-RPC message over CDP and waits for the correlated reply.
     */
    send<T = any>(method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<T>;
    /**
     * Registers a callback for an incoming CDP event.
     */
    on(event: string, callback: (params: any) => void): () => void;
    /**
     * Waits for a specific event once with a timeout.
     */
    once(event: string, timeoutMs?: number): Promise<any>;
    private handleIncomingMessage;
    private cleanupPending;
    /**
     * Closes the WebSocket connection gracefully.
     */
    close(): void;
    navigate(url: string, waitUntil?: "load" | "domcontentloaded" | "networkidle"): Promise<{
        url: string;
        title: string;
    }>;
    reload(ignoreCache?: boolean): Promise<boolean>;
    getNavigationHistory(): Promise<{
        currentIndex: number;
        entries: any[];
    }>;
    goBack(): Promise<{
        url: string;
        title: string;
    }>;
    goForward(): Promise<{
        url: string;
        title: string;
    }>;
    getCurrentUrl(): Promise<string>;
    getPageTitle(): Promise<string>;
    readVisibleText(selector?: string, maxLength?: number): Promise<{
        text: string;
        truncated: boolean;
        textLength: number;
    }>;
    inspectDomElements(selector: string, limit?: number): Promise<any[]>;
    findElements(query: string, by?: "selector" | "text" | "role"): Promise<any[]>;
    getPageMetadata(): Promise<Record<string, unknown>>;
    inspectLinks(limit?: number): Promise<any[]>;
    getScreenshot(options?: {
        format?: "png" | "jpeg";
        quality?: number;
        fullPage?: boolean;
    }): Promise<{
        dataBase64: string;
        format: string;
    }>;
    clickElement(selector: string, button?: "left" | "right" | "middle", clickCount?: number): Promise<{
        x: number;
        y: number;
    }>;
    fillInput(selector: string, value: string, clearFirst?: boolean): Promise<{
        length: number;
    }>;
    selectOption(selector: string, option: {
        value?: string;
        label?: string;
        index?: number;
    }): Promise<{
        selectedValue: string;
        selectedLabel: string;
    }>;
    scrollPage(options: {
        direction?: "down" | "up" | "toTop" | "toBottom";
        deltaY?: number;
        deltaX?: number;
    }): Promise<{
        scrollX: number;
        scrollY: number;
    }>;
    waitForElement(selector: string, timeoutMs?: number, state?: "visible" | "attached"): Promise<{
        found: boolean;
        elapsedMs: number;
    }>;
    uploadLocalFile(selector: string, filePaths: string[]): Promise<{
        uploadedCount: number;
        fileNames: string[];
    }>;
    getPerformanceMetrics(): Promise<Record<string, number>>;
    getAccessibilitySnapshot(maxDepth?: number): Promise<any>;
    /**
     * Resolves a target (selector string or explicit {x, y} coordinate) to absolute page coordinates.
     */
    resolveTargetCoords(target: string | {
        x: number;
        y: number;
    }): Promise<{
        x: number;
        y: number;
    }>;
    mouseMove(x: number, y: number, buttons?: number, modifiers?: number): Promise<void>;
    mouseDown(x: number, y: number, button?: "left" | "right" | "middle", clickCount?: number, modifiers?: number): Promise<void>;
    mouseUp(x: number, y: number, button?: "left" | "right" | "middle", clickCount?: number, modifiers?: number): Promise<void>;
    mouseClick(target: string | {
        x: number;
        y: number;
    }, button?: "left" | "right" | "middle", clickCount?: number, modifiers?: number): Promise<{
        x: number;
        y: number;
        button: string;
        clickCount: number;
    }>;
    doubleClick(target: string | {
        x: number;
        y: number;
    }): Promise<{
        x: number;
        y: number;
    }>;
    rightClick(target: string | {
        x: number;
        y: number;
    }): Promise<{
        x: number;
        y: number;
    }>;
    hover(target: string | {
        x: number;
        y: number;
    }): Promise<{
        x: number;
        y: number;
    }>;
    dragAndDrop(from: string | {
        x: number;
        y: number;
    }, to: string | {
        x: number;
        y: number;
    }, steps?: number): Promise<{
        from: {
            x: number;
            y: number;
        };
        to: {
            x: number;
            y: number;
        };
    }>;
    scrollElementIntoView(selector: string): Promise<boolean>;
    private static readonly KEY_DEFINITIONS;
    pressKey(key: string, modifiers?: string[]): Promise<boolean>;
    keyCombination(keys: string[]): Promise<boolean>;
    typeText(text: string, options?: {
        selector?: string;
        delayMs?: number;
        clearFirst?: boolean;
    }): Promise<{
        textLength: number;
    }>;
    setDownloadBehavior(downloadPath: string, behavior?: "allow" | "deny" | "default"): Promise<void>;
    createTarget(url?: string): Promise<{
        targetId: string;
    }>;
    closeTarget(targetId: string): Promise<boolean>;
    getTargets(): Promise<Array<{
        targetId: string;
        type: string;
        title: string;
        url: string;
        attached: boolean;
    }>>;
    activateTarget(targetId: string): Promise<boolean>;
}
