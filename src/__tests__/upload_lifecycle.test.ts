import assert from "node:assert";
import test, { describe } from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { storage, LOCAL_TEMP_DIR } from "../lib/storage";
import { createJob, getJob, updateJob, deleteJob } from "../lib/jobs/store";
import { jpgToPngConverter } from "../lib/conversion/converters/image";
import { siteConfig } from "../config/site";

const execFileAsync = promisify(execFile);
const TEST_DIR = path.join(process.cwd(), "tmp_lifecycle_test");

describe("Upload, Verification & Conversion Lifecycle Tests", () => {
  test("Configuration: Active Production Domain", () => {
    assert.strictEqual(siteConfig.domain, "https://convertall.site");
  });

  test("Session Generation: Allowed Origin Handling", async () => {
    // Session creation with active site origin
    const sessionActive = await storage.createResumableUploadSession(
      "test-job-origin-1",
      "test.jpg",
      1024,
      "https://convertall-site.web.app"
    );
    assert.ok(sessionActive.uploadUrl);
    assert.strictEqual(sessionActive.isResumable, true);

    // Session creation with firebaseapp domain
    const sessionFb = await storage.createResumableUploadSession(
      "test-job-origin-2",
      "test.jpg",
      1024,
      "https://convertall-site.firebaseapp.com"
    );
    assert.ok(sessionFb.uploadUrl);

    // Clean up test sessions
    await storage.deleteJobFiles("test-job-origin-1");
    await storage.deleteJobFiles("test-job-origin-2");
  });

  test("Job Store: Persistence & Lifecycle Transitions", async () => {
    const job = await createJob({
      converterId: "jpg-to-png",
      inputFilename: "photo.jpg",
      inputSize: 50000,
      inputMimeType: "image/jpeg",
      outputFormat: "png",
    });

    assert.ok(job.jobId);
    assert.strictEqual(job.status, "uploading");

    // Fetch job
    const fetched = await getJob(job.jobId);
    assert.ok(fetched);
    assert.strictEqual(fetched.inputFilename, "photo.jpg");

    // Update job to queued
    const updated = await updateJob(job.jobId, { status: "queued", progress: 40 });
    assert.ok(updated);
    assert.strictEqual(updated.status, "queued");
    assert.strictEqual(updated.progress, 40);

    // Delete job
    const deleted = await deleteJob(job.jobId);
    assert.strictEqual(deleted, true);

    const missing = await getJob(job.jobId);
    assert.strictEqual(missing, undefined);
  });

  test("Storage Verification: Valid, Empty, and Oversized Files", async () => {
    const testJobId = "verify_test_job_" + Date.now();
    const jobDir = path.join(LOCAL_TEMP_DIR, testJobId);
    await fs.mkdir(jobDir, { recursive: true });

    // 1. Valid file
    const validFile = path.join(jobDir, "input_valid.jpg");
    await fs.writeFile(validFile, Buffer.from("valid content bytes"));
    const validResult = await storage.verifyUploadedObject(testJobId, "valid.jpg", 1000);
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.actualSize, 19);

    // 2. Empty file (0 bytes)
    const emptyFile = path.join(jobDir, "input_empty.jpg");
    await fs.writeFile(emptyFile, Buffer.alloc(0));
    const emptyResult = await storage.verifyUploadedObject(testJobId, "empty.jpg", 1000);
    assert.strictEqual(emptyResult.valid, false);
    assert.ok(emptyResult.error?.includes("0 bytes"));

    // 3. Oversized file
    const overFile = path.join(jobDir, "input_over.jpg");
    await fs.writeFile(overFile, Buffer.alloc(500));
    const overResult = await storage.verifyUploadedObject(testJobId, "over.jpg", 200);
    assert.strictEqual(overResult.valid, false);
    assert.ok(overResult.error?.includes("exceeds maximum limit"));

    // Clean up
    await storage.deleteJobFiles(testJobId);
  });

  test("End-to-End Pipeline: Upload -> Verification -> Conversion -> Download", async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    const sampleJpg = path.join(TEST_DIR, "pipeline_sample.jpg");
    await execFileAsync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=green:s=80x80", "-frames:v", "1", sampleJpg]);
    const fileBuffer = await fs.readFile(sampleJpg);

    // 1. Create Job
    const job = await createJob({
      converterId: "jpg-to-png",
      inputFilename: "sample.jpg",
      inputSize: fileBuffer.length,
      inputMimeType: "image/jpeg",
      outputFormat: "png",
    });

    // 2. Save input file (simulating upload)
    await storage.saveInputFile(job.jobId, "sample.jpg", fileBuffer);

    // 3. Server-side verification
    const verification = await storage.verifyUploadedObject(job.jobId, "sample.jpg", 10 * 1024 * 1024);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.actualSize, fileBuffer.length);
    await updateJob(job.jobId, { status: "queued" });

    // 4. Prepare local input file
    const localInput = await storage.prepareLocalInputFile(job.jobId, "sample.jpg");
    assert.ok(localInput);

    // 5. Execute conversion
    const localOutput = path.join(LOCAL_TEMP_DIR, job.jobId, "output_sample.png");
    const result = await jpgToPngConverter.convert(localInput, localOutput);
    assert.strictEqual(result.success, true);
    assert.ok(result.outputSize && result.outputSize > 0);

    // Save output
    await storage.saveOutputFile(job.jobId, "sample.png", localOutput);
    await updateJob(job.jobId, {
      status: "completed",
      outputFilename: "sample.png",
      outputSize: result.outputSize,
    });

    // 6. Download stream verification
    const download = await storage.getDownloadStream(job.jobId, "sample.png");
    assert.ok(download);
    assert.strictEqual(download.totalSize, result.outputSize);

    // 7. Cleanup
    await storage.deleteJobFiles(job.jobId);
    await deleteJob(job.jobId);
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });
});
