import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { ConverterHandler, ConversionResult, ConversionOptions } from "@/lib/types/converter";

const execFileAsync = promisify(execFile);
const MAX_2GB = 2147483648; // 2 GB

async function runFfmpeg(
  args: string[],
  timeoutMs: number = 600000 // 10 minutes max for 2GB video jobs
): Promise<{ success: boolean; error?: string }> {
  try {
    await execFileAsync("ffmpeg", ["-y", ...args], {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });
    return { success: true };
  } catch (err: any) {
    console.error("FFmpeg error:", err);
    return {
      success: false,
      error: "Video conversion failed. The file may be damaged or use an unsupported codec.",
    };
  }
}

export const mp4ToMp3Converter: ConverterHandler = {
  id: "mp4-to-mp3",
  name: "MP4 to MP3",
  category: "video",
  inputMimeTypes: ["video/mp4", "video/quicktime"],
  inputExtensions: [".mp4"],
  outputFormat: "mp3",
  outputMimeType: "audio/mpeg",
  outputExtension: ".mp3",
  maxSizeBytes: MAX_2GB,
  maxOutputSizeBytes: 524288000, // 500MB max audio output
  resourceClass: "large",
  timeoutMs: 600000,
  async convert(inputPath, outputPath, options): Promise<ConversionResult> {
    const bitrate = options?.audioBitrate || "192k";
    const args = ["-i", inputPath, "-vn", "-b:a", bitrate, outputPath];
    const res = await runFfmpeg(args, 600000);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "audio/mpeg" };
  },
};

export const mp4ToWebmConverter: ConverterHandler = {
  id: "mp4-to-webm",
  name: "MP4 to WEBM",
  category: "video",
  inputMimeTypes: ["video/mp4"],
  inputExtensions: [".mp4"],
  outputFormat: "webm",
  outputMimeType: "video/webm",
  outputExtension: ".webm",
  maxSizeBytes: MAX_2GB,
  maxOutputSizeBytes: MAX_2GB,
  resourceClass: "large",
  timeoutMs: 600000,
  async convert(inputPath, outputPath): Promise<ConversionResult> {
    const args = ["-i", inputPath, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", outputPath];
    const res = await runFfmpeg(args, 600000);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "video/webm" };
  },
};

export const mp4ToGifConverter: ConverterHandler = {
  id: "mp4-to-gif",
  name: "MP4 to GIF",
  category: "video",
  inputMimeTypes: ["video/mp4"],
  inputExtensions: [".mp4"],
  outputFormat: "gif",
  outputMimeType: "image/gif",
  outputExtension: ".gif",
  maxSizeBytes: 524288000, // 500MB limit for GIF generation
  maxOutputSizeBytes: 209715200, // 200MB max GIF
  resourceClass: "large",
  timeoutMs: 300000,
  async convert(inputPath, outputPath): Promise<ConversionResult> {
    const args = ["-i", inputPath, "-vf", "fps=10,scale=480:-1:flags=lanczos", outputPath];
    const res = await runFfmpeg(args, 300000);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "image/gif" };
  },
};

export const movToMp4Converter: ConverterHandler = {
  id: "mov-to-mp4",
  name: "MOV to MP4",
  category: "video",
  inputMimeTypes: ["video/quicktime"],
  inputExtensions: [".mov"],
  outputFormat: "mp4",
  outputMimeType: "video/mp4",
  outputExtension: ".mp4",
  maxSizeBytes: MAX_2GB,
  maxOutputSizeBytes: MAX_2GB,
  resourceClass: "large",
  timeoutMs: 600000,
  async convert(inputPath, outputPath): Promise<ConversionResult> {
    const args = ["-i", inputPath, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", outputPath];
    const res = await runFfmpeg(args, 600000);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "video/mp4" };
  },
};

export const webmToMp4Converter: ConverterHandler = {
  id: "webm-to-mp4",
  name: "WEBM to MP4",
  category: "video",
  inputMimeTypes: ["video/webm"],
  inputExtensions: [".webm"],
  outputFormat: "mp4",
  outputMimeType: "video/mp4",
  outputExtension: ".mp4",
  maxSizeBytes: MAX_2GB,
  maxOutputSizeBytes: MAX_2GB,
  resourceClass: "large",
  timeoutMs: 600000,
  async convert(inputPath, outputPath): Promise<ConversionResult> {
    const args = ["-i", inputPath, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", outputPath];
    const res = await runFfmpeg(args, 600000);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "video/mp4" };
  },
};

export const compressVideoConverter: ConverterHandler = {
  id: "compress-video",
  name: "Compress Video",
  category: "video",
  inputMimeTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska"],
  inputExtensions: [".mp4", ".mov", ".webm", ".avi", ".mkv"],
  outputFormat: "mp4",
  outputMimeType: "video/mp4",
  outputExtension: ".mp4",
  maxSizeBytes: MAX_2GB,
  maxOutputSizeBytes: MAX_2GB,
  resourceClass: "large",
  timeoutMs: 600000,
  async convert(inputPath, outputPath, options): Promise<ConversionResult> {
    let crf = "28";
    if (options?.videoPreset === "quality") crf = "22";
    if (options?.videoPreset === "small") crf = "32";

    const args = ["-i", inputPath, "-c:v", "libx264", "-preset", "faster", "-crf", crf, "-c:a", "aac", "-b:a", "128k", outputPath];
    const res = await runFfmpeg(args, 600000);
    if (!res.success) return { success: false, error: res.error };

    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "video/mp4" };
  },
};

export const videoConverters = [
  mp4ToMp3Converter,
  mp4ToWebmConverter,
  mp4ToGifConverter,
  movToMp4Converter,
  webmToMp4Converter,
  compressVideoConverter,
];
