import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getJob, updateJob } from "@/lib/jobs/store";
import { getConverter, convertFile } from "@/lib/conversion/registry";
import { storage, LOCAL_TEMP_DIR } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, converterId: targetConverterId, options } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing required field: jobId" }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found or expired." }, { status: 404 });
    }

    const activeConverterId = targetConverterId || job.converterId;
    const converter = getConverter(activeConverterId);
    if (!converter) {
      return NextResponse.json({ error: "Converter not found." }, { status: 400 });
    }

    // Update state to converting
    await updateJob(jobId, {
      status: "converting",
      converterId: activeConverterId,
      options: options || {},
      progress: 25,
    });

    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    // Ensure input file is available locally for the converter engine (downloads from GCS if needed)
    let inputPath: string;
    try {
      inputPath = await storage.prepareLocalInputFile(jobId, job.inputFilename);
    } catch (err: any) {
      await updateJob(jobId, { status: "failed", error: "Source file missing or cleaned up: " + err.message });
      return NextResponse.json({ error: "Uploaded file no longer exists: " + err.message }, { status: 400 });
    }

    // Construct sanitized output filename
    const baseName = path.basename(job.inputFilename, path.extname(job.inputFilename));
    const outputFilename = `${baseName}${converter.outputExtension}`;
    const outputPath = path.join(jobDir, `output_${outputFilename}`);

    // Execute Conversion
    await updateJob(jobId, { progress: 50 });
    const result = await convertFile(converter.id, inputPath, outputPath, options);

    if (!result.success || !result.outputPath) {
      await updateJob(jobId, {
        status: "failed",
        error: result.error || "We couldn't convert this file. The file may be damaged or use an unsupported codec.",
      });
      return NextResponse.json(
        { error: result.error || "Conversion failed." },
        { status: 500 }
      );
    }

    // Mirror primary output file to GCS so any Cloud Run instance can serve the download
    await storage.saveOutputFile(jobId, outputFilename, outputPath);

    // If multiple artifacts were produced (e.g. multi-page PDF rendering), mirror each to GCS
    let artifactsWithUrls = undefined;
    if (result.artifacts && result.artifacts.length > 0) {
      artifactsWithUrls = [];
      for (const artifact of result.artifacts) {
        const artifactLocalPath = path.join(jobDir, artifact.filename);
        try {
          await storage.saveOutputFile(jobId, artifact.filename, artifactLocalPath);
        } catch (saveErr) {
          console.warn(`Failed to mirror artifact ${artifact.filename} to GCS:`, saveErr);
        }
        artifactsWithUrls.push({
          ...artifact,
          url: `/api/download/${jobId}?artifact=${encodeURIComponent(artifact.filename)}`,
          previewUrl: `/api/preview/${jobId}?artifact=${encodeURIComponent(artifact.filename)}`,
        });
      }
    }

    // Free memory by removing temporary local input file
    try {
      await fs.rm(inputPath, { force: true });
    } catch {}

    const downloadUrl = await storage.getDownloadUrl(jobId, outputFilename);
    const previewUrl = `/api/preview/${jobId}`;

    await updateJob(jobId, {
      status: "completed",
      outputFilename,
      outputSize: result.outputSize,
      outputMimeType: result.mimeType || converter.outputMimeType,
      artifacts: artifactsWithUrls,
      progress: 100,
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: "completed",
      outputFilename,
      outputSize: result.outputSize,
      outputMimeType: result.mimeType || converter.outputMimeType,
      downloadUrl,
      previewUrl,
      artifacts: artifactsWithUrls,
    });
  } catch (err: any) {
    console.error("Convert API error:", err);
    return NextResponse.json(
      { error: "Internal conversion error: " + err.message },
      { status: 500 }
    );
  }
}
