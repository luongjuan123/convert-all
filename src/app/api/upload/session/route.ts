import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeFilename } from "@/lib/security/validation";
import { createJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";
import { findCompatibleConverters, getConverter } from "@/lib/conversion/registry";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const limitResult = checkRateLimit(ip);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "The converter is currently busy. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { filename, size, mimeType, converterId } = body;

    if (!filename || typeof size !== "number" || size <= 0) {
      return NextResponse.json({ error: "Invalid upload request parameters." }, { status: 400 });
    }

    const cleanFilename = sanitizeFilename(filename);

    // 1. Global 2 GB Max Upload Size Check
    if (size > siteConfig.maxUploadSizeBytes) {
      return NextResponse.json(
        {
          error: `File size (${(size / 1024 / 1024 / 1024).toFixed(2)} GB) exceeds global maximum limit of ${(
            siteConfig.maxUploadSizeBytes /
            1024 /
            1024 /
            1024
          ).toFixed(1)} GB.`,
        },
        { status: 400 }
      );
    }

    // 2. Find compatible converters
    const compatible = findCompatibleConverters(cleanFilename);
    let selectedConverter = converterId ? getConverter(converterId) : compatible[0];
    if (!selectedConverter && compatible.length > 0) {
      selectedConverter = compatible[0];
    }

    if (!selectedConverter) {
      return NextResponse.json(
        { error: `Unsupported file format: '${path.extname(cleanFilename)}'. No compatible converter available.` },
        { status: 400 }
      );
    }

    // 3. Per-converter max input file size check
    if (size > selectedConverter.maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File size exceeds converter limit of ${(selectedConverter.maxSizeBytes / 1024 / 1024).toFixed(
            0
          )}MB for ${selectedConverter.name}.`,
        },
        { status: 400 }
      );
    }

    // 4. Create Job
    const job = await createJob({
      converterId: selectedConverter.id,
      inputFilename: cleanFilename,
      inputSize: size,
      inputMimeType: mimeType || "application/octet-stream",
      outputFormat: selectedConverter.outputFormat,
      resourceClass: selectedConverter.resourceClass,
    });

    // 5. Create Resumable Upload Session
    const clientOrigin = req.headers.get("origin") || undefined;
    const session = await storage.createResumableUploadSession(job.jobId, cleanFilename, size, clientOrigin);

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      uploadUrl: session.uploadUrl,
      isResumable: session.isResumable,
      resourceClass: job.resourceClass,
      filename: cleanFilename,
      size,
      converter: {
        id: selectedConverter.id,
        name: selectedConverter.name,
        outputFormat: selectedConverter.outputFormat,
      },
      availableConverters: compatible.map((c) => ({
        id: c.id,
        name: c.name,
        outputFormat: c.outputFormat,
        outputExtension: c.outputExtension,
      })),
    });
  } catch (err: any) {
    console.error("Upload session creation error:", err);
    return NextResponse.json(
      { error: "Failed to initialize upload session: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
