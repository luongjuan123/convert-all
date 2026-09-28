import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { ConverterHandler, ConversionResult } from "@/lib/types/converter";

const execFileAsync = promisify(execFile);

async function convertOfficeToPdf(
  inputPath: string,
  outputPath: string,
  timeoutMs: number = 180000
): Promise<ConversionResult> {
  try {
    const outDir = path.dirname(outputPath);
    const args = ["--headless", "--convert-to", "pdf", "--outdir", outDir, inputPath];

    await execFileAsync("libreoffice", args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 30,
    });

    const expectedName = `${path.basename(inputPath, path.extname(inputPath))}.pdf`;
    const generatedPdfPath = path.join(outDir, expectedName);

    if (generatedPdfPath !== outputPath) {
      try {
        await fs.rename(generatedPdfPath, outputPath);
      } catch {
        // If file already at target path
      }
    }

    const stat = await fs.stat(outputPath);
    return {
      success: true,
      outputPath,
      outputSize: stat.size,
      mimeType: "application/pdf",
    };
  } catch (err: any) {
    console.error("LibreOffice conversion error:", err);
    return {
      success: false,
      error: "Office document conversion failed. File may be corrupted or password-protected.",
    };
  }
}

export const docxToPdfConverter: ConverterHandler = {
  id: "docx-to-pdf",
  name: "Word (DOCX) to PDF",
  category: "office",
  inputMimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],
  inputExtensions: [".docx", ".doc"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 104857600,
  resourceClass: "medium",
  timeoutMs: 180000,
  async convert(inputPath, outputPath) {
    return convertOfficeToPdf(inputPath, outputPath);
  },
};

export const pptxToPdfConverter: ConverterHandler = {
  id: "pptx-to-pdf",
  name: "PowerPoint (PPTX) to PDF",
  category: "office",
  inputMimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint"],
  inputExtensions: [".pptx", ".ppt"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 104857600,
  resourceClass: "medium",
  timeoutMs: 180000,
  async convert(inputPath, outputPath) {
    return convertOfficeToPdf(inputPath, outputPath);
  },
};

export const xlsxToPdfConverter: ConverterHandler = {
  id: "xlsx-to-pdf",
  name: "Excel (XLSX) to PDF",
  category: "office",
  inputMimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
  inputExtensions: [".xlsx", ".xls"],
  outputFormat: "pdf",
  outputMimeType: "application/pdf",
  outputExtension: ".pdf",
  maxSizeBytes: 104857600,
  resourceClass: "medium",
  timeoutMs: 180000,
  async convert(inputPath, outputPath) {
    return convertOfficeToPdf(inputPath, outputPath);
  },
};

export const officeConverters = [
  docxToPdfConverter,
  pptxToPdfConverter,
  xlsxToPdfConverter,
];
