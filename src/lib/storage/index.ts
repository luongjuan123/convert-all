import fs from "fs/promises";
import path from "path";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Storage as GCSStorage } from "@google-cloud/storage";
import { siteConfig } from "@/config/site";

const LOCAL_TEMP_DIR = process.env.TEMP_STORAGE_PATH || "/tmp/file-converter-storage";

async function ensureLocalDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
}

let gcsClient: GCSStorage | null = null;
const bucketName = process.env.GCS_BUCKET_NAME || process.env.GCS_TEMPORARY_BUCKET || "";

if (bucketName) {
  try {
    gcsClient = new GCSStorage();
  } catch (err) {
    console.warn("Google Cloud Storage client initialization deferred/failed:", err);
  }
}

const ALLOWED_ORIGINS = [
  "https://convertall-site.web.app",
  "https://convertall-site.firebaseapp.com",
  "https://convertall.site",
  "https://www.convertall.site",
  "http://localhost:3000",
];

function resolveAllowedOrigin(requestedOrigin?: string): string {
  if (requestedOrigin) {
    const trimmed = requestedOrigin.trim().toLowerCase();
    if (ALLOWED_ORIGINS.includes(trimmed)) {
      return trimmed;
    }
    if (trimmed.endsWith(".web.app") || trimmed.endsWith(".firebaseapp.com")) {
      return trimmed;
    }
  }
  return siteConfig.domain;
}

export interface StorageProvider {
  saveInputFile: (jobId: string, filename: string, bufferOrPath: Buffer | string) => Promise<string>;
  getOutputPath: (jobId: string, filename: string) => Promise<string>;
  getDownloadUrl: (jobId: string, outputFilename?: string) => Promise<string>;
  createResumableUploadSession: (
    jobId: string,
    filename: string,
    sizeBytes: number,
    clientOrigin?: string
  ) => Promise<{ uploadUrl: string; isResumable: boolean }>;
  verifyUploadedObject: (
    jobId: string,
    filename: string,
    maxSizeBytes: number
  ) => Promise<{ valid: boolean; actualSize: number; error?: string }>;
  prepareLocalInputFile: (jobId: string, filename: string) => Promise<string>;
  saveOutputFile: (jobId: string, outputFilename: string, localPath: string) => Promise<string>;
  getDownloadStream: (
    jobId: string,
    outputFilename: string,
    range?: { start: number; end: number }
  ) => Promise<{
    stream: NodeJS.ReadableStream;
    totalSize: number;
    contentType?: string;
  } | null>;
  deleteJobFiles: (jobId: string) => Promise<void>;
  cleanExpiredFiles: (maxAgeMinutes?: number) => Promise<number>;
  saveJobState: (jobId: string, jobData: any) => Promise<void>;
  getJobState: (jobId: string) => Promise<any | null>;
  deleteJobState: (jobId: string) => Promise<void>;
}

export const hybridStorage: StorageProvider = {
  async saveInputFile(jobId: string, filename: string, bufferOrPath: Buffer | string): Promise<string> {
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    await ensureLocalDir(jobDir);
    const targetPath = path.join(jobDir, `input_${filename}`);

    if (typeof bufferOrPath === "string") {
      await fs.copyFile(bufferOrPath, targetPath);
    } else {
      await fs.writeFile(targetPath, bufferOrPath);
    }

    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        await bucket.upload(targetPath, {
          destination: `uploads/${jobId}/${filename}`,
          resumable: false,
        });
      } catch (err) {
        console.warn(`Failed to mirror input file to GCS for job ${jobId}:`, err);
      }
    }

    return targetPath;
  },

  async getOutputPath(jobId: string, filename: string): Promise<string> {
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    await ensureLocalDir(jobDir);
    return path.join(jobDir, `output_${filename}`);
  },

  async getDownloadUrl(jobId: string): Promise<string> {
    return `/api/download/${jobId}`;
  },

  async createResumableUploadSession(
    jobId: string,
    filename: string,
    sizeBytes: number,
    clientOrigin?: string
  ): Promise<{ uploadUrl: string; isResumable: boolean }> {
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    await ensureLocalDir(jobDir);

    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        const file = bucket.file(`uploads/${jobId}/${filename}`);
        const uploadOrigin = resolveAllowedOrigin(clientOrigin);
        const [uploadUrl] = await file.createResumableUpload({
          origin: uploadOrigin,
        });
        return { uploadUrl, isResumable: true };
      } catch (err) {
        console.warn("GCS Resumable Upload Session creation fallback to local:", err);
      }
    }

    // Local fallback upload endpoint
    return {
      uploadUrl: `/api/upload/chunk?jobId=${jobId}&filename=${encodeURIComponent(filename)}`,
      isResumable: true,
    };
  },

  async verifyUploadedObject(
    jobId: string,
    filename: string,
    maxSizeBytes: number
  ): Promise<{ valid: boolean; actualSize: number; error?: string }> {
    // 1. Check GCS first if configured
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        const gcsFile = bucket.file(`uploads/${jobId}/${filename}`);
        const [exists] = await gcsFile.exists();
        if (exists) {
          const [metadata] = await gcsFile.getMetadata();
          const size = Number(metadata.size || 0);
          if (size <= 0) {
            return { valid: false, actualSize: 0, error: "Uploaded object is empty (0 bytes)." };
          }
          if (size > maxSizeBytes) {
            await gcsFile.delete({ ignoreNotFound: true });
            return {
              valid: false,
              actualSize: size,
              error: `Uploaded file size (${(size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB.`,
            };
          }
          return { valid: true, actualSize: size };
        }
      } catch (err: any) {
        console.warn("GCS verification error, checking local fallback:", err.message);
      }
    }

    // 2. Check Local storage
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    const targetPath = path.join(jobDir, `input_${filename}`);
    try {
      const stat = await fs.stat(targetPath);
      if (stat.size <= 0) {
        return { valid: false, actualSize: 0, error: "Uploaded object is empty (0 bytes)." };
      }
      if (stat.size > maxSizeBytes) {
        await fs.rm(targetPath, { force: true });
        return {
          valid: false,
          actualSize: stat.size,
          error: `Uploaded file size (${(stat.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB.`,
        };
      }
      return { valid: true, actualSize: stat.size };
    } catch (err: any) {
      return { valid: false, actualSize: 0, error: "Uploaded object missing in storage: " + err.message };
    }
  },

  async prepareLocalInputFile(jobId: string, filename: string): Promise<string> {
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    await ensureLocalDir(jobDir);
    const targetPath = path.join(jobDir, `input_${filename}`);

    // Check if file already exists locally and has non-zero size
    try {
      const stat = await fs.stat(targetPath);
      if (stat.size > 0) {
        return targetPath;
      }
    } catch {}

    // Stream download from GCS
    if (gcsClient && bucketName) {
      const bucket = gcsClient.bucket(bucketName);
      const gcsFile = bucket.file(`uploads/${jobId}/${filename}`);
      const [exists] = await gcsFile.exists();
      if (exists) {
        const readStream = gcsFile.createReadStream();
        const writeStream = createWriteStream(targetPath, { flags: "w" });
        await pipeline(readStream, writeStream);
        return targetPath;
      }
    }

    throw new Error(`Uploaded source file '${filename}' missing in storage.`);
  },

  async saveOutputFile(jobId: string, outputFilename: string, localOutputPath: string): Promise<string> {
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        await bucket.upload(localOutputPath, {
          destination: `outputs/${jobId}/${outputFilename}`,
          resumable: false,
        });
      } catch (err) {
        console.error(`Failed to upload output file to GCS for job ${jobId}:`, err);
      }
    }
    return localOutputPath;
  },

  async getDownloadStream(
    jobId: string,
    outputFilename: string,
    range?: { start: number; end: number }
  ): Promise<{
    stream: NodeJS.ReadableStream;
    totalSize: number;
    contentType?: string;
  } | null> {
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    const localPath = path.join(jobDir, `output_${outputFilename}`);

    // Check local disk first
    try {
      const stat = await fs.stat(localPath);
      if (stat.size > 0) {
        const stream = range
          ? createReadStream(localPath, { start: range.start, end: range.end })
          : createReadStream(localPath);
        return { stream, totalSize: stat.size };
      }
    } catch {}

    // Stream from GCS if missing locally
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        const gcsFile = bucket.file(`outputs/${jobId}/${outputFilename}`);
        const [exists] = await gcsFile.exists();
        if (exists) {
          const [metadata] = await gcsFile.getMetadata();
          const totalSize = Number(metadata.size || 0);
          const stream = gcsFile.createReadStream(
            range ? { start: range.start, end: range.end } : undefined
          );
          return { stream, totalSize, contentType: metadata.contentType };
        }
      } catch (err) {
        console.error(`Failed to get download stream from GCS for job ${jobId}:`, err);
      }
    }

    return null;
  },

  async saveJobState(jobId: string, jobData: any): Promise<void> {
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        const gcsFile = bucket.file(`jobs/${jobId}.json`);
        await gcsFile.save(JSON.stringify(jobData), {
          contentType: "application/json",
          resumable: false,
        });
      } catch (err) {
        console.warn(`Failed to persist job state to GCS for job ${jobId}:`, err);
      }
    }
  },

  async getJobState(jobId: string): Promise<any | null> {
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        const gcsFile = bucket.file(`jobs/${jobId}.json`);
        const [exists] = await gcsFile.exists();
        if (exists) {
          const [contents] = await gcsFile.download();
          return JSON.parse(contents.toString("utf-8"));
        }
      } catch (err) {
        console.warn(`Failed to read job state from GCS for job ${jobId}:`, err);
      }
    }
    return null;
  },

  async deleteJobState(jobId: string): Promise<void> {
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        await bucket.file(`jobs/${jobId}.json`).delete({ ignoreNotFound: true });
      } catch {}
    }
  },

  async deleteJobFiles(jobId: string): Promise<void> {
    const jobDir = path.join(LOCAL_TEMP_DIR, jobId);
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to delete local files for job ${jobId}:`, err);
    }

    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        await bucket.deleteFiles({ prefix: `uploads/${jobId}/`, force: true });
        await bucket.deleteFiles({ prefix: `outputs/${jobId}/`, force: true });
        await bucket.file(`jobs/${jobId}.json`).delete({ ignoreNotFound: true });
      } catch (err) {
        console.error(`Failed to delete GCS files for job ${jobId}:`, err);
      }
    }
  },

  async cleanExpiredFiles(maxAgeMinutes: number = siteConfig.fileExpirationMinutes): Promise<number> {
    let deletedCount = 0;
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    // Clean local directories
    try {
      await ensureLocalDir(LOCAL_TEMP_DIR);
      const entries = await fs.readdir(LOCAL_TEMP_DIR, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(LOCAL_TEMP_DIR, entry.name);
          try {
            const stat = await fs.stat(dirPath);
            if (now - stat.mtimeMs > maxAgeMs) {
              await fs.rm(dirPath, { recursive: true, force: true });
              deletedCount++;
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Local file cleanup error:", err);
    }

    // Clean expired GCS objects
    if (gcsClient && bucketName) {
      try {
        const bucket = gcsClient.bucket(bucketName);
        const [files] = await bucket.getFiles({ maxResults: 1000 });
        for (const file of files) {
          try {
            const [metadata] = await file.getMetadata();
            const createdTime = metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : 0;
            if (now - createdTime > maxAgeMs) {
              await file.delete({ ignoreNotFound: true });
              deletedCount++;
            }
          } catch {}
        }
      } catch (err) {
        console.error("GCS file cleanup error:", err);
      }
    }

    return deletedCount;
  },
};

export const localFileStorage: StorageProvider = hybridStorage;
export const storage: StorageProvider = hybridStorage;
export { LOCAL_TEMP_DIR };
