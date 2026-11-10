/**
 * The handshake file solves two problems at once for the in-app panels:
 * discovering which port the bridge bound, and learning the per-install token
 * they must present. The server writes it once it is listening; each panel
 * reads it (CEP via Node `fs`, UXP via `localFileSystem: "fullAccess"`) before
 * dialing out.
 *
 * It is written mode-600 under the user's home directory. It carries a live
 * secret, so it must never be world-readable and is removed on clean shutdown.
 */
export interface Handshake {
    /** Wire protocol the server speaks; panels refuse a mismatch. */
    protocolVersion: number;
    /** Loopback port the bridge is listening on. */
    port: number;
    /** Shared secret the panel must present, or "" when auth is disabled. */
    token: string;
    /** Server process id, so a panel can detect a stale file. */
    pid: number;
}
/** Default location of the handshake file. */
export declare function defaultHandshakePath(): string;
/**
 * Writes the handshake file mode-600, creating its directory if needed.
 *
 * The default write flag ("w") follows symlinks and applies its mode only when
 * creating a new file — so a pre-existing (or symlinked) file could see the
 * token written through it with looser permissions. Remove any existing entry
 * first and create exclusively ("wx", i.e. O_CREAT|O_EXCL, which refuses to
 * follow an existing symlink) so the secret always lands in a fresh 600 file.
 */
export declare function writeHandshake(path: string, handshake: Handshake): void;
/** The handshake currently on disk, or null when it is missing or unreadable. */
export declare function readHandshake(path: string): Handshake | null;
/** Whether a process id is running. `signal 0` only checks; EPERM means it exists but is not ours. */
export declare function pidAlive(pid: number, kill?: (pid: number, signal: number) => void): boolean;
/**
 * Removes the handshake file — but only when it is still ours. A second server
 * instance (another editor session, a stray `npm start`) overwrites the file with
 * its own port and token; when that one exits it must not delete the entry the
 * still-running first server put there, or every panel reload would find nothing.
 */
export declare function removeHandshake(path: string, ownPid?: number): void;
