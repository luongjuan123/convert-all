import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), "src", "scripts", "pdf_convert.py");

export async function runPythonPdfConvert(
  mode: "docx" | "jpg" | "png" | "txt",
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

    const { stdout, stderr } = await execFileAsync("python3", args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
    });

    return { success: true };
  } catch (err: any) {
    console.error("Python PDF convert error:", err);
    return {
      success: false,
      error: err.stderr || err.stdout || err.message || "PDF conversion failed",
    };
  }
}
