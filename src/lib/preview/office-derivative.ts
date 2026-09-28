import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { storage, LOCAL_TEMP_DIR } from "@/lib/storage";
import { getJob, updateJob } from "@/lib/jobs/store";

const execFileAsync = promisify(execFile);

// Mutex map to prevent duplicate simultaneous derivative generations for the same job
const inFlightJobs = new Map<string, Promise<{ success: boolean; pdfFilename?: string; error?: string }>>();

export async function getOrCreateOfficePreviewDerivative(
  jobId: string
): Promise<{ success: boolean; pdfFilename?: string; error?: string }> {
  // If already running for this jobId, wait for existing promise
  if (inFlightJobs.has(jobId)) {
    return inFlightJobs.get(jobId)!;
  }

  const promise = (async () => {
    try {
      const job = await getJob(jobId);
      if (!job || !job.outputFilename) {
        return { success: false, error: "Job output file not found or expired." };
      }

      const previewFilename = "preview.pdf";
      const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
      await fs.mkdir(jobDir, { recursive: true });

      // 1. Check if preview already exists in storage
      const existing = await storage.getDownloadStream(jobId, previewFilename);
      if (existing) {
        return { success: true, pdfFilename: previewFilename };
      }

      // 2. Locate or download original output file locally
      const localOriginal = path.join(jobDir, `output_${job.outputFilename}`);
      let hasLocalOriginal = false;
      try {
        const stat = await fs.stat(localOriginal);
        if (stat.size > 0) hasLocalOriginal = true;
      } catch {}

      if (!hasLocalOriginal) {
        const originalStream = await storage.getDownloadStream(jobId, job.outputFilename);
        if (!originalStream) {
          return { success: false, error: "Original Office output file missing." };
        }
        // Save stream locally for LibreOffice
        const { createWriteStream } = await import("fs");
        const { pipeline } = await import("stream/promises");
        const outStream = createWriteStream(localOriginal);
        await pipeline(originalStream.stream as any, outStream);
      }

      // 3. Execute LibreOffice conversion to PDF sidecar
      const outDir = path.join(jobDir, "preview_gen");
      await fs.mkdir(outDir, { recursive: true });

      const args = ["--headless", "--convert-to", "pdf", "--outdir", outDir, localOriginal];
      await execFileAsync("libreoffice", args, {
        timeout: 60000, // 60s timeout
        maxBuffer: 1024 * 1024 * 30,
      });

      const baseName = path.basename(localOriginal, path.extname(localOriginal));
      const generatedPdf = path.join(outDir, `${baseName}.pdf`);

      const targetPreviewLocal = path.join(jobDir, `output_${previewFilename}`);
      await fs.rename(generatedPdf, targetPreviewLocal);
      await fs.rm(outDir, { recursive: true, force: true });

      // 4. Save derivative to GCS so any Cloud Run instance can serve subsequent previews
      await storage.saveOutputFile(jobId, previewFilename, targetPreviewLocal);

      // 5. Update job state
      await updateJob(jobId, {
        hasPreviewDerivative: true,
        previewDerivativeFilename: previewFilename,
      });

      return { success: true, pdfFilename: previewFilename };
    } catch (err: any) {
      console.error(`Office preview derivative generation failed for job ${jobId}:`, err);
      return {
        success: false,
        error: "Unable to generate PDF preview derivative for this Office document.",
      };
    } finally {
      inFlightJobs.delete(jobId);
    }
  })();

  inFlightJobs.set(jobId, promise);
  return promise;
}
