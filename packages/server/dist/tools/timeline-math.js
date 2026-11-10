/**
 * MADEL Studio Bridge — Precision Timeline Math Engine
 *
 * Provides exact integer tick calculations for Adobe Premiere Pro.
 * Premiere Pro internal timebase: 254,016,000,000 ticks per second.
 *
 * Eliminates floating point rounding drift and off-by-one frame errors.
 */
export const TICKS_PER_SECOND = 254016000000n;
/**
 * Standard broadcast, cinema, and web frame rates.
 */
export const STANDARD_FPS = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
/**
 * Returns exact BigInt ticks per frame for any standard or custom FPS.
 */
export function getTicksPerFrame(fps) {
    if (Math.abs(fps - 23.976) < 0.01)
        return (TICKS_PER_SECOND * 1001n) / 24000n; // 10,594,584,000n
    if (Math.abs(fps - 29.97) < 0.01)
        return (TICKS_PER_SECOND * 1001n) / 30000n; // 8,475,667,200n
    if (Math.abs(fps - 59.94) < 0.01)
        return (TICKS_PER_SECOND * 1001n) / 60000n; // 4,237,833,600n
    const roundFps = BigInt(Math.max(1, Math.round(fps)));
    return TICKS_PER_SECOND / roundFps;
}
/**
 * Converts seconds to exact Premiere ticks string.
 */
export function secondsToTicks(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0)
        return "0";
    const wholeSec = BigInt(Math.floor(seconds));
    const fracSec = seconds - Math.floor(seconds);
    const fracTicks = BigInt(Math.round(fracSec * Number(TICKS_PER_SECOND)));
    const total = wholeSec * TICKS_PER_SECOND + fracTicks;
    return total.toString();
}
/**
 * Converts Premiere ticks string/number to seconds (floating point).
 */
export function ticksToSeconds(ticks) {
    const t = typeof ticks === "bigint" ? ticks : BigInt(String(ticks || "0"));
    return Number(t) / Number(TICKS_PER_SECOND);
}
/**
 * Converts frame count to exact Premiere ticks.
 */
export function framesToTicks(frames, fps = 30) {
    const f = BigInt(Math.max(0, Math.round(frames)));
    const tpf = getTicksPerFrame(fps);
    return (f * tpf).toString();
}
/**
 * Converts Premiere ticks to discrete frame index (floor).
 */
export function ticksToFrames(ticks, fps = 30) {
    const t = typeof ticks === "bigint" ? ticks : BigInt(String(ticks || "0"));
    const tpf = getTicksPerFrame(fps);
    return Number(t / tpf);
}
/**
 * Converts seconds to frame count at specified FPS.
 */
export function secondsToFrames(seconds, fps = 30) {
    const t = secondsToTicks(seconds);
    return ticksToFrames(t, fps);
}
/**
 * Converts frame count to seconds at specified FPS.
 */
export function framesToSeconds(frames, fps = 30) {
    const t = framesToTicks(frames, fps);
    return ticksToSeconds(t);
}
/**
 * Formats time as standard SMPTE timecode (HH:MM:SS:FF).
 */
export function secondsToTimecode(seconds, fps = 30, dropFrame = false) {
    const totalFrames = secondsToFrames(seconds, fps);
    const roundFps = Math.round(fps);
    const ff = totalFrames % roundFps;
    const totalSec = Math.floor(totalFrames / roundFps);
    const ss = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const mm = totalMin % 60;
    const hh = Math.floor(totalMin / 60);
    const pad = (n) => String(n).padStart(2, "0");
    const sep = dropFrame ? ";" : ":";
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}${sep}${pad(ff)}`;
}
/**
 * Parses SMPTE timecode (HH:MM:SS:FF or HH:MM:SS;FF) to seconds.
 */
export function timecodeToSeconds(tc, fps = 30) {
    if (!tc || typeof tc !== "string")
        return 0;
    const parts = tc.trim().split(/[:;]/).map(Number);
    if (parts.length < 3)
        return 0;
    const hh = parts[0] || 0;
    const mm = parts[1] || 0;
    const ss = parts[2] || 0;
    const ff = parts[3] || 0;
    const roundFps = Math.round(fps);
    const totalFrames = ((hh * 3600) + (mm * 60) + ss) * roundFps + ff;
    return framesToSeconds(totalFrames, fps);
}
//# sourceMappingURL=timeline-math.js.map