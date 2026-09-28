import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";
import { getConverter } from "@/lib/conversion/registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job session not found or expired." }, { status: 404 });
    }

    const converter = getConverter(job.converterId);
    const maxAllowedBytes = converter ? converter.maxSizeBytes : job.inputSize;

    // Server-side verification of uploaded object size
    const verification = await storage.verifyUploadedObject(job.jobId, job.inputFilename, maxAllowedBytes);

    if (!verification.valid) {
      await updateJob(job.jobId, { status: "failed", error: verification.error || "Uploaded object failed verification." });
      return NextResponse.json({ error: verification.error || "Verification failed." }, { status: 400 });
    }

    // Transition job status to queued
    await updateJob(job.jobId, {
      status: "queued",
      inputSize: verification.actualSize,
      progress: 40,
    });

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      status: "queued",
      actualSize: verification.actualSize,
    });
  } catch (err: any) {
    console.error("Upload completion error:", err);
    return NextResponse.json({ error: "Upload verification failed: " + err.message }, { status: 500 });
  }
}
