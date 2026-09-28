export type ConversionCategory = "pdf" | "image" | "video" | "audio" | "office";

export type ResourceClass = "small" | "medium" | "large";

export type JobStatus =
  | "uploading"
  | "queued"
  | "converting"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled";

export interface ConversionOptions {
  // Image options
  quality?: number; // 1-100
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  
  // Audio options
  audioBitrate?: "128k" | "192k" | "256k" | "320k";
  
  // Video options
  videoPreset?: "quality" | "balanced" | "small";
  resolution?: "original" | "1080p" | "720p" | "480p";
  startTime?: string; // e.g. "00:00:05"
  duration?: string;  // e.g. "00:00:10"
  
  // PDF options
  pageRange?: string; // e.g. "1-5, 8, 11-13"
  rotateAngle?: 90 | 180 | 270;
  compressionLevel?: "low" | "medium" | "high";
  
  [key: string]: unknown;
}

export interface OutputArtifact {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url?: string;
  previewUrl?: string;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  outputFilename?: string;
  outputSize?: number;
  mimeType?: string;
  artifacts?: OutputArtifact[];
  error?: string;
}

export interface ConverterHandler {
  id: string;
  name: string;
  category: ConversionCategory;
  inputMimeTypes: string[];
  inputExtensions: string[];
  outputFormat: string;
  outputMimeType: string;
  outputExtension: string;
  maxSizeBytes: number; // Max input file size in bytes
  maxOutputSizeBytes?: number; // Max allowed output size in bytes
  maxPages?: number; // PDF page count safety limit
  maxDurationSeconds?: number; // Video/audio length safety limit
  resourceClass: ResourceClass;
  timeoutMs: number;
  convert: (
    inputPath: string,
    outputPath: string,
    options?: ConversionOptions
  ) => Promise<ConversionResult>;
}

export interface JobRecord {
  jobId: string;
  status: JobStatus;
  converterId: string;
  inputFilename: string;
  inputSize: number;
  inputMimeType: string;
  outputFormat: string;
  resourceClass: ResourceClass;
  outputFilename?: string;
  outputSize?: number;
  outputMimeType?: string;
  artifacts?: OutputArtifact[];
  hasPreviewDerivative?: boolean;
  previewDerivativeFilename?: string;
  options?: ConversionOptions;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  error?: string;
  progress?: number; // 0-100
  inputStoragePath?: string;
  outputStoragePath?: string;
  uploadSessionUrl?: string;
  isResumable?: boolean;
}
