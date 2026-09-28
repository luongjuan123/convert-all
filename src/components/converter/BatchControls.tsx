"use client";

import React from "react";
import {
  Sparkles,
  Plus,
  Archive,
  XCircle,
  RotateCcw,
  Trash2,
  Sliders,
} from "lucide-react";

interface BatchControlsProps {
  counts: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    running: number;
  };
  commonFormats: string[];
  selectedBatchFormat: string;
  onBatchFormatChange: (format: string) => void;
  onConvertAll: () => void;
  onAddMore: () => void;
  onDownloadZip: () => void;
  onCancelAll: () => void;
  onRetryFailed: () => void;
  onClearCompleted: () => void;
}

export const BatchControls: React.FC<BatchControlsProps> = ({
  counts,
  commonFormats,
  selectedBatchFormat,
  onBatchFormatChange,
  onConvertAll,
  onAddMore,
  onDownloadZip,
  onCancelAll,
  onRetryFailed,
  onClearCompleted,
}) => {
  const { total, completed, failed, pending, running } = counts;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      {/* Status Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800/60 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-white">{total} file{total !== 1 ? "s" : ""}</span>
          {completed > 0 && (
            <span className="text-emerald-400 font-medium">
              • {completed} ready
            </span>
          )}
          {running > 0 && (
            <span className="text-cyan-400 font-medium">
              • {running} processing
            </span>
          )}
          {pending > 0 && (
            <span className="text-slate-300">
              • {pending} pending
            </span>
          )}
          {failed > 0 && (
            <span className="text-rose-400 font-medium">
              • {failed} failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {completed > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
              title="Clear completed rows"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear finished
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons & Target Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Common Target Format Selector (if pending items exist and formats available) */}
        {pending > 0 && commonFormats.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sliders className="h-3 w-3" /> Target:
            </span>
            <select
              value={selectedBatchFormat}
              onChange={(e) => onBatchFormatChange(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Apply format to all pending...</option>
              {commonFormats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  Convert to {fmt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Main batch action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-4 w-4 text-cyan-400" /> Add Files
          </button>

          {failed > 0 && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-2 text-xs font-semibold transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry Failed ({failed})
            </button>
          )}

          {running > 0 && (
            <button
              type="button"
              onClick={onCancelAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 px-3.5 py-2 text-xs font-semibold transition"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel Running
            </button>
          )}

          {completed > 0 && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
              title="Download all ready files as a single ZIP archive"
            >
              <Archive className="h-4 w-4" /> Download Ready ({completed}) as ZIP
            </button>
          )}

          {pending > 0 && (
            <button
              type="button"
              onClick={onConvertAll}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 transition"
            >
              <Sparkles className="h-4 w-4" /> Convert All ({pending})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
