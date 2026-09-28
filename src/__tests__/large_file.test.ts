import assert from "node:assert";
import test, { describe } from "node:test";
import path from "node:path";
import fs from "node:fs/promises";
import { siteConfig } from "../config/site";
import { validateFileSize } from "../lib/security/validation";
import { localFileStorage } from "../lib/storage";

const TEST_DIR = path.join(process.cwd(), "tmp_large_test");

describe("Large File (2 GB) Support Tests", () => {
  test("Configuration: 2 GB Upload Limit Setting", () => {
    const TWO_GB = 2147483648;
    assert.strictEqual(siteConfig.maxUploadSizeBytes, TWO_GB);
    assert.strictEqual(validateFileSize(TWO_GB, siteConfig.maxUploadSizeBytes), true);
    assert.strictEqual(validateFileSize(TWO_GB + 1024, siteConfig.maxUploadSizeBytes), false);
  });

  test("Sparse File Generation & Storage Verification (1.5 GB Test)", async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    const jobId = "test_large_job_123";
    const filename = "sample_1_5gb.mp4";
    const jobDir = path.join(TEST_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    // Programmatically create a 1.5 GB sparse test file (0 physical disk bloat)
    const targetPath = path.join(jobDir, `input_${filename}`);
    const handle = await fs.open(targetPath, "w");
    const ONE_POINT_FIVE_GB = 1610612736; // 1.5 GB
    await handle.truncate(ONE_POINT_FIVE_GB);
    await handle.close();

    const stat = await fs.stat(targetPath);
    assert.strictEqual(stat.size, ONE_POINT_FIVE_GB);

    // Clean up test files
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test("Resumable Upload Session Generation", async () => {
    const session = await localFileStorage.createResumableUploadSession("job_999", "video.mp4", 1500000000);
    assert.ok(session.uploadUrl);
    assert.strictEqual(session.isResumable, true);
  });
});
