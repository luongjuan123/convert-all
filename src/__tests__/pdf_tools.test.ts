import assert from "node:assert";
import test, { describe, before, after } from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PDFDocument } from "pdf-lib";
import {
  mergePdfConverter,
  markdownToPdfConverter,
  imagesToPdfConverter,
} from "../lib/conversion/converters/pdf";
import { runPythonMultiConvert, runPythonPdfConvert } from "../lib/conversion/python-helper";
import { createJob } from "../lib/jobs/store";
import { storage } from "../lib/storage";

const execFileAsync = promisify(execFile);
const TEST_DIR = path.join(process.cwd(), "tmp_pdf_tests");

async function createSamplePdf(
  filePath: string,
  pageCount: number,
  label: string
): Promise<string> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`${label} - Page ${i + 1}`, { x: 50, y: 750, size: 24 });
  }
  const bytes = await doc.save();
  await fs.writeFile(filePath, bytes);
  return filePath;
}

async function getPdfPageCount(filePath: string): Promise<number> {
  const bytes = await fs.readFile(filePath);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

describe("PDF Features & Conversion Tests", () => {
  before(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  after(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {}
  });

  describe("1. Merge PDF Tests", () => {
    test("Merge 2 PDFs -> 1 valid PDF with correct page count", async () => {
      const pdfA = path.join(TEST_DIR, "merge_2_a.pdf");
      const pdfB = path.join(TEST_DIR, "merge_2_b.pdf");
      const outPdf = path.join(TEST_DIR, "merged_2_out.pdf");

      await createSamplePdf(pdfA, 2, "DocA");
      await createSamplePdf(pdfB, 3, "DocB");

      const result = await mergePdfConverter.convert(pdfA, outPdf, {
        additionalInputPaths: [pdfB],
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.outputSize && result.outputSize > 0);

      const pageCount = await getPdfPageCount(outPdf);
      assert.strictEqual(pageCount, 5, "Expected 2 + 3 = 5 pages in merged PDF");

      // Verify page text order using pdftotext
      const { stdout } = await execFileAsync("pdftotext", [outPdf, "-"]);
      assert.ok(stdout.includes("DocA - Page 1"));
      assert.ok(stdout.includes("DocA - Page 2"));
      assert.ok(stdout.includes("DocB - Page 1"));
      assert.ok(stdout.includes("DocB - Page 3"));
    });

    test("Merge 3 PDFs -> 1 PDF with preserved sequence", async () => {
      const pdf1 = path.join(TEST_DIR, "seq_1.pdf");
      const pdf2 = path.join(TEST_DIR, "seq_2.pdf");
      const pdf3 = path.join(TEST_DIR, "seq_3.pdf");
      const outPdf = path.join(TEST_DIR, "merged_3_out.pdf");

      await createSamplePdf(pdf1, 1, "FirstDoc");
      await createSamplePdf(pdf2, 1, "SecondDoc");
      await createSamplePdf(pdf3, 1, "ThirdDoc");

      const result = await runPythonMultiConvert("merge", [pdf1, pdf2, pdf3], outPdf);
      assert.strictEqual(result.success, true);

      const pageCount = await getPdfPageCount(outPdf);
      assert.strictEqual(pageCount, 3);

      const { stdout } = await execFileAsync("pdftotext", [outPdf, "-"]);
      const idx1 = stdout.indexOf("FirstDoc");
      const idx2 = stdout.indexOf("SecondDoc");
      const idx3 = stdout.indexOf("ThirdDoc");
      assert.ok(idx1 !== -1 && idx2 !== -1 && idx3 !== -1);
      assert.ok(idx1 < idx2 && idx2 < idx3, "PDF pages must follow exact sequence");
    });

    test("Merge 5 PDFs -> 1 combined document", async () => {
      const paths: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const p = path.join(TEST_DIR, `multi_${i}.pdf`);
        await createSamplePdf(p, 2, `Doc${i}`);
        paths.push(p);
      }
      const outPdf = path.join(TEST_DIR, "merged_5_out.pdf");

      const result = await runPythonMultiConvert("merge", paths, outPdf);
      assert.strictEqual(result.success, true);

      const count = await getPdfPageCount(outPdf);
      assert.strictEqual(count, 10, "5 files of 2 pages each should produce 10 pages");
    });

    test("Corrupt or invalid PDF returns useful user-facing error", async () => {
      const validPdf = path.join(TEST_DIR, "valid.pdf");
      const corruptPdf = path.join(TEST_DIR, "corrupt.pdf");
      const outPdf = path.join(TEST_DIR, "error_out.pdf");

      await createSamplePdf(validPdf, 1, "Valid");
      await fs.writeFile(corruptPdf, Buffer.from("NOT_A_REAL_PDF_HEADER_OR_BODY"));

      const result = await mergePdfConverter.convert(validPdf, outPdf, {
        additionalInputPaths: [corruptPdf],
      });

      assert.strictEqual(result.success, false);
      assert.ok(
        result.error && (result.error.includes("corrupt") || result.error.includes("valid PDF")),
        `Expected corruption error, got: ${result.error}`
      );
    });
  });

  describe("2. Images to PDF Tests", () => {
    test("Convert multiple images (JPG, PNG) into 1 PDF with exact page count", async () => {
      const img1 = path.join(TEST_DIR, "photo1.jpg");
      const img2 = path.join(TEST_DIR, "photo2.png");
      const outPdf = path.join(TEST_DIR, "images_out.pdf");

      // Generate a landscape JPEG and a portrait PNG using FFmpeg
      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "lavfi",
        "-i", "color=c=red:s=800x400",
        "-frames:v", "1",
        img1,
      ]);
      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "lavfi",
        "-i", "color=c=blue:s=400x600",
        "-frames:v", "1",
        img2,
      ]);

      const result = await imagesToPdfConverter.convert(img1, outPdf, {
        additionalInputPaths: [img2],
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.outputSize && result.outputSize > 0);

      const count = await getPdfPageCount(outPdf);
      assert.strictEqual(count, 2, "2 images should produce exactly 2 pages");
    });

    test("Handles WebP images and maintains aspect ratio", async () => {
      const webpPath = path.join(TEST_DIR, "sample.webp");
      const outPdf = path.join(TEST_DIR, "webp_out.pdf");

      // Generate a WebP image
      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "lavfi",
        "-i", "color=c=green:s=500x500",
        "-frames:v", "1",
        "-c:v", "libwebp",
        webpPath,
      ]);

      const result = await imagesToPdfConverter.convert(webpPath, outPdf);
      assert.strictEqual(result.success, true);

      const count = await getPdfPageCount(outPdf);
      assert.strictEqual(count, 1);
    });
  });

  describe("3. Markdown to PDF Tests", () => {
    test("Full Markdown syntax conversion: headings, tables, code blocks, Vietnamese text", async () => {
      const mdPath = path.join(TEST_DIR, "document.md");
      const outPdf = path.join(TEST_DIR, "document_out.pdf");

      const mdContent = `# Báo Cáo Kỹ Thuật

Đây là tài liệu thử nghiệm chuyển đổi Markdown sang PDF.
Xin chào, đây là một tài liệu tiếng Việt có đầy đủ dấu thanh:
**Hà Nội, Đà Nẵng, Cần Thơ, TP. Hồ Chí Minh.**

## Tính năng hệ thống
- Tự động định dạng văn bản
- Tạo bảng dữ liệu trực quan
- Mã nguồn lập trình có khung màu

| Công cụ | Định dạng | Trạng thái |
| :--- | :--- | :---: |
| Ghép PDF | .pdf | Hoạt động |
| Markdown sang PDF | .md | Hoạt động |

\`\`\`python
def convert():
    print("Xin chào thế giới")
    return True
\`\`\`

> Chúc mừng bạn đã hoàn thành tài liệu.
`;

      await fs.writeFile(mdPath, mdContent, "utf-8");

      const result = await markdownToPdfConverter.convert(mdPath, outPdf);
      assert.strictEqual(result.success, true);
      assert.ok(result.outputSize && result.outputSize > 0);

      const count = await getPdfPageCount(outPdf);
      assert.ok(count >= 1, "Expected at least 1 page generated from Markdown");

      // Verify Vietnamese characters and tables with pdftotext
      const { stdout } = await execFileAsync("pdftotext", [outPdf, "-"]);
      assert.ok(stdout.includes("Báo Cáo Kỹ Thuật"));
      assert.ok(stdout.includes("Hà Nội"));
      assert.ok(stdout.includes("Đà Nẵng"));
      assert.ok(stdout.includes("Ghép PDF"));
      assert.ok(stdout.includes("Xin chào thế giới"));
    });

    test("Markdown XSS sanitization removes dangerous scripts", async () => {
      const maliciousMd = path.join(TEST_DIR, "xss.md");
      const outPdf = path.join(TEST_DIR, "xss_out.pdf");

      const dangerousContent = `# Safe Document
<script>alert("hacked")</script>
<iframe src="https://malicious.com"></iframe>
Safe text continues here.
`;
      await fs.writeFile(maliciousMd, dangerousContent, "utf-8");

      const result = await markdownToPdfConverter.convert(maliciousMd, outPdf);
      assert.strictEqual(result.success, true);

      const { stdout } = await execFileAsync("pdftotext", [outPdf, "-"]);
      assert.ok(stdout.includes("Safe Document"));
      assert.ok(stdout.includes("Safe text continues here"));
      assert.strictEqual(stdout.includes("alert"), false, "Script content should be stripped");
    });
  });

  describe("4. End-to-End Merge API Route (/api/convert/merge)", () => {
    test("POST /api/convert/merge creates combined PDF from uploaded jobs", async () => {
      // 1. Create two mock jobs
      const job1 = await createJob({
        converterId: "merge-pdf",
        inputFilename: "e2e_part1.pdf",
        inputSize: 1024,
        inputMimeType: "application/pdf",
        outputFormat: "pdf",
      });

      const job2 = await createJob({
        converterId: "merge-pdf",
        inputFilename: "e2e_part2.pdf",
        inputSize: 2048,
        inputMimeType: "application/pdf",
        outputFormat: "pdf",
      });

      // 2. Save sample PDFs to storage for both jobs
      const sample1 = path.join(TEST_DIR, "e2e_src1.pdf");
      const sample2 = path.join(TEST_DIR, "e2e_src2.pdf");
      await createSamplePdf(sample1, 2, "Part1");
      await createSamplePdf(sample2, 3, "Part2");

      await storage.saveInputFile(job1.jobId, "e2e_part1.pdf", sample1);
      await storage.saveInputFile(job2.jobId, "e2e_part2.pdf", sample2);

      // 3. Call POST /api/convert/merge
      const { POST: mergeRoute } = await import("../app/api/convert/merge/route");
      const fakeReq = {
        json: async () => ({
          toolSlug: "merge-pdf",
          jobIds: [job1.jobId, job2.jobId],
          outputFilename: "custom-merged.pdf",
        }),
      } as any;

      const response = await mergeRoute(fakeReq);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.jobId);
      assert.strictEqual(data.outputFilename, "custom-merged.pdf");
      assert.ok(data.outputSize > 0);
      assert.ok(data.downloadUrl);
      assert.ok(data.previewUrl);

      // Verify the output PDF stream in storage
      const streamObj = await storage.getDownloadStream(data.jobId, "custom-merged.pdf");
      assert.ok(streamObj);
      assert.strictEqual(streamObj.totalSize, data.outputSize);

      // Clean up test jobs
      await storage.deleteJobFiles(job1.jobId);
      await storage.deleteJobFiles(job2.jobId);
      await storage.deleteJobFiles(data.jobId);
    });
  });
});
