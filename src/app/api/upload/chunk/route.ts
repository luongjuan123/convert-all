import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { getJob } from "@/lib/jobs/store";
import { LOCAL_TEMP_DIR } from "@/lib/storage";

export async function PUT(req: NextRequest) {
  return handleUploadStream(req);
}

export async function POST(req: NextRequest) {
  return handleUploadStream(req);
}

async function handleUploadStream(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const filename = searchParams.get("filename");

    if (!jobId || !filename) {
      return NextResponse.json({ error: "Missing jobId or filename parameter." }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job session not found or expired." }, { status: 404 });
    }

    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });
    const targetPath = path.join(jobDir, `input_${filename}`);

    if (req.body) {
      // @ts-ignore
      const nodeStream = Readable.fromWeb(req.body);
      const fileWriteStream = createWriteStream(targetPath, { flags: "w" });
      await pipeline(nodeStream, fileWriteStream);
    } else {
      const buffer = Buffer.from(await req.arrayBuffer());
      await fs.writeFile(targetPath, buffer);
    }

    const stat = await fs.stat(targetPath);
    return NextResponse.json({
      success: true,
      jobId,
      filename,
      uploadedBytes: stat.size,
    });
  } catch (err: any) {
    console.error("Upload stream error:", err);
    return NextResponse.json({ error: "Failed to process upload stream: " + err.message }, { status: 500 });
  }
}
