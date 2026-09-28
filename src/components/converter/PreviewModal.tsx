"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  Loader2,
  Layers,
} from "lucide-react";
import { BatchItem, formatBytes } from "./types";

interface PreviewModalProps {
  item: BatchItem | null;
  allItems: BatchItem[];
  onClose: () => void;
  onSelectAnotherItem: (item: BatchItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  item,
  allItems,
  onClose,
  onSelectAnotherItem,
}) => {
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [textContent, setTextContent] = useState<{ text: string; truncated: boolean } | null>(null);
  const [textLoading, setTextLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const completedItems = allItems.filter((i) => i.stage === "completed" && i.resultData);
  const currentIndex = item ? completedItems.findIndex((i) => i.id === item.id) : -1;

  // Reset page/artifact index & zoom when switching item
  useEffect(() => {
    setSelectedArtifactIndex(0);
    setZoomLevel(1);
    setPreviewError(null);
    setTextContent(null);
  }, [item?.id]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          onSelectAnotherItem(completedItems[currentIndex - 1]);
        }
      } else if (e.key === "ArrowRight") {
        if (currentIndex < completedItems.length - 1) {
          onSelectAnotherItem(completedItems[currentIndex + 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, completedItems, onClose, onSelectAnotherItem]);

  // Lock body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!item || !item.resultData) return null;

  const { file, resultData } = item;
  const artifacts = resultData.artifacts || [];
  const currentArtifact = artifacts[selectedArtifactIndex];

  const targetFilename = currentArtifact ? currentArtifact.filename : resultData.outputFilename;
  const targetSize = currentArtifact ? currentArtifact.size : resultData.outputSize;
  const targetDownloadUrl = currentArtifact?.url || resultData.downloadUrl;

  // Determine preview URL
  const previewUrl = currentArtifact?.previewUrl || resultData.previewUrl || `/api/preview/${item.jobId}`;

  // Extension & Output classification
  const ext = targetFilename.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext);
  const isPdf = ext === "pdf";
  const isOffice = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext);
  const isVideo = ["mp4", "webm", "mov"].includes(ext);
  const isAudio = ["mp3", "wav", "ogg", "aac", "flac"].includes(ext);
  const isText = ["txt", "log", "json", "csv"].includes(ext);

  // Lazy text loader
  useEffect(() => {
    if (isText && !textContent && !textLoading) {
      setTextLoading(true);
      fetch(previewUrl)
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to load text preview.");
          const text = await res.text();
          const MAX_CHARS = 100000;
          if (text.length > MAX_CHARS) {
            setTextContent({ text: text.slice(0, MAX_CHARS), truncated: true });
          } else {
            setTextContent({ text, truncated: false });
          }
        })
        .catch((err) => {
          setPreviewError(err.message || "Failed to load text content.");
        })
        .finally(() => {
          setTextLoading(false);
        });
    }
  }, [isText, previewUrl, textContent, textLoading]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md p-3 sm:p-6"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-3">
        {/* Left: Title & File details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id="preview-title" className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
              {targetFilename}
            </h3>
            <span className="text-xs bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono uppercase">
              {ext}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Size: <strong className="text-emerald-400 font-medium">{formatBytes(targetSize)}</strong></span>
            {file.size > 0 && targetSize > 0 && (
              <span>(Original: {formatBytes(file.size)})</span>
            )}
            {completedItems.length > 1 && (
              <span className="text-slate-500">• {currentIndex + 1} of {completedItems.length} results</span>
            )}
          </div>
        </div>

        {/* Center: Multi-artifact page switcher (if > 1 pages) */}
        {artifacts.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Page:
            </span>
            <select
              value={selectedArtifactIndex}
              onChange={(e) => setSelectedArtifactIndex(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-2 py-1 font-medium focus:outline-none focus:border-cyan-500"
            >
              {artifacts.map((art, idx) => (
                <option key={art.id || idx} value={idx}>
                  Page {idx + 1} of {artifacts.length} ({formatBytes(art.size)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Actions (Download & Close) */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={targetDownloadUrl}
            download={targetFilename}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 p-2 sm:p-4">
        {/* Navigation Arrow: Previous Result in batch */}
        {completedItems.length > 1 && currentIndex > 0 && (
          <button
            type="button"
            onClick={() => onSelectAnotherItem(completedItems[currentIndex - 1])}
            className="absolute left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-xl border border-slate-700 hover:bg-cyan-500 hover:border-cyan-400 transition"
            title="Previous completed file (Left Arrow)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Navigation Arrow: Next Result in batch */}
        {completedItems.length > 1 && currentIndex < completedItems.length - 1 && (
          <button
            type="button"
            onClick={() => onSelectAnotherItem(completedItems[currentIndex + 1])}
            className="absolute right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-xl border border-slate-700 hover:bg-cyan-500 hover:border-cyan-400 transition"
            title="Next completed file (Right Arrow)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* 1. Raster Image Viewer with Zoom & Transparency Checkerboard */}
        {isImage && (
          <div className="relative h-full w-full flex items-center justify-center overflow-auto p-4">
            {/* Checkerboard container for transparent PNG/WEBP */}
            <div
              className="relative max-h-full max-w-full rounded-xl shadow-2xl overflow-hidden bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <img
                src={previewUrl}
                alt={targetFilename}
                className="max-h-[70vh] max-w-full object-contain select-none"
              />
            </div>

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1.5 shadow-xl backdrop-blur">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-xs font-mono text-cyan-300 hover:underline"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PDF Viewer (or Office Document rendered via PDF derivative) */}
        {(isPdf || isOffice) && (
          <div className="h-full w-full flex flex-col">
            {isOffice && (
              <div className="mb-2 text-xs text-cyan-300/80 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-lg">
                Displaying high-fidelity PDF preview derived from {targetFilename}. The downloaded file remains original {ext.toUpperCase()}.
              </div>
            )}
            <iframe
              src={`${previewUrl}#toolbar=1`}
              title={targetFilename}
              className="h-full w-full rounded-xl border border-slate-800 bg-white"
            />
          </div>
        )}

        {/* 3. Browser-Playable Video Player (NO autoplay, full controls & seeking) */}
        {isVideo && (
          <div className="flex flex-col items-center justify-center p-4">
            <video
              controls
              preload="metadata"
              className="max-h-[70vh] max-w-full rounded-xl border border-slate-800 shadow-2xl bg-black"
            >
              <source src={previewUrl} type={`video/${ext === "mov" ? "mp4" : ext}`} />
              Your browser does not support HTML5 video preview.
            </video>
          </div>
        )}

        {/* 4. Browser-Playable Audio Player (NO autoplay, seekable) */}
        {isAudio && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <FileText className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-white mb-1 truncate max-w-xs">{targetFilename}</h4>
              <p className="text-xs text-slate-400">{formatBytes(targetSize)} • {ext.toUpperCase()}</p>
            </div>
            <audio controls preload="metadata" className="w-full">
              <source src={previewUrl} type={`audio/${ext === "mp3" ? "mpeg" : ext}`} />
              Your browser does not support HTML5 audio preview.
            </audio>
          </div>
        )}

        {/* 5. Plain Text Viewer */}
        {isText && (
          <div className="h-full w-full flex flex-col p-2">
            {textLoading && (
              <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> Loading text content...
              </div>
            )}
            {textContent && (
              <div className="flex-1 flex flex-col min-h-0">
                {textContent.truncated && (
                  <div className="mb-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Notice: Text truncated to first 100 KB for preview performance. Download the file for full contents.
                  </div>
                )}
                <pre className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 select-text whitespace-pre-wrap">
                  {textContent.text}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 6. Unsupported Preview Format Fallback */}
        {!isImage && !isPdf && !isOffice && !isVideo && !isAudio && !isText && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Preview Unavailable</h4>
              <p className="text-xs text-slate-400">
                Visual preview is not supported for <strong className="text-slate-200">.{ext}</strong> files in browser. Your converted file is ready and fully downloadable.
              </p>
            </div>
            <a
              href={targetDownloadUrl}
              download={targetFilename}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-500/20 hover:opacity-95 transition"
            >
              <Download className="h-4 w-4" /> Download {targetFilename}
            </a>
          </div>
        )}
      </div>

      {/* Mobile multi-artifact bar */}
      {artifacts.length > 1 && (
        <div className="sm:hidden flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Page {selectedArtifactIndex + 1} of {artifacts.length}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={selectedArtifactIndex === 0}
              onClick={() => setSelectedArtifactIndex((i) => Math.max(0, i - 1))}
              className="px-2.5 py-1 rounded bg-slate-800 text-white disabled:opacity-40"
            >
              Prev Page
            </button>
            <button
              type="button"
              disabled={selectedArtifactIndex === artifacts.length - 1}
              onClick={() => setSelectedArtifactIndex((i) => Math.min(artifacts.length - 1, i + 1))}
              className="px-2.5 py-1 rounded bg-slate-800 text-white disabled:opacity-40"
            >
              Next Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
