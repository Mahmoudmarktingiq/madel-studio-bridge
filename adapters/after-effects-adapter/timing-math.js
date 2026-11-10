/**
 * MADEL Studio Bridge — After Effects Timing & Keyframe Math
 * Developed and maintained by Mahmoud Adel
 *
 * Implements frame-accurate conversions, SMPTE timecode calculation,
 * and keyframe timeline interpolation for motion graphics compositions.
 */

export const STANDARD_AE_FPS = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];

/**
 * Converts seconds to whole integer frame index.
 */
export function secondsToFrames(seconds, fps = 30) {
  if (typeof seconds !== "number" || isNaN(seconds)) return 0;
  return Math.round(seconds * fps);
}

/**
 * Converts integer frame index to exact seconds.
 */
export function framesToSeconds(frames, fps = 30) {
  if (typeof frames !== "number" || isNaN(frames) || fps <= 0) return 0;
  return frames / fps;
}

/**
 * Formats time in seconds to SMPTE timecode (HH:MM:SS:FF or HH:MM:SS;FF).
 */
export function secondsToTimecode(seconds, fps = 30, dropFrame = false) {
  if (typeof seconds !== "number" || isNaN(seconds)) return "00:00:00:00";

  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const roundedFps = Math.round(fps);

  const ff = totalFrames % roundedFps;
  const totalSeconds = Math.floor(totalFrames / roundedFps);
  const ss = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mm = totalMinutes % 60;
  const hh = Math.floor(totalMinutes / 60);

  const pad = (n) => String(n).padStart(2, "0");
  const sep = dropFrame ? ";" : ":";

  return `${pad(hh)}:${pad(mm)}:${pad(ss)}${sep}${pad(ff)}`;
}

/**
 * Parses SMPTE timecode string back into seconds.
 */
export function timecodeToSeconds(timecode, fps = 30) {
  if (typeof timecode !== "string") return 0;
  const parts = timecode.trim().split(/[:;]/).map(Number);
  if (parts.length < 4 || parts.some(isNaN)) return 0;

  const [hh, mm, ss, ff] = parts;
  const totalFrames = (hh * 3600 + mm * 60 + ss) * Math.round(fps) + ff;
  return totalFrames / fps;
}

/**
 * Calculates 2D / 3D transform coordinates relative to composition bounds.
 */
export function computeCompCoordinates(compWidth, compHeight, normalizedX = 0.5, normalizedY = 0.5, z = 0) {
  const x = Math.round(compWidth * normalizedX);
  const y = Math.round(compHeight * normalizedY);
  return z !== 0 ? [x, y, z] : [x, y];
}

/**
 * Validates and snaps keyframe timestamps to frame boundaries.
 */
export function snapKeyframeToFrame(timeInSeconds, fps = 30) {
  const frame = Math.round(timeInSeconds * fps);
  return frame / fps;
}
