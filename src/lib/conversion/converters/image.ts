import fs from "fs/promises";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { ConverterHandler, ConversionResult, ConversionOptions } from "@/lib/types/converter";

async function processImageSharp(
  inputPath: string,
  outputPath: string,
  format: "jpeg" | "png" | "webp" | "avif",
  options?: ConversionOptions
): Promise<ConversionResult> {
  try {
    let pipeline = sharp(inputPath).rotate(); // Preserve EXIF orientation!

    if (options?.width || options?.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.maintainAspectRatio !== false ? "inside" : "fill",
        withoutEnlargement: true,
      });
    }

    const quality = options?.quality || 85;

    if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === "png") {
      pipeline = pipeline.png({ compressionLevel: Math.floor((100 - quality) / 10) });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "avif") {
      pipeline = pipeline.avif({ quality });
    }

    await pipeline.toFile(outputPath);
    const stat = await fs.stat(outputPath);

    const mimeMap: Record<string, string> = {
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
    };

    return {
      success: true,
      outputPath,
      outputSize: stat.size,
      mimeType: mimeMap[format],
    };
  } catch (err: any) {
    return { success: false, error: `Image conversion failed: ${err.message}` };
  }
}

export const jpgToPngConverter: ConverterHandler = {
  id: "jpg-to-png",
  name: "JPG to PNG",
  category: "image",
  inputMimeTypes: ["image/jpeg", "image/jpg"],
  inputExtensions: [".jpg", ".jpeg"],
  outputFormat: "png",
  outputMimeType: "image/png",
  outputExtension: ".png",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "png", options);
  },
};

export const jpgToWebpConverter: ConverterHandler = {
  id: "jpg-to-webp",
  name: "JPG to WEBP",
  category: "image",
  inputMimeTypes: ["image/jpeg", "image/jpg"],
  inputExtensions: [".jpg", ".jpeg"],
  outputFormat: "webp",
  outputMimeType: "image/webp",
  outputExtension: ".webp",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "webp", options);
  },
};

export const jpgToAvifConverter: ConverterHandler = {
  id: "jpg-to-avif",
  name: "JPG to AVIF",
  category: "image",
  inputMimeTypes: ["image/jpeg", "image/jpg"],
  inputExtensions: [".jpg", ".jpeg"],
  outputFormat: "avif",
  outputMimeType: "image/avif",
  outputExtension: ".avif",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "avif", options);
  },
};

export const pngToJpgConverter: ConverterHandler = {
  id: "png-to-jpg",
  name: "PNG to JPG",
  category: "image",
  inputMimeTypes: ["image/png"],
  inputExtensions: [".png"],
  outputFormat: "jpg",
  outputMimeType: "image/jpeg",
  outputExtension: ".jpg",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "jpeg", options);
  },
};

export const pngToWebpConverter: ConverterHandler = {
  id: "png-to-webp",
  name: "PNG to WEBP",
  category: "image",
  inputMimeTypes: ["image/png"],
  inputExtensions: [".png"],
  outputFormat: "webp",
  outputMimeType: "image/webp",
  outputExtension: ".webp",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "webp", options);
  },
};

export const webpToJpgConverter: ConverterHandler = {
  id: "webp-to-jpg",
  name: "WEBP to JPG",
  category: "image",
  inputMimeTypes: ["image/webp"],
  inputExtensions: [".webp"],
  outputFormat: "jpg",
  outputMimeType: "image/jpeg",
  outputExtension: ".jpg",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "jpeg", options);
  },
};

export const webpToPngConverter: ConverterHandler = {
  id: "webp-to-png",
  name: "WEBP to PNG",
  category: "image",
  inputMimeTypes: ["image/webp"],
  inputExtensions: [".webp"],
  outputFormat: "png",
  outputMimeType: "image/png",
  outputExtension: ".png",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    return processImageSharp(inputPath, outputPath, "png", options);
  },
};

export const heicToJpgConverter: ConverterHandler = {
  id: "heic-to-jpg",
  name: "HEIC to JPG",
  category: "image",
  inputMimeTypes: ["image/heic", "image/heif"],
  inputExtensions: [".heic", ".heif"],
  outputFormat: "jpg",
  outputMimeType: "image/jpeg",
  outputExtension: ".jpg",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 60000,
  async convert(inputPath, outputPath, options): Promise<ConversionResult> {
    try {
      const inputBuffer = await fs.readFile(inputPath);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: (options?.quality || 85) / 100,
      });
      await fs.writeFile(outputPath, outputBuffer);
      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "image/jpeg" };
    } catch (err: any) {
      return { success: false, error: "HEIC to JPG conversion failed: " + err.message };
    }
  },
};

export const compressImageConverter: ConverterHandler = {
  id: "compress-image",
  name: "Compress Image",
  category: "image",
  inputMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  inputExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  outputFormat: "jpg",
  outputMimeType: "image/jpeg",
  outputExtension: ".jpg",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 30000,
  async convert(inputPath, outputPath, options) {
    const opts = { ...options, quality: options?.quality || 65 };
    return processImageSharp(inputPath, outputPath, "jpeg", opts);
  },
};

export const imageConverters = [
  jpgToPngConverter,
  jpgToWebpConverter,
  jpgToAvifConverter,
  pngToJpgConverter,
  pngToWebpConverter,
  webpToJpgConverter,
  webpToPngConverter,
  heicToJpgConverter,
  compressImageConverter,
];
