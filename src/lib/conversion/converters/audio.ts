import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { ConverterHandler, ConversionResult, ConversionOptions } from "@/lib/types/converter";

const execFileAsync = promisify(execFile);
const MAX_2GB = 2147483648;

async function runFfmpegAudio(
  inputPath: string,
  outputPath: string,
  codec: string,
  bitrate: string = "192k",
  timeoutMs: number = 300000
): Promise<{ success: boolean; error?: string }> {
  try {
    const args = ["-y", "-i", inputPath, "-c:a", codec, "-b:a", bitrate, outputPath];
    await execFileAsync("ffmpeg", args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 50 });
    return { success: true };
  } catch (err: any) {
    console.error("FFmpeg Audio error:", err);
    return { success: false, error: "Audio conversion failed. Unsupported codec or corrupted audio file." };
  }
}

export const wavToMp3Converter: ConverterHandler = {
  id: "wav-to-mp3",
  name: "WAV to MP3",
  category: "audio",
  inputMimeTypes: ["audio/wav", "audio/x-wav"],
  inputExtensions: [".wav"],
  outputFormat: "mp3",
  outputMimeType: "audio/mpeg",
  outputExtension: ".mp3",
  maxSizeBytes: MAX_2GB,
  resourceClass: "medium",
  timeoutMs: 300000,
  async convert(inputPath, outputPath, options): Promise<ConversionResult> {
    const bitrate = options?.audioBitrate || "320k";
    const res = await runFfmpegAudio(inputPath, outputPath, "libmp3lame", bitrate);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "audio/mpeg" };
  },
};

export const mp3ToWavConverter: ConverterHandler = {
  id: "mp3-to-wav",
  name: "MP3 to WAV",
  category: "audio",
  inputMimeTypes: ["audio/mpeg", "audio/mp3"],
  inputExtensions: [".mp3"],
  outputFormat: "wav",
  outputMimeType: "audio/wav",
  outputExtension: ".wav",
  maxSizeBytes: MAX_2GB,
  resourceClass: "medium",
  timeoutMs: 300000,
  async convert(inputPath, outputPath): Promise<ConversionResult> {
    const res = await runFfmpegAudio(inputPath, outputPath, "pcm_s16le", "1411k");
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "audio/wav" };
  },
};

export const flacToMp3Converter: ConverterHandler = {
  id: "flac-to-mp3",
  name: "FLAC to MP3",
  category: "audio",
  inputMimeTypes: ["audio/flac", "audio/x-flac"],
  inputExtensions: [".flac"],
  outputFormat: "mp3",
  outputMimeType: "audio/mpeg",
  outputExtension: ".mp3",
  maxSizeBytes: MAX_2GB,
  resourceClass: "medium",
  timeoutMs: 300000,
  async convert(inputPath, outputPath, options): Promise<ConversionResult> {
    const bitrate = options?.audioBitrate || "320k";
    const res = await runFfmpegAudio(inputPath, outputPath, "libmp3lame", bitrate);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "audio/mpeg" };
  },
};

export const m4aToMp3Converter: ConverterHandler = {
  id: "m4a-to-mp3",
  name: "M4A to MP3",
  category: "audio",
  inputMimeTypes: ["audio/m4a", "audio/x-m4a", "audio/mp4"],
  inputExtensions: [".m4a"],
  outputFormat: "mp3",
  outputMimeType: "audio/mpeg",
  outputExtension: ".mp3",
  maxSizeBytes: MAX_2GB,
  resourceClass: "medium",
  timeoutMs: 300000,
  async convert(inputPath, outputPath, options): Promise<ConversionResult> {
    const bitrate = options?.audioBitrate || "256k";
    const res = await runFfmpegAudio(inputPath, outputPath, "libmp3lame", bitrate);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "audio/mpeg" };
  },
};

export const audioConverters = [
  wavToMp3Converter,
  mp3ToWavConverter,
  flacToMp3Converter,
  m4aToMp3Converter,
];
