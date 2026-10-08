import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getJob, createJob, updateJob } from "@/lib/jobs/store";
import { storage, LOCAL_TEMP_DIR } from "@/lib/storage";
import { runPythonMultiConvert } from "@/lib/conversion/python-helper";
import { sanitizeFilename } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  const localInputPaths: string[] = [];
  let masterJobId: string | null = null;

  try {
    const body = await req.json();
    const { toolSlug, jobIds, outputFilename: requestedFilename, options } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required parameter: jobIds must be a non-empty list of job IDs." },
        { status: 400 }
      );
    }

    const isMergePdf = toolSlug === "merge-pdf";
    const isImagesToPdf = toolSlug === "images-to-pdf";

    if (isMergePdf && jobIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 PDF files are required to merge." },
        { status: 400 }
      );
    }

    if (isImagesToPdf && jobIds.length < 1) {
      return NextResponse.json(
        { error: "At least 1 image is required to generate a PDF." },
        { status: 400 }
      );
    }

    // 1. Fetch and validate all input jobs in exact specified order
    const inputJobs = [];
    let totalInputSize = 0;

    for (let i = 0; i < jobIds.length; i++) {
      const jid = jobIds[i];
      const job = await getJob(jid);
      if (!job) {
        return NextResponse.json(
          { error: `File #${i + 1} (${jid}) is missing or expired. Please upload your files again.` },
          { status: 404 }
        );
      }
      inputJobs.push(job);
      totalInputSize += job.inputSize || 0;
    }

    // 2. Prepare output filename
    let defaultBase = isImagesToPdf ? "images" : "merged";
    if (requestedFilename && typeof requestedFilename === "string") {
      defaultBase = sanitizeFilename(requestedFilename).replace(/\.pdf$/i, "");
    }
    const safeOutputFilename = `${defaultBase}.pdf`;

    // 3. Create Master Job
    const masterJob = await createJob({
      converterId: isImagesToPdf ? "images-to-pdf" : "merge-pdf",
      inputFilename: safeOutputFilename,
      inputSize: totalInputSize,
      inputMimeType: "application/pdf",
      outputFormat: "pdf",
      resourceClass: "medium",
    });
    masterJobId = masterJob.jobId;

    await updateJob(masterJobId, {
      status: "converting",
      progress: 20,
    });

    // 4. Download / prepare all input files locally
    for (const job of inputJobs) {
      try {
        const localPath = await storage.prepareLocalInputFile(job.jobId, job.inputFilename);
        localInputPaths.push(localPath);
      } catch (err: any) {
        await updateJob(masterJobId, {
          status: "failed",
          error: `Failed to prepare source file '${job.inputFilename}': ${err.message}`,
        });
        return NextResponse.json(
          { error: `Source file '${job.inputFilename}' is no longer available in storage: ${err.message}` },
          { status: 400 }
        );
      }
    }

    const jobDir = path.join(LOCAL_TEMP_DIR, masterJobId);
    await fs.mkdir(jobDir, { recursive: true });
    const localOutputPath = path.join(jobDir, `output_${safeOutputFilename}`);

    await updateJob(masterJobId, { progress: 50 });

    // 5. Execute conversion using robust PyMuPDF engine
    const mode = isImagesToPdf ? "images_to_pdf" : "merge";
    const result = await runPythonMultiConvert(mode, localInputPaths, localOutputPath, 180000);

    if (!result.success) {
      await updateJob(masterJobId, {
        status: "failed",
        error: result.error || `Failed to process ${mode.replace("_", " ")}.`,
      });
      return NextResponse.json(
        { error: result.error || "Conversion failed. Please verify that your files are valid and not password-protected." },
        { status: 400 }
      );
    }

    // 6. Verify generated file
    const stat = await fs.stat(localOutputPath);
    if (stat.size <= 0) {
      await updateJob(masterJobId, {
        status: "failed",
        error: "Output PDF file was generated with 0 bytes.",
      });
      return NextResponse.json(
        { error: "Output PDF generation failed: resulting file is empty." },
        { status: 500 }
      );
    }

    // 7. Save output file to storage (GCS + local)
    await storage.saveOutputFile(masterJobId, safeOutputFilename, localOutputPath);

    const downloadUrl = await storage.getDownloadUrl(masterJobId, safeOutputFilename);
    const previewUrl = `/api/preview/${masterJobId}`;

    await updateJob(masterJobId, {
      status: "completed",
      outputFilename: safeOutputFilename,
      outputSize: stat.size,
      outputMimeType: "application/pdf",
      progress: 100,
    });

    return NextResponse.json({
      success: true,
      jobId: masterJobId,
      status: "completed",
      outputFilename: safeOutputFilename,
      outputSize: stat.size,
      outputMimeType: "application/pdf",
      downloadUrl,
      previewUrl,
    });
  } catch (err: any) {
    console.error("Merge API error:", err);
    if (masterJobId) {
      await updateJob(masterJobId, {
        status: "failed",
        error: "Internal server error: " + err.message,
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: "Internal merge error: " + err.message },
      { status: 500 }
    );
  } finally {
    // 8. Safely remove local input files to free disk and prevent leaks
    for (const p of localInputPaths) {
      try {
        await fs.rm(p, { force: true });
      } catch {}
    }
  }
}
