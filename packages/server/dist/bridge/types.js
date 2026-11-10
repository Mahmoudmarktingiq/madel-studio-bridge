/** Raised when no host is reachable for the requested application. */
export class AppNotConnectedError extends Error {
    appId;
    constructor(appId, hint) {
        super(`No running host connected for "${appId}". ${hint}`);
        this.appId = appId;
        this.name = "AppNotConnectedError";
    }
}
/**
 * The os-script lane's runner (PowerShell/COM, osascript) failed AFTER the script may have
 * reached the host: anything but a failure that provably happened before dispatch (runner
 * missing, COM class not registered, app not running / not found / Automation refused).
 *
 * It extends AppNotConnectedError on purpose: guard() and the typed ai_* tools keep treating
 * it exactly as before, with the same message. Raw-script tools check `dispatched` and answer
 * with the "the script was sent; it may have partly run" envelope instead of plain text.
 */
export class RunnerExitedError extends AppNotConnectedError {
    runnerOutput;
    dispatched = true;
    constructor(appId, hint, 
    /** What the runner said (its first stderr line, or "exit <code>"), without the hint. */
    runnerOutput) {
        super(appId, hint);
        this.runnerOutput = runnerOutput;
        this.name = "RunnerExitedError";
    }
}
/** Raised when a panel disconnected while a command was in flight. */
export class AppDisconnectedError extends Error {
    appId;
    constructor(appId, reason) {
        super(`The "${appId}" panel disconnected before the command completed (${reason}).`);
        this.appId = appId;
        this.name = "AppDisconnectedError";
    }
}
/** Raised when the host received the command but the script itself threw. */
export class ScriptError extends Error {
    appId;
    scriptLine;
    details;
    constructor(appId, message, scriptLine, details = {}) {
        super(message);
        this.appId = appId;
        this.scriptLine = scriptLine;
        this.name = "ScriptError";
        this.details = details;
    }
    /** The failing body line, or null (not enriched, or the line is not in the tool's body). */
    get bodyLine() {
        return this.details.bodyLine ?? null;
    }
    /** A copy with `more` merged into `details`; appId, message, scriptLine and stack are kept. */
    withDetails(more) {
        const copy = new ScriptError(this.appId, this.message, this.scriptLine, { ...this.details, ...more });
        copy.stack = this.stack;
        return copy;
    }
}
/** Raised when the host never answered within the timeout. */
export class EvalTimeoutError extends Error {
    timeoutMs;
    constructor(appId, 
    /** The deadline that expired, in ms. */
    timeoutMs) {
        super(`"${appId}" did not return a result within ${timeoutMs}ms. ` +
            `A modal dialog open in the application will block scripting until dismissed.`);
        this.timeoutMs = timeoutMs;
        this.name = "EvalTimeoutError";
    }
}
//# sourceMappingURL=types.js.map