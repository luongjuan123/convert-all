import path from "path";
import fs from "fs/promises";
import { siteConfig } from "@/config/site";

// Magic Bytes signatures
const MAGIC_NUMBERS: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG header
  jpg: [[0xff, 0xd8, 0xff]], // JPEG header
  gif: [[0x47, 0x49, 0x46, 0x38]], // GIF87a / GIF89a
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF (check WEBP at offset 8)
  zip: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]], // Zip / Office docx/xlsx/pptx
};

export function sanitizeFilename(filename: string): string {
  // Strip null bytes and control chars
  let clean = filename.replace(/[\x00-\x1f\x7f]/g, "");
  // Replace path separators and dangerous chars
  clean = path.basename(clean);
  clean = clean.replace(/[^a-zA-Z0-9_\.\-]/g, "_");
  // Limit length
  if (clean.length > 200) {
    const ext = path.extname(clean);
    const base = path.basename(clean, ext).substring(0, 190);
    clean = `${base}${ext}`;
  }
  return clean || "file";
}

export function preventPathTraversal(targetPath: string, allowedDir: string): boolean {
  const normalizedTarget = path.normalize(targetPath);
  const normalizedAllowed = path.normalize(allowedDir);
  return normalizedTarget.startsWith(normalizedAllowed);
}

export function validateFileExt(filename: string, allowedExts: string[]): boolean {
  const ext = path.extname(filename).toLowerCase();
  return allowedExts.map((e) => e.toLowerCase()).includes(ext);
}

export function validateFileSize(sizeBytes: number, maxBytes: number = siteConfig.maxUploadSizeBytes): boolean {
  return sizeBytes > 0 && sizeBytes <= maxBytes;
}

export async function validateMagicBytes(filePath: string, expectedFormat: string): Promise<boolean> {
  try {
    const fh = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(12);
    await fh.read(buffer, 0, 12, 0);
    await fh.close();

    const format = expectedFormat.toLowerCase().replace(".", "");
    const sigs = MAGIC_NUMBERS[format];
    if (!sigs) return true; // If no magic number registered, allow after ext check

    return sigs.some((sig) => sig.every((byte, idx) => buffer[idx] === byte));
  } catch (err) {
    console.error("Magic byte validation error:", err);
    return false;
  }
}
