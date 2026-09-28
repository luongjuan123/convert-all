"use client";

import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  File as FileGeneric,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Eye,
  Download,
  RotateCcw,
  Trash2,
  Sparkles,
  Layers,
} from "lucide-react";
import { BatchItem, formatBytes } from "./types";

interface FileItemRowProps {
  item: BatchItem;
  onPreview: (item: BatchItem) => void;
  onStart: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onConverterChange: (id: string, converterId: string) => void;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg", "heic"].includes(ext)) {
    return <ImageIcon className="h-5 w-5 text-cyan-400" />;
  }
  if (["mp4", "mkv", "mov", "webm", "avi"].includes(ext)) {
    return <Video className="h-5 w-5 text-indigo-400" />;
  }
  if (["mp3", "wav", "aac", "ogg", "flac"].includes(ext)) {
    return <Music className="h-5 w-5 text-amber-400" />;
  }
  if (["pdf", "docx", "doc", "txt", "pptx", "xlsx"].includes(ext)) {
    return <FileText className="h-5 w-5 text-rose-400" />;
  }
  return <FileGeneric className="h-5 w-5 text-slate-400" />;
}

export const FileItemRow: React.FC<FileItemRowProps> = ({
  item,
  onPreview,
  onStart,
  onCancel,
  onRetry,
  onRemove,
  onConverterChange,
}) => {
  const { file, stage, progress, uploadStats, resultData, error, errorStage } = item;

  // Calculate size change percentage if completed
  let sizeDiffBadge = null;
  if (resultData && file.size > 0 && resultData.outputSize > 0) {
    const diff = resultData.outputSize - file.size;
    const pct = Math.round((Math.abs(diff) / file.size) * 100);
    if (diff < 0) {
      sizeDiffBadge = (
        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
          -{pct}%
        </span>
      );
    } else if (diff > 0) {
      sizeDiffBadge = (
        <span className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-medium">
          +{pct}%
        </span>
      );
    }
  }

  const multiArtifactCount = resultData?.artifacts?.length || 0;

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90">
      {/* Left side: Icon + Names + Size */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
          {getFileIcon(file.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-sm" title={file.name}>
              {file.name}
            </span>
            <span className="text-xs text-slate-400 shrink-0">({formatBytes(file.size)})</span>
          </div>

          {/* Subtitle / Processing information */}
          {stage === "pending" && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-400">Target:</span>
              {item.availableConverters.length > 0 ? (
                <select
                  value={item.converterId}
                  onChange={(e) => onConverterChange(item.id, e.target.value)}
                  className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-xs font-medium text-cyan-300 focus:outline-none focus:border-cyan-500"
                >
                  {item.availableConverters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.outputFormat.toUpperCase()} ({c.name})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-400">Detecting converters...</span>
              )}
            </div>
          )}

          {stage === "queued" && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Waiting for available slot...
            </div>
          )}

          {(stage === "session" || stage === "uploading") && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-cyan-400 font-medium">Uploading {progress}%</span>
                <span>
                  {uploadStats.speedMbPerSec > 0 && `${uploadStats.speedMbPerSec.toFixed(1)} MB/s • `}
                  {formatBytes(uploadStats.uploadedBytes)} / {formatBytes(uploadStats.totalBytes)}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {stage === "verifying" && (
            <div className="mt-1 flex items-center gap-2 text-xs text-cyan-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying uploaded file...
            </div>
          )}

          {stage === "converting" && (
            <div className="mt-1 flex items-center gap-2 text-xs text-blue-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Converting file on server...
            </div>
          )}

          {stage === "completed" && resultData && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium">{resultData.outputFilename}</span>
              <span className="text-slate-400">({formatBytes(resultData.outputSize)})</span>
              {sizeDiffBadge}
              {multiArtifactCount > 1 && (
                <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[11px] font-medium">
                  <Layers className="h-3 w-3" /> {multiArtifactCount} pages
                </span>
              )}
            </div>
          )}

          {stage === "failed" && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" title={error}>
                {error || "Conversion failed."}
              </span>
            </div>
          )}

          {stage === "cancelled" && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <XCircle className="h-3.5 w-3.5 text-amber-400" /> Cancelled
            </div>
          )}
        </div>
      </div>

      {/* Right side: Action controls */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {stage === "pending" && (
          <>
            <button
              type="button"
              onClick={() => onStart(item.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Convert
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}

        {(stage === "queued" || stage === "session" || stage === "uploading" || stage === "verifying") && (
          <button
            type="button"
            onClick={() => onCancel(item.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 px-3 py-1.5 text-xs font-medium transition"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        )}

        {stage === "completed" && resultData && (
          <>
            <button
              type="button"
              onClick={() => onPreview(item)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 px-3 py-1.5 text-xs font-semibold shadow-sm transition"
              title="Preview converted file"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" /> Preview
            </button>
            <a
              href={resultData.downloadUrl}
              download={resultData.outputFilename}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
              title="Download converted file"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
              title="Clear from list"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {(stage === "failed" || stage === "cancelled") && (
          <>
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
