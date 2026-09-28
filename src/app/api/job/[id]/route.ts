import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found or expired." }, { status: 404 });
  }

  let downloadUrl: string | undefined = undefined;
  if (job.status === "completed" && job.outputFilename) {
    downloadUrl = await storage.getDownloadUrl(jobId, job.outputFilename);
  }

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    inputFilename: job.inputFilename,
    inputSize: job.inputSize,
    outputFormat: job.outputFormat,
    outputFilename: job.outputFilename,
    outputSize: job.outputSize,
    progress: job.progress,
    error: job.error,
    downloadUrl,
    expiresAt: job.expiresAt,
  });
}
