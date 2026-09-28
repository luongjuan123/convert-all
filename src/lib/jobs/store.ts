import { JobRecord, JobStatus, ConversionOptions, ResourceClass } from "@/lib/types/converter";
import { siteConfig } from "@/config/site";
import { storage } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

const jobsMap = new Map<string, JobRecord>();

export async function createJob(params: {
  converterId: string;
  inputFilename: string;
  inputSize: number;
  inputMimeType: string;
  outputFormat: string;
  resourceClass?: ResourceClass;
  options?: ConversionOptions;
}): Promise<JobRecord> {
  const jobId = uuidv4();
  const now = Date.now();
  const expiresAt = now + siteConfig.fileExpirationMinutes * 60 * 1000;

  // Determine resourceClass based on file size or converter specification
  let resourceClass: ResourceClass = params.resourceClass || "small";
  if (params.inputSize >= siteConfig.largeFileThresholdBytes) {
    resourceClass = "large";
  } else if (params.inputSize >= 50 * 1024 * 1024) {
    resourceClass = "medium";
  }

  const job: JobRecord = {
    jobId,
    status: "uploading",
    converterId: params.converterId,
    inputFilename: params.inputFilename,
    inputSize: params.inputSize,
    inputMimeType: params.inputMimeType,
    outputFormat: params.outputFormat,
    resourceClass,
    options: params.options || {},
    createdAt: now,
    updatedAt: now,
    expiresAt,
    progress: 0,
  };

  jobsMap.set(jobId, job);
  await storage.saveJobState(jobId, job);
  return job;
}

export async function getJob(jobId: string): Promise<JobRecord | undefined> {
  const cached = jobsMap.get(jobId);
  if (cached) return cached;

  const persisted = await storage.getJobState(jobId);
  if (persisted) {
    jobsMap.set(jobId, persisted);
    return persisted;
  }
  return undefined;
}

export function getJobSync(jobId: string): JobRecord | undefined {
  return jobsMap.get(jobId);
}

export async function updateJob(
  jobId: string,
  updates: Partial<JobRecord>
): Promise<JobRecord | undefined> {
  let existing = jobsMap.get(jobId);
  if (!existing) {
    existing = (await storage.getJobState(jobId)) || undefined;
  }
  if (!existing) return undefined;

  const updated: JobRecord = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  jobsMap.set(jobId, updated);
  await storage.saveJobState(jobId, updated);
  return updated;
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const deleted = jobsMap.delete(jobId);
  await storage.deleteJobState(jobId);
  return deleted;
}

export function countActiveLargeJobs(): number {
  let count = 0;
  for (const job of jobsMap.values()) {
    if (job.resourceClass === "large" && (job.status === "converting" || job.status === "queued")) {
      count++;
    }
  }
  return count;
}

export function canStartLargeJob(): boolean {
  return countActiveLargeJobs() < siteConfig.maxLargeConcurrentJobs;
}

export function getExpiredJobs(): JobRecord[] {
  const now = Date.now();
  const expired: JobRecord[] = [];
  for (const job of jobsMap.values()) {
    if (now > job.expiresAt || job.status === "expired" || job.status === "cancelled") {
      expired.push(job);
    }
  }
  return expired;
}
