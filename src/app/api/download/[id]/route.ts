import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const res = await GET(req, context);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const job = await getJob(jobId);

  if (!job || job.status !== "completed" || !job.outputFilename) {
    return NextResponse.json(
      { error: "File expired or conversion not completed." },
      { status: 404 }
    );
  }

  // Resolve target artifact if specified
  const artifactParam = req.nextUrl.searchParams.get("artifact");
  let targetFilename = job.outputFilename;
  let targetMimeType = job.outputMimeType;

  if (artifactParam && job.artifacts && job.artifacts.length > 0) {
    const matchedArtifact = job.artifacts.find(
      (a) => a.filename === artifactParam || a.id === artifactParam
    );
    if (matchedArtifact) {
      targetFilename = matchedArtifact.filename;
      targetMimeType = matchedArtifact.mimeType;
    }
  }

  try {
    const rangeHeader = req.headers.get("range");
    let range: { start?: number; end?: number } | undefined = undefined;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : undefined;
      range = { start: isNaN(start) ? 0 : start, end: end && !isNaN(end) ? end : undefined };
    }

    const download = await storage.getDownloadStream(jobId, targetFilename, range as any);
    if (!download) {
      return NextResponse.json({ error: "Converted output file not found." }, { status: 404 });
    }

    const mimeType = download.contentType || targetMimeType || "application/octet-stream";
    const totalSize = download.totalSize;

    // @ts-ignore
    const webStream = Readable.toWeb(download.stream as Readable);

    if (range && range.start !== undefined) {
      const start = range.start;
      const end = range.end !== undefined ? range.end : totalSize - 1;
      const chunkSize = end - start + 1;

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(job.outputFilename)}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      });
    }

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(job.outputFilename)}"`,
        "Content-Length": totalSize.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Converted output file not found." }, { status: 404 });
  }
}
