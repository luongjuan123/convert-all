import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import path from "path";
import { getJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";
import { getOrCreateOfficePreviewDerivative } from "@/lib/preview/office-derivative";

const OFFICE_EXTENSIONS = [".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls"];

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

  // Handle Office preview derivative (render DOCX/PPTX/XLSX as PDF sidecar)
  const ext = path.extname(targetFilename).toLowerCase();
  const isOffice = OFFICE_EXTENSIONS.includes(ext);

  if (isOffice) {
    const derivativeRes = await getOrCreateOfficePreviewDerivative(jobId);
    if (!derivativeRes.success || !derivativeRes.pdfFilename) {
      return NextResponse.json(
        {
          error: "Preview unavailable for this format.",
          canDownload: true,
          downloadUrl: `/api/download/${jobId}`,
        },
        { status: 422 }
      );
    }
    targetFilename = derivativeRes.pdfFilename;
    targetMimeType = "application/pdf";
  }

  // Sanitize active content MIME types on application origin
  if (targetMimeType === "text/html" || targetMimeType === "image/svg+xml") {
    targetMimeType = "text/plain; charset=utf-8";
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

    // Common inline headers
    const baseHeaders: Record<string, string> = {
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${encodeURIComponent(targetFilename)}"`,
      "Cache-Control": "private, max-age=3600, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    };

    if (range && range.start !== undefined) {
      const start = range.start;
      const end = range.end !== undefined ? range.end : totalSize - 1;
      const chunkSize = end - start + 1;

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Content-Length": chunkSize.toString(),
        },
      });
    }

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": totalSize.toString(),
      },
    });
  } catch (err: any) {
    console.error("Preview stream error:", err);
    return NextResponse.json({ error: "Unable to stream preview." }, { status: 500 });
  }
}
