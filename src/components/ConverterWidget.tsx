"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  FileCheck,
  Download,
  RotateCcw,
  Sparkles,
  HardDrive,
  Eye,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useBatchConverter } from "@/hooks/useBatchConverter";
import { FileItemRow } from "./converter/FileItemRow";
import { BatchControls } from "./converter/BatchControls";
import { PreviewModal } from "./converter/PreviewModal";
import { BatchItem, formatBytes } from "./converter/types";

interface ConverterWidgetProps {
  defaultTargetFormat?: string;
  toolSlug?: string;
}

export const ConverterWidget: React.FC<ConverterWidgetProps> = ({
  defaultTargetFormat,
  toolSlug,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewingItem, setPreviewingItem] = useState<BatchItem | null>(null);
  const [selectedBatchFormat, setSelectedBatchFormat] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    addFiles,
    startConversion,
    cancelItem,
    cancelAll,
    retryItem,
    retryAllFailed,
    removeItem,
    clearCompleted,
    setItemConverter,
    setBatchTargetFormat,
    counts,
  } = useBatchConverter(defaultTargetFormat, toolSlug);

  // Compute common formats among pending items
  const commonFormats = useMemo(() => {
    const pendingItems = items.filter((i) => i.stage === "pending");
    if (pendingItems.length === 0) return [];

    const formatCounts = new Map<string, number>();
    for (const item of pendingItems) {
      const seenForThisItem = new Set<string>();
      for (const conv of item.availableConverters) {
        const fmt = conv.outputFormat.toLowerCase();
        if (!seenForThisItem.has(fmt)) {
          seenForThisItem.add(fmt);
          formatCounts.set(fmt, (formatCounts.get(fmt) || 0) + 1);
        }
      }
    }

    // Return formats supported by all or most pending items
    return Array.from(formatCounts.keys()).sort((a, b) => {
      return (formatCounts.get(b) || 0) - (formatCounts.get(a) || 0);
    });
  }, [items]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // Reset file input so selecting the same file again triggers change event
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBatchFormatChange = (fmt: string) => {
    setSelectedBatchFormat(fmt);
    setBatchTargetFormat(fmt);
  };

  const handleDownloadAllZip = () => {
    const completedJobIds = items
      .filter((i) => i.stage === "completed" && i.jobId)
      .map((i) => i.jobId!);

    if (completedJobIds.length === 0) return;

    const downloadUrl = `/api/download/batch?jobs=${completedJobIds.join(",")}`;
    window.location.href = downloadUrl;
  };

  // Keep preview item in sync if state changes (e.g. background job finish)
  const activePreviewItem = useMemo(() => {
    if (!previewingItem) return null;
    return items.find((i) => i.id === previewingItem.id) || previewingItem;
  }, [previewingItem, items]);

  return (
    <div className="mx-auto max-w-4xl w-full">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="relative rounded-3xl border border-slate-800 bg-slate-900/40 p-4 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300"
      >
        {/* State A: Empty (No files selected yet) */}
        {items.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center transition-all duration-300 ${
              dragActive
                ? "border-cyan-400 bg-cyan-950/20 scale-[0.99]"
                : "border-slate-800 hover:border-slate-700 bg-slate-950/30 hover:bg-slate-950/50"
            }`}
          >
            <div className="flex justify-center mb-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/80 text-cyan-400 shadow-inner group-hover:scale-105 transition">
                <UploadCloud className="h-10 w-10 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Choose files or drag & drop here
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Select multiple documents, images, audio, or video files to convert simultaneously.
            </p>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 transition"
            >
              <UploadCloud className="h-4 w-4" /> Browse Multiple Files
            </button>

            <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-cyan-400" /> Up to 2 GB per file
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-emerald-400" /> Instant previews & batch ZIP
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" /> 100% Anonymous & Private
              </span>
            </div>
          </div>
        )}

        {/* State B: Active Batch List (1 or more files) */}
        {items.length > 0 && (
          <div className="space-y-5">
            {/* Batch Action Controls */}
            <BatchControls
              counts={counts}
              commonFormats={commonFormats}
              selectedBatchFormat={selectedBatchFormat}
              onBatchFormatChange={handleBatchFormatChange}
              onConvertAll={() => startConversion()}
              onAddMore={() => fileInputRef.current?.click()}
              onDownloadZip={handleDownloadAllZip}
              onCancelAll={cancelAll}
              onRetryFailed={retryAllFailed}
              onClearCompleted={clearCompleted}
            />

            {/* Drag & Drop mini target strip */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border border-dashed py-3 px-4 text-center transition ${
                dragActive
                  ? "border-cyan-400 bg-cyan-950/30"
                  : "border-slate-800/80 bg-slate-950/20 hover:border-slate-700 hover:bg-slate-950/40"
              }`}
            >
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-cyan-400" /> Drop more files here or click to add
              </span>
            </div>

            {/* List of File Items */}
            <div className="space-y-2.5">
              {items.map((item) => (
                <FileItemRow
                  key={item.id}
                  item={item}
                  onPreview={(it) => setPreviewingItem(it)}
                  onStart={(id) => startConversion([id])}
                  onCancel={cancelItem}
                  onRetry={retryItem}
                  onRemove={removeItem}
                  onConverterChange={setItemConverter}
                />
              ))}
            </div>

            {/* Dedicated Single-Item Result Spotlight (when exactly 1 item and completed) */}
            {items.length === 1 && items[0].stage === "completed" && items[0].resultData && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Conversion Completed!</h4>
                <p className="text-xs text-slate-400 mb-4">
                  {items[0].resultData.outputFilename} ({formatBytes(items[0].resultData.outputSize)})
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewingItem(items[0])}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-5 py-2.5 text-sm font-semibold transition"
                  >
                    <Eye className="h-4 w-4" /> Preview Result
                  </button>
                  <a
                    href={items[0].resultData.downloadUrl}
                    download={items[0].resultData.outputFilename}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result Preview Modal */}
      {activePreviewItem && (
        <PreviewModal
          item={activePreviewItem}
          allItems={items}
          onClose={() => setPreviewingItem(null)}
          onSelectAnotherItem={(it) => setPreviewingItem(it)}
        />
      )}
    </div>
  );
};
