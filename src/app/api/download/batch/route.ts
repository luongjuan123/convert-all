import { NextRequest, NextResponse } from "next/server";
import { PassThrough, Readable } from "stream";
import path from "path";
import { ZipArchive } from "archiver";
import { getJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";

function deduplicateFilename(filename: string, existingNames: Set<string>): string {
  if (!existingNames.has(filename)) {
    existingNames.add(filename);
    return filename;
  }

  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;

  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }

  existingNames.add(candidate);
  return candidate;
}

export async function GET(req: NextRequest) {
  const jobsParam = req.nextUrl.searchParams.get("jobs");
  if (!jobsParam) {
    return NextResponse.json({ error: "Missing required 'jobs' parameter." }, { status: 400 });
  }

  const jobIds = jobsParam
    .split(",")
    .map((j) => j.trim())
    .filter(Boolean);

  return handleBatchZip(jobIds);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobIds: string[] = Array.isArray(body?.jobIds) ? body.jobIds : [];
    if (jobIds.length === 0) {
      return NextResponse.json({ error: "Missing or empty 'jobIds' array." }, { status: 400 });
    }
    return handleBatchZip(jobIds);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}

async function handleBatchZip(jobIds: string[]) {
  // Validate and collect jobs
  const validJobs = [];
  for (const jobId of jobIds) {
    const job = await getJob(jobId);
    if (job && job.status === "completed" && job.outputFilename) {
      validJobs.push(job);
    }
  }

  if (validJobs.length === 0) {
    return NextResponse.json(
      { error: "No completed or active files found for the requested jobs." },
      { status: 404 }
    );
  }

  const passThrough = new PassThrough();
  const archive = new ZipArchive({
    zlib: { level: 6 },
  });

  archive.on("error", (err: any) => {
    console.error("Batch ZIP archiver error:", err);
    passThrough.destroy(err);
  });

  archive.pipe(passThrough);

  // Queue entries asynchronously
  (async () => {
    const usedNames = new Set<string>();

    for (const job of validJobs) {
      // Check if job has multiple artifacts (e.g. multi-page PDF rendering)
      if (job.artifacts && job.artifacts.length > 0) {
        for (const artifact of job.artifacts) {
          const download = await storage.getDownloadStream(job.jobId, artifact.filename);
          if (download) {
            const entryName = deduplicateFilename(artifact.filename, usedNames);
            archive.append(download.stream as any, { name: entryName });
          }
        }
      } else {
        const download = await storage.getDownloadStream(job.jobId, job.outputFilename!);
        if (download) {
          const entryName = deduplicateFilename(job.outputFilename!, usedNames);
          archive.append(download.stream as any, { name: entryName });
        }
      }
    }

    await archive.finalize();
  })().catch((err) => {
    console.error("Batch ZIP streaming error:", err);
    passThrough.destroy(err);
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const zipFilename = `converted_files_${timestamp}.zip`;

  // @ts-ignore
  const webStream = Readable.toWeb(passThrough);

  return new NextResponse(webStream as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    },
  });
}
