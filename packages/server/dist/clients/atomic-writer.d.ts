/**
 * MADEL Studio Bridge — High-Assurance Atomic Configuration Writer
 * Developed & Maintained by Mahmoud Adel
 * Implements 9-step atomic write, SHA-256 integrity, Windows lock retry, and automatic rollback
 */
import { ConfigFormat } from "./types.js";
export interface AtomicWriteOptions {
    filePath: string;
    newContent: string;
    format: ConfigFormat;
    createBackup?: boolean;
    maxLockRetries?: number;
    retryDelayMs?: number;
}
export interface AtomicWriteResult {
    success: boolean;
    filePath: string;
    originalHash?: string;
    newHash: string;
    backupPath?: string;
    bytesWritten: number;
    error?: string;
}
/**
 * Executes a 9-step high-assurance atomic write with automatic rollback.
 */
export declare function atomicWriteConfigFile(options: AtomicWriteOptions): AtomicWriteResult;
/**
 * Restores a configuration file from a specified backup or the latest backup found.
 */
export declare function restoreConfigFile(filePath: string, customBackupPath?: string): {
    success: boolean;
    restoredPath: string;
    error?: string;
};
