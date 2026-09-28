import assert from "node:assert";
import test, { describe } from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pngToPdfConverter, pdfToPngConverter, pdfToTxtConverter } from "../lib/conversion/converters/pdf";
import { jpgToPngConverter } from "../lib/conversion/converters/image";
import { sanitizeFilename, preventPathTraversal, validateFileSize } from "../lib/security/validation";

const execFileAsync = promisify(execFile);
const TEST_DIR = path.join(process.cwd(), "tmp_test_output");

describe("Universal File Converter Tests", () => {
  test("Security: Filename Sanitization & Path Traversal", () => {
    const dangerousName = "../../../etc/passwd\0test.png";
    const clean = sanitizeFilename(dangerousName);
    assert.strictEqual(clean.includes(".."), false);
    assert.strictEqual(clean.includes("\0"), false);
    assert.strictEqual(preventPathTraversal("/tmp/storage/../../etc/passwd", "/tmp/storage"), false);
    assert.strictEqual(validateFileSize(100, 1000), true);
    assert.strictEqual(validateFileSize(5000, 1000), false);
  });

  test("Image Conversion: JPG -> PNG", async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    const sampleJpg = path.join(TEST_DIR, "sample.jpg");
    const outputPng = path.join(TEST_DIR, "output.png");

    // Generate a 1x1 test JPEG using FFmpeg
    await execFileAsync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=red:s=100x100", "-frames:v", "1", sampleJpg]);
    
    const result = await jpgToPngConverter.convert(sampleJpg, outputPng);
    assert.strictEqual(result.success, true);
    assert.ok(result.outputSize && result.outputSize > 0);

    const exists = await fs.stat(outputPng);
    assert.ok(exists.size > 0);
  });

  test("Image to PDF Conversion: PNG -> PDF", async () => {
    const samplePng = path.join(TEST_DIR, "sample.png");
    const outputPdf = path.join(TEST_DIR, "output.pdf");

    // Generate test PNG
    await execFileAsync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=blue:s=100x100", "-frames:v", "1", samplePng]);

    const result = await pngToPdfConverter.convert(samplePng, outputPdf);
    assert.strictEqual(result.success, true);
    
    const stat = await fs.stat(outputPdf);
    assert.ok(stat.size > 0);
  });

  test("Audio Conversion: MP4 -> MP3", async () => {
    const sampleMp4 = path.join(TEST_DIR, "sample.mp4");
    const outputMp3 = path.join(TEST_DIR, "output.mp3");

    // Generate 1-sec test MP4 with audio
    await execFileAsync("ffmpeg", [
      "-y",
      "-f", "lavfi", "-i", "sine=frequency=1000:duration=1",
      "-f", "lavfi", "-i", "color=c=black:s=160x120:d=1",
      "-c:a", "aac", "-c:v", "libx264",
      sampleMp4
    ]);

    const { mp4ToMp3Converter } = await import("../lib/conversion/converters/video");
    const result = await mp4ToMp3Converter.convert(sampleMp4, outputMp3);
    assert.strictEqual(result.success, true);

    const stat = await fs.stat(outputMp3);
    assert.ok(stat.size > 0);
  });
});
