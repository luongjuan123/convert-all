import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), "src", "scripts", "pdf_convert.py");

export async function runPythonPdfConvert(
  mode: "docx" | "jpg" | "png" | "txt" | "markdown_to_pdf" | "merge" | "images_to_pdf",
  inputPdfPath: string,
  outputFilePath: string,
  timeoutMs: number = 180000 // 3 minutes
): Promise<{ success: boolean; error?: string }> {
  try {
    const args = [
      PYTHON_SCRIPT_PATH,
      "--mode",
      mode,
      "--input",
      inputPdfPath,
      "--output",
      outputFilePath,
    ];

    await execFileAsync("python3", args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
    });

    return { success: true };
  } catch (err: any) {
    const errorMsg = (err.stderr || err.stdout || err.message || "PDF conversion failed").trim();
    console.error(`Python PDF convert (${mode}) error:`, errorMsg);
    // Remove "Error: " prefix if present for clean UI display
    const cleanMsg = errorMsg.replace(/^Error:\s*/i, "");
    return {
      success: false,
      error: cleanMsg,
    };
  }
}

export async function runPythonMultiConvert(
  mode: "merge" | "images_to_pdf",
  inputPaths: string[],
  outputFilePath: string,
  timeoutMs: number = 180000 // 3 minutes
): Promise<{ success: boolean; error?: string }> {
  let tempJsonListPath: string | null = null;
  try {
    if (!inputPaths || inputPaths.length === 0) {
      return { success: false, error: "No input files provided to process." };
    }

    // Use a temp JSON file to pass file list safely without ARG_MAX limits
    const tempId = `inputs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.json`;
    tempJsonListPath = path.join(os.tmpdir(), tempId);
    await fs.writeFile(tempJsonListPath, JSON.stringify(inputPaths), "utf-8");

    const args = [
      PYTHON_SCRIPT_PATH,
      "--mode",
      mode,
      "--input-list",
      tempJsonListPath,
      "--output",
      outputFilePath,
    ];

    await execFileAsync("python3", args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 50,
    });

    return { success: true };
  } catch (err: any) {
    const errorMsg = (err.stderr || err.stdout || err.message || "Conversion failed").trim();
    console.error(`Python Multi Convert (${mode}) error:`, errorMsg);
    const cleanMsg = errorMsg.replace(/^Error:\s*/i, "");
    return {
      success: false,
      error: cleanMsg,
    };
  } finally {
    if (tempJsonListPath) {
      try {
        await fs.rm(tempJsonListPath, { force: true });
      } catch {}
    }
  }
}

