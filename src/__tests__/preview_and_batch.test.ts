import assert from "node:assert";
import test, { describe } from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "util";
import { createJob, updateJob, getJob } from "../lib/jobs/store";
import { storage, LOCAL_TEMP_DIR } from "../lib/storage";
import { pdfToPngConverter } from "../lib/conversion/converters/pdf";
import { PDFDocument, rgb } from "pdf-lib";
import { ZipArchive } from "archiver";
import { PassThrough } from "stream";

const execFileAsync = promisify(execFile);
const TEST_DIR = path.join(process.cwd(), "tmp_preview_test");

describe("Result Previews and Batch Conversion Tests", () => {
  test("Multi-page PDF conversion generates distinct page artifacts", async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    const samplePdfPath = path.join(TEST_DIR, "multipage.pdf");
    const outputPngPath = path.join(TEST_DIR, "output_page.png");

    // Generate a 2-page PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage([300, 300]);
    page1.drawText("Page 1 Content", { x: 50, y: 150, size: 20 });
    const page2 = pdfDoc.addPage([300, 300]);
    page2.drawText("Page 2 Content", { x: 50, y: 150, size: 20 });
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(samplePdfPath, pdfBytes);

    const result = await pdfToPngConverter.convert(samplePdfPath, outputPngPath);
    assert.strictEqual(result.success, true);
    assert.ok(result.artifacts && result.artifacts.length >= 2, "Expected at least 2 page artifacts");
    assert.strictEqual(result.artifacts[0].id, "page-1");
    assert.strictEqual(result.artifacts[1].id, "page-2");
    assert.ok(result.artifacts[0].size > 0);
    assert.ok(result.artifacts[1].size > 0);
  });

  test("Storage and Range Streaming for Preview (HTTP 206 & 200)", async () => {
    const testFilename = "preview_test.txt";
    const testContent = "0123456789ABCDEF0123456789ABCDEF"; // 32 bytes

    const job = await createJob({
      converterId: "pdf-to-txt",
      inputFilename: "input.pdf",
      inputSize: 100,
      inputMimeType: "application/pdf",
      outputFormat: "txt",
      resourceClass: "small",
    });
    const testJobId = job.jobId;

    await updateJob(testJobId, {
      status: "completed",
      outputFilename: testFilename,
      outputSize: testContent.length,
      outputMimeType: "text/plain",
    });

    const jobDir = path.join(LOCAL_TEMP_DIR, testJobId);
    await fs.mkdir(jobDir, { recursive: true });
    await fs.writeFile(path.join(jobDir, `output_${testFilename}`), testContent);

    // 1. Full stream
    const fullDownload = await storage.getDownloadStream(testJobId, testFilename);
    assert.ok(fullDownload);
    assert.strictEqual(fullDownload.totalSize, 32);

    // 2. Range stream (bytes 5 to 10)
    const rangeDownload = await storage.getDownloadStream(testJobId, testFilename, { start: 5, end: 10 });
    assert.ok(rangeDownload);
    assert.strictEqual(rangeDownload.totalSize, 32);

    // Read range stream chunks
    const chunks: Buffer[] = [];
    for await (const chunk of rangeDownload.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const rangeResult = Buffer.concat(chunks).toString("utf-8");
    assert.strictEqual(rangeResult, "56789A"); // index 5 to 10 inclusive (6 bytes)

    await storage.deleteJobFiles(testJobId);
  });

  test("Batch ZIP Archive Generation with Collision Deduplication", async () => {
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    const names = new Set<string>();
    const deduplicate = (filename: string) => {
      if (!names.has(filename)) {
        names.add(filename);
        return filename;
      }
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      let count = 1;
      let candidate = `${base} (${count})${ext}`;
      while (names.has(candidate)) {
        count++;
        candidate = `${base} (${count})${ext}`;
      }
      names.add(candidate);
      return candidate;
    };

    // Add three files with identical names
    const entry1 = deduplicate("photo.png");
    const entry2 = deduplicate("photo.png");
    const entry3 = deduplicate("photo.png");

    assert.strictEqual(entry1, "photo.png");
    assert.strictEqual(entry2, "photo (1).png");
    assert.strictEqual(entry3, "photo (2).png");

    archive.append(Buffer.from("file1"), { name: entry1 });
    archive.append(Buffer.from("file2"), { name: entry2 });
    archive.append(Buffer.from("file3"), { name: entry3 });
    await archive.finalize();

    const chunks: Buffer[] = [];
    for await (const chunk of passThrough) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const zipBuffer = Buffer.concat(chunks);
    assert.ok(zipBuffer.length > 0);
    // Check ZIP magic bytes: PK (0x50, 0x4B, 0x03, 0x04)
    assert.strictEqual(zipBuffer[0], 0x50);
    assert.strictEqual(zipBuffer[1], 0x4b);
  });
});
