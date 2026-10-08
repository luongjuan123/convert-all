import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { PDFDocument } from "pdf-lib";
import { ConverterHandler, ConversionResult, ConversionOptions, OutputArtifact } from "@/lib/types/converter";
import { runPythonPdfConvert, runPythonMultiConvert } from "../python-helper";

const execFileAsync = promisify(execFile);
const MAX_PDF_BYTES = 209715200; // 200MB limit for PDF processing

async function collectPdfImageArtifacts(
  outputPath: string,
  mimeType: string,
  ext: string
): Promise<{ outputPath: string; outputSize: number; artifacts: OutputArtifact[] }> {
  const dir = path.dirname(outputPath);
  const base = path.basename(outputPath, ext);
  const artifacts: OutputArtifact[] = [];

  // Check for multi-page pattern first: ${base}_page_1${ext}, etc.
  const files = await fs.readdir(dir);
  const escapedExt = ext.replace(".", "\\.");
  const pageRegex = new RegExp(`^${base}_page_(\\d+)${escapedExt}$`);
  const matchingFiles = files
    .filter((f) => pageRegex.test(f))
    .sort((a, b) => {
      const matchA = a.match(pageRegex);
      const matchB = b.match(pageRegex);
      const numA = matchA ? parseInt(matchA[1], 10) : 0;
      const numB = matchB ? parseInt(matchB[1], 10) : 0;
      return numA - numB;
    });

  if (matchingFiles.length > 0) {
    for (let i = 0; i < matchingFiles.length; i++) {
      const filename = matchingFiles[i];
      const filePath = path.join(dir, filename);
      const stat = await fs.stat(filePath);
      artifacts.push({
        id: `page-${i + 1}`,
        filename,
        size: stat.size,
        mimeType,
      });
    }

    // Ensure primary outputPath exists with first page content
    const firstFilePath = path.join(dir, matchingFiles[0]);
    try {
      await fs.copyFile(firstFilePath, outputPath);
    } catch {}

    const primaryStat = await fs.stat(outputPath);
    return { outputPath, outputSize: primaryStat.size, artifacts };
  }

  // Fallback: Check if single-page output exists directly
  try {
    const singleStat = await fs.stat(outputPath);
    if (singleStat.size > 0) {
      artifacts.push({
        id: "page-1",
        filename: path.basename(outputPath),
        size: singleStat.size,
        mimeType,
      });
      return { outputPath, outputSize: singleStat.size, artifacts };
    }
  } catch {}

  throw new Error("No image output files were generated from PDF.");
}

export const pdfToDocxConverter: ConverterHandler = {
  id: "pdf-to-docx",
  name: "PDF to Word (DOCX)",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "docx",
  outputMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  outputExtension: ".docx",
  maxSizeBytes: 104857600, // 100MB
  maxPages: 500,
  resourceClass: "medium",
  timeoutMs: 180000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    const res = await runPythonPdfConvert("docx", inputPath, outputPath);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to convert PDF to Word document." };
    }
    const stat = await fs.stat(outputPath);
    return {
      success: true,
      outputPath,
      outputSize: stat.size,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  },
};

export const pdfToJpgConverter: ConverterHandler = {
  id: "pdf-to-jpg",
  name: "PDF to JPG",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "jpg",
  outputMimeType: "image/jpeg",
  outputExtension: ".jpg",
  maxSizeBytes: 104857600,
  resourceClass: "medium",
  timeoutMs: 120000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    const res = await runPythonPdfConvert("jpg", inputPath, outputPath);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to render PDF as JPG image." };
    }
    try {
      const { outputSize, artifacts } = await collectPdfImageArtifacts(outputPath, "image/jpeg", ".jpg");
      return { success: true, outputPath, outputSize, mimeType: "image/jpeg", artifacts };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

export const pdfToPngConverter: ConverterHandler = {
  id: "pdf-to-png",
  name: "PDF to PNG",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "png",
  outputMimeType: "image/png",
  outputExtension: ".png",
  maxSizeBytes: 104857600,
  resourceClass: "medium",
  timeoutMs: 120000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    const res = await runPythonPdfConvert("png", inputPath, outputPath);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to render PDF as PNG image." };
    }
    try {
      const { outputSize, artifacts } = await collectPdfImageArtifacts(outputPath, "image/png", ".png");
      return { success: true, outputPath, outputSize, mimeType: "image/png", artifacts };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

export const pdfToTxtConverter: ConverterHandler = {
  id: "pdf-to-txt",
  name: "PDF to Text",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "txt",
  outputMimeType: "text/plain",
  outputExtension: ".txt",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 60000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    const res = await runPythonPdfConvert("txt", inputPath, outputPath);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to extract text from PDF." };
    }
    const stat = await fs.stat(outputPath);
    return { success: true, outputPath, outputSize: stat.size, mimeType: "text/plain" };
  },
};

export const jpgToPdfConverter: ConverterHandler = {
  id: "jpg-to-pdf",
  name: "JPG to PDF",
  category: "image",
  inputMimeTypes: ["image/jpeg", "image/jpg"],
  inputExtensions: [".jpg", ".jpeg"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 60000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    try {
      const imgBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.create();
      const image = await pdfDoc.embedJpg(imgBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err: any) {
      return { success: false, error: "Failed to convert JPG image to PDF: " + err.message };
    }
  },
};

export const pngToPdfConverter: ConverterHandler = {
  id: "png-to-pdf",
  name: "PNG to PDF",
  category: "image",
  inputMimeTypes: ["image/png"],
  inputExtensions: [".png"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 52428800,
  resourceClass: "small",
  timeoutMs: 60000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    try {
      const imgBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.create();
      const image = await pdfDoc.embedPng(imgBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err: any) {
      return { success: false, error: "Failed to convert PNG image to PDF: " + err.message };
    }
  },
};

export const mergePdfConverter: ConverterHandler = {
  id: "merge-pdf",
  name: "Merge PDF",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: MAX_PDF_BYTES,
  resourceClass: "medium",
  timeoutMs: 180000,
  async convert(inputPath: string, outputPath: string, options?: ConversionOptions): Promise<ConversionResult> {
    try {
      const additional = Array.isArray(options?.additionalInputPaths) ? (options?.additionalInputPaths as string[]) : [];
      const allPaths = [inputPath, ...additional];

      const res = await runPythonMultiConvert("merge", allPaths, outputPath, 180000);
      if (!res.success) {
        return {
          success: false,
          error: res.error || "Failed to merge PDF documents. One of the files may be corrupted or password-protected.",
        };
      }

      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err: any) {
      return {
        success: false,
        error: "Failed to merge PDF documents: " + (err.message || "Unknown error"),
      };
    }
  },
};

export const markdownToPdfConverter: ConverterHandler = {
  id: "markdown-to-pdf",
  name: "Markdown to PDF",
  category: "pdf",
  inputMimeTypes: ["text/markdown", "text/x-markdown", "text/plain"],
  inputExtensions: [".md", ".markdown"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 52428800, // 50MB
  resourceClass: "small",
  timeoutMs: 60000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    try {
      const res = await runPythonPdfConvert("markdown_to_pdf", inputPath, outputPath, 60000);
      if (!res.success) {
        return {
          success: false,
          error: res.error || "Failed to convert Markdown to PDF document.",
        };
      }

      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err: any) {
      return {
        success: false,
        error: "Failed to convert Markdown to PDF: " + (err.message || "Unknown error"),
      };
    }
  },
};

export const imagesToPdfConverter: ConverterHandler = {
  id: "images-to-pdf",
  name: "Images to PDF",
  category: "pdf",
  inputMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  inputExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 104857600, // 100MB per image
  resourceClass: "medium",
  timeoutMs: 180000,
  async convert(inputPath: string, outputPath: string, options?: ConversionOptions): Promise<ConversionResult> {
    try {
      const additional = Array.isArray(options?.additionalInputPaths) ? (options?.additionalInputPaths as string[]) : [];
      const allPaths = [inputPath, ...additional];

      const res = await runPythonMultiConvert("images_to_pdf", allPaths, outputPath, 180000);
      if (!res.success) {
        return {
          success: false,
          error: res.error || "Failed to convert images to PDF. An image may be corrupted or in an unsupported format.",
        };
      }

      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err: any) {
      return {
        success: false,
        error: "Failed to convert images to PDF: " + (err.message || "Unknown error"),
      };
    }
  },
};

export const splitPdfConverter: ConverterHandler = {
  id: "split-pdf",
  name: "Split PDF",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: MAX_PDF_BYTES,
  resourceClass: "medium",
  timeoutMs: 60000,
  async convert(inputPath: string, outputPath: string, options?: ConversionOptions): Promise<ConversionResult> {
    try {
      const pdfBytes = await fs.readFile(inputPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();

      const pageIndices = pdf.getPageIndices();
      const targetIndices = pageIndices.length > 0 ? [pageIndices[0]] : [];
      const copiedPages = await newPdf.copyPages(pdf, targetIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const outputBytes = await newPdf.save();
      await fs.writeFile(outputPath, outputBytes);

      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err: any) {
      return { success: false, error: "Failed to split PDF: " + err.message };
    }
  },
};

export const compressPdfConverter: ConverterHandler = {
  id: "compress-pdf",
  name: "Compress PDF",
  category: "pdf",
  inputMimeTypes: ["application/pdf"],
  inputExtensions: [".pdf"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: MAX_PDF_BYTES,
  resourceClass: "medium",
  timeoutMs: 120000,
  async convert(inputPath: string, outputPath: string): Promise<ConversionResult> {
    try {
      const args = [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${outputPath}`,
        inputPath,
      ];
      await execFileAsync("gs", args, { timeout: 120000 });
      const stat = await fs.stat(outputPath);
      return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
    } catch (err) {
      try {
        const pdfBytes = await fs.readFile(inputPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const savedBytes = await pdf.save({ useObjectStreams: true });
        await fs.writeFile(outputPath, savedBytes);
        const stat = await fs.stat(outputPath);
        return { success: true, outputPath, outputSize: stat.size, mimeType: "application/pdf" };
      } catch (fallbackErr: any) {
        return { success: false, error: "PDF compression failed: " + fallbackErr.message };
      }
    }
  },
};

export const pdfConverters = [
  pdfToDocxConverter,
  pdfToJpgConverter,
  pdfToPngConverter,
  pdfToTxtConverter,
  jpgToPdfConverter,
  pngToPdfConverter,
  mergePdfConverter,
  markdownToPdfConverter,
  imagesToPdfConverter,
  splitPdfConverter,
  compressPdfConverter,
];
