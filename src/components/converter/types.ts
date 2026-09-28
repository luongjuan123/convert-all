import { ConversionOptions, OutputArtifact } from "@/lib/types/converter";

export interface ConverterOption {
  id: string;
  name: string;
  outputFormat: string;
  outputExtension: string;
}

export type BatchItemStage =
  | "pending" // Selected, waiting for user to start or configure
  | "queued" // In queue waiting for upload slot
  | "session" // Creating upload session
  | "uploading" // Uploading payload to GCS
  | "verifying" // Verifying uploaded object in GCS
  | "converting" // Cloud Run executing conversion
  | "completed" // Ready for preview & download
  | "failed" // Encountered error
  | "cancelled"; // Cancelled by user

export interface BatchItem {
  id: string; // Unique stable client ID
  attemptId: number; // Token to discard stale async callbacks
  file: File;
  converterId: string;
  availableConverters: ConverterOption[];
  options: ConversionOptions;
  jobId?: string;
  stage: BatchItemStage;
  progress: number;
  uploadStats: {
    uploadedBytes: number;
    totalBytes: number;
    speedMbPerSec: number;
    remainingSeconds: number;
  };
  resultData?: {
    outputFilename: string;
    outputSize: number;
    outputMimeType?: string;
    downloadUrl: string;
    previewUrl: string;
    artifacts?: OutputArtifact[];
  };
  error?: string;
  errorStage?: "session" | "upload" | "verification" | "conversion" | null;
  xhr?: XMLHttpRequest | null;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
