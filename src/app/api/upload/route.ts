import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeFilename, validateFileExt, validateFileSize } from "@/lib/security/validation";
import { createJob } from "@/lib/jobs/store";
import { storage } from "@/lib/storage";
import { findCompatibleConverters, getConverter } from "@/lib/conversion/registry";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const limitResult = checkRateLimit(ip);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "The converter is currently busy or rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedConverterId = formData.get("converterId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const cleanFilename = sanitizeFilename(file.name);
    const ext = path.extname(cleanFilename).toLowerCase();

    // 2. Validate File Size
    if (!validateFileSize(file.size, siteConfig.maxUploadSizeBytes)) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed limit of ${siteConfig.maxUploadSizeBytes / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // 3. Find compatible converters
    let compatibleConverters = findCompatibleConverters(cleanFilename);
    let selectedConverter = requestedConverterId ? getConverter(requestedConverterId) : compatibleConverters[0];

    if (!selectedConverter && compatibleConverters.length > 0) {
      selectedConverter = compatibleConverters[0];
    }

    if (!selectedConverter) {
      return NextResponse.json(
        { error: `Unsupported file format: '${ext}'. No compatible converter available.` },
        { status: 400 }
      );
    }

    // 4. Create Job
    const job = await createJob({
      converterId: selectedConverter.id,
      inputFilename: cleanFilename,
      inputSize: file.size,
      inputMimeType: file.type || "application/octet-stream",
      outputFormat: selectedConverter.outputFormat,
    });

    // 5. Save input file to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const savedPath = await storage.saveInputFile(job.jobId, cleanFilename, buffer);

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      filename: cleanFilename,
      size: file.size,
      converter: {
        id: selectedConverter.id,
        name: selectedConverter.name,
        outputFormat: selectedConverter.outputFormat,
      },
      availableConverters: compatibleConverters.map((c) => ({
        id: c.id,
        name: c.name,
        outputFormat: c.outputFormat,
        outputExtension: c.outputExtension,
      })),
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
