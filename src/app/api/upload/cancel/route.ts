import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (job) {
      await updateJob(jobId, { status: "cancelled" });
      await storage.deleteJobFiles(jobId);
      await deleteJob(jobId);
    }

    return NextResponse.json({ success: true, message: "Upload session cancelled and temporary files deleted." });
  } catch (err: any) {
    return NextResponse.json({ error: "Cancellation failed: " + err.message }, { status: 500 });
  }
}
