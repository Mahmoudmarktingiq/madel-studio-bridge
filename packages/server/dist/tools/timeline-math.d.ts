/**
 * MADEL Studio Bridge — Precision Timeline Math Engine
 *
 * Provides exact integer tick calculations for Adobe Premiere Pro.
 * Premiere Pro internal timebase: 254,016,000,000 ticks per second.
 *
 * Eliminates floating point rounding drift and off-by-one frame errors.
 */
export declare const TICKS_PER_SECOND = 254016000000n;
/**
 * Standard broadcast, cinema, and web frame rates.
 */
export declare const STANDARD_FPS: readonly [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
/**
 * Returns exact BigInt ticks per frame for any standard or custom FPS.
 */
export declare function getTicksPerFrame(fps: number): bigint;
/**
 * Converts seconds to exact Premiere ticks string.
 */
export declare function secondsToTicks(seconds: number): string;
/**
 * Converts Premiere ticks string/number to seconds (floating point).
 */
export declare function ticksToSeconds(ticks: string | number | bigint): number;
/**
 * Converts frame count to exact Premiere ticks.
 */
export declare function framesToTicks(frames: number, fps?: number): string;
/**
 * Converts Premiere ticks to discrete frame index (floor).
 */
export declare function ticksToFrames(ticks: string | number | bigint, fps?: number): number;
/**
 * Converts seconds to frame count at specified FPS.
 */
export declare function secondsToFrames(seconds: number, fps?: number): number;
/**
 * Converts frame count to seconds at specified FPS.
 */
export declare function framesToSeconds(frames: number, fps?: number): number;
/**
 * Formats time as standard SMPTE timecode (HH:MM:SS:FF).
 */
export declare function secondsToTimecode(seconds: number, fps?: number, dropFrame?: boolean): string;
/**
 * Parses SMPTE timecode (HH:MM:SS:FF or HH:MM:SS;FF) to seconds.
 */
export declare function timecodeToSeconds(tc: string, fps?: number): number;
