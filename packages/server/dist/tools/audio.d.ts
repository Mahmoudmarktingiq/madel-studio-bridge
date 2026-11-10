import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * The audio process lane: deterministic audio work through ffmpeg/ffprobe,
 * independent of Audition (works with every Adobe app closed). Audition's
 * scripting DOM is thin and menu-driven, so measurement, loudness
 * normalization, conversion, trimming, denoising and mixing live here.
 *
 * Every tool takes absolute paths and writes a new file — inputs are never
 * modified in place.
 */
export interface AudioToolOptions {
    ffmpegPath: string;
    ffprobePath: string;
}
export declare function runProcess(exe: string, args: string[], timeoutMs: number, signal?: AbortSignal): Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
}>;
/** Pull the JSON object loudnorm prints at the end of its stderr. */
export declare function parseLoudnormJson(stderr: string): Record<string, string>;
export interface Loudness {
    integratedLufs: number;
    truePeakDb: number;
    loudnessRange: number;
    threshold: number;
    raw: Record<string, string>;
}
export declare function toLoudness(raw: Record<string, string>): Loudness;
/** Argument builders are exported so tests can check them without running ffmpeg. */
export declare const args: {
    probe: (input: string) => string[];
    measure: (input: string, targetLufs: number, truePeak: number, lra: number) => string[];
    normalize: (input: string, output: string, targetLufs: number, truePeak: number, lra: number, m: Record<string, string>, sampleRate?: number) => string[];
    convert: (input: string, output: string, o: {
        sampleRate?: number;
        channels?: number;
        bitrate?: string;
        codec?: string;
    }) => string[];
    trim: (input: string, output: string, start: number | undefined, end: number | undefined) => string[];
    trimSilence: (input: string, output: string, thresholdDb: number, minSilence: number) => string[];
    denoise: (input: string, output: string, reductionDb: number, noiseFloorDb: number) => string[];
    mix: (inputs: string[], output: string, volumes: number[] | undefined) => string[];
    waveform: (input: string, output: string, width: number, height: number, color: string) => string[];
};
interface ProbeStream {
    codec_type?: string;
    codec_name?: string;
    sample_rate?: string;
    channels?: number;
    channel_layout?: string;
    bit_rate?: string;
    width?: number;
    height?: number;
    duration?: string;
}
interface ProbeOutput {
    format?: {
        format_name?: string;
        duration?: string;
        size?: string;
        bit_rate?: string;
    };
    streams?: ProbeStream[];
}
export declare function summarizeProbe(p: ProbeOutput): {
    format: string | null;
    durationSeconds: number | null;
    sizeBytes: number | null;
    bitRate: number | null;
    audio: {
        codec: string | null;
        sampleRate: number | null;
        channels: number | null;
        channelLayout: string | null;
        bitRate: number | null;
    } | null;
    audioStreams: number;
    videoStreams: number;
    video: {
        codec: string | null;
        width: number | null;
        height: number | null;
    } | null;
};
/** The input's audio sample rate via ffprobe; 48000 when it cannot be read. */
export declare function sourceSampleRate(options: AudioToolOptions, input: string, signal?: AbortSignal): Promise<number>;
export interface LoudnessTargets {
    targetLufs: number;
    truePeakDb: number;
    loudnessRange: number;
}
/** Measure a file's loudness (first loudnorm pass). Shared by the tool and the pipelines. */
export declare function measureLoudness(options: AudioToolOptions, input: string, signal?: AbortSignal): Promise<Loudness>;
/** Two-pass EBU R128 normalization to a new file. Shared by the tool and the pipelines. */
export declare function normalizeLoudness(options: AudioToolOptions, input: string, output: string, t: LoudnessTargets, signal?: AbortSignal): Promise<{
    target: {
        integratedLufs: number;
        truePeakDb: number;
        loudnessRange: number;
    };
    before: Loudness;
    after: {
        integratedLufs: number;
        truePeakDb: number;
        loudnessRange: number;
    };
    output: string;
    sizeBytes: number;
}>;
/** Denoise to a new file. Shared by the tool and the pipelines. */
export declare function denoise(options: AudioToolOptions, input: string, output: string, reductionDb: number, noiseFloorDb: number, signal?: AbortSignal): Promise<{
    output: string;
    sizeBytes: number;
}>;
export declare function registerAudioTools(server: McpServer, options: AudioToolOptions): void;
export {};
