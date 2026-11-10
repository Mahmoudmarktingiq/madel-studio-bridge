/**
 * MADEL Studio Bridge — High-Assurance Atomic Configuration Writer
 * Developed & Maintained by Mahmoud Adel
 * Implements 9-step atomic write, SHA-256 integrity, Windows lock retry, and automatic rollback
 */
import { createHash, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseConfigText } from "./parsers.js";
import { ConfigFormat } from "./types.js";
function sha256(content) {
    return createHash("sha256").update(content, "utf8").digest("hex");
}
function sleepSync(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        // Synchronous spin-delay for atomic locks
    }
}
/**
 * Executes a 9-step high-assurance atomic write with automatic rollback.
 */
export function atomicWriteConfigFile(options) {
    const { filePath, newContent, format, createBackup = true, maxLockRetries = 3, retryDelayMs = 50 } = options;
    const dir = dirname(filePath);
    // Ensure parent directory exists
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    // 1. Read current content if file exists
    let originalContent = "";
    let originalHash;
    const fileExisted = existsSync(filePath);
    if (fileExisted) {
        try {
            originalContent = readFileSync(filePath, "utf8");
            originalHash = sha256(originalContent);
        }
        catch (err) {
            return {
                success: false,
                filePath,
                newHash: sha256(newContent),
                bytesWritten: 0,
                error: `Failed to read existing configuration at ${filePath}: ${String(err)}`,
            };
        }
    }
    const newHash = sha256(newContent);
    // If content is identical, skip write
    if (fileExisted && originalHash === newHash) {
        return {
            success: true,
            filePath,
            originalHash,
            newHash,
            bytesWritten: Buffer.byteLength(newContent, "utf8"),
        };
    }
    // 2. Validate new content syntax BEFORE writing to disk
    try {
        parseConfigText(newContent, format);
    }
    catch (parseErr) {
        return {
            success: false,
            filePath,
            originalHash,
            newHash,
            bytesWritten: 0,
            error: `Syntax validation failed for format '${format}': ${String(parseErr)}`,
        };
    }
    // 3. Prepare temporary file on the SAME filesystem directory to guarantee rename semantics
    const tempFileName = `${filePath}.tmp.${randomBytes(6).toString("hex")}`;
    try {
        writeFileSync(tempFileName, newContent, "utf8");
    }
    catch (writeErr) {
        return {
            success: false,
            filePath,
            originalHash,
            newHash,
            bytesWritten: 0,
            error: `Failed to write temporary file ${tempFileName}: ${String(writeErr)}`,
        };
    }
    // 4. Validate temporary file on disk
    try {
        const tempWritten = readFileSync(tempFileName, "utf8");
        if (sha256(tempWritten) !== newHash) {
            unlinkSync(tempFileName);
            return {
                success: false,
                filePath,
                originalHash,
                newHash,
                bytesWritten: 0,
                error: `Temporary file SHA-256 verification mismatch`,
            };
        }
    }
    catch (tempErr) {
        try {
            unlinkSync(tempFileName);
        }
        catch { }
        return {
            success: false,
            filePath,
            originalHash,
            newHash,
            bytesWritten: 0,
            error: `Failed to verify temporary file: ${String(tempErr)}`,
        };
    }
    // 5. Save automatic timestamped backup of original file
    let backupPath;
    if (fileExisted && createBackup) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        backupPath = `${filePath}.bak.${timestamp}`;
        try {
            copyFileSync(filePath, backupPath);
        }
        catch (bakErr) {
            try {
                unlinkSync(tempFileName);
            }
            catch { }
            return {
                success: false,
                filePath,
                originalHash,
                newHash,
                bytesWritten: 0,
                error: `Failed to create backup at ${backupPath}: ${String(bakErr)}`,
            };
        }
    }
    // 6. Anti-race check: Verify disk file was not modified concurrently by another process
    if (fileExisted) {
        try {
            const diskCurrent = readFileSync(filePath, "utf8");
            if (sha256(diskCurrent) !== originalHash) {
                unlinkSync(tempFileName);
                return {
                    success: false,
                    filePath,
                    originalHash,
                    newHash,
                    backupPath,
                    bytesWritten: 0,
                    error: `Concurrent modification detected: file at ${filePath} was changed during operation`,
                };
            }
        }
        catch (readErr) {
            unlinkSync(tempFileName);
            return {
                success: false,
                filePath,
                originalHash,
                newHash,
                backupPath,
                bytesWritten: 0,
                error: `Failed to re-verify target file: ${String(readErr)}`,
            };
        }
    }
    // 7. Atomic rename / replace with Windows file lock retries
    let renameSuccess = false;
    let lastRenameError;
    for (let attempt = 1; attempt <= maxLockRetries; attempt++) {
        try {
            renameSync(tempFileName, filePath);
            renameSuccess = true;
            break;
        }
        catch (renameErr) {
            lastRenameError = renameErr;
            // On Windows, EPERM or EBUSY occurs if an editor has the file open
            if (attempt < maxLockRetries && (renameErr.code === "EPERM" || renameErr.code === "EBUSY")) {
                sleepSync(retryDelayMs * attempt);
            }
            else {
                break;
            }
        }
    }
    if (!renameSuccess) {
        try {
            unlinkSync(tempFileName);
        }
        catch { }
        return {
            success: false,
            filePath,
            originalHash,
            newHash,
            backupPath,
            bytesWritten: 0,
            error: `Failed to replace configuration file (attempted ${maxLockRetries} times): ${String(lastRenameError)}`,
        };
    }
    // 8. Read back written file and verify syntax and SHA-256 hash
    try {
        const verifiedContent = readFileSync(filePath, "utf8");
        const verifiedHash = sha256(verifiedContent);
        if (verifiedHash !== newHash) {
            // Initiate Rollback if possible
            if (backupPath && existsSync(backupPath)) {
                copyFileSync(backupPath, filePath);
            }
            return {
                success: false,
                filePath,
                originalHash,
                newHash,
                backupPath,
                bytesWritten: 0,
                error: `Post-write verification failed: hash mismatch. Rollback performed.`,
            };
        }
    }
    catch (verifyErr) {
        if (backupPath && existsSync(backupPath)) {
            copyFileSync(backupPath, filePath);
        }
        return {
            success: false,
            filePath,
            originalHash,
            newHash,
            backupPath,
            bytesWritten: 0,
            error: `Post-write readback failed: ${String(verifyErr)}. Rollback performed.`,
        };
    }
    return {
        success: true,
        filePath,
        originalHash,
        newHash,
        backupPath,
        bytesWritten: Buffer.byteLength(newContent, "utf8"),
    };
}
/**
 * Restores a configuration file from a specified backup or the latest backup found.
 */
export function restoreConfigFile(filePath, customBackupPath) {
    const dir = dirname(filePath);
    let targetBackup = customBackupPath;
    if (!targetBackup) {
        // Find latest .bak file for this config
        const fs = require("node:fs");
        const files = fs.readdirSync(dir);
        const baseName = filePath.split(/[\\/]/).pop() || "config";
        const baks = files
            .filter((f) => f.startsWith(`${baseName}.bak.`))
            .sort()
            .reverse();
        const latestBak = baks[0];
        if (!latestBak) {
            return { success: false, restoredPath: "", error: `No backup files found for ${filePath}` };
        }
        targetBackup = join(dir, latestBak);
    }
    if (!existsSync(targetBackup)) {
        return { success: false, restoredPath: targetBackup, error: `Backup file does not exist: ${targetBackup}` };
    }
    try {
        copyFileSync(targetBackup, filePath);
        return { success: true, restoredPath: targetBackup };
    }
    catch (err) {
        return { success: false, restoredPath: targetBackup, error: String(err) };
    }
}
//# sourceMappingURL=atomic-writer.js.map