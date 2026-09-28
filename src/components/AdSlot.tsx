"use client";

import React, { useEffect, useState } from "react";
import { adConfig, AdPlacement } from "@/lib/advertising/ad-config";

interface AdSlotProps {
  placement?: AdPlacement;
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  placement = "afterConverter",
  slotId,
  format = "horizontal",
  className = "",
}) => {
  const [adBlockedOrFailed, setAdBlockedOrFailed] = useState(false);
  const publisherId = adConfig.clientId;
  const targetSlotId = slotId || (placement === "afterConverter" ? adConfig.topSlot : adConfig.bottomSlot);

  useEffect(() => {
    if (publisherId) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("Google AdSense push ignored or blocked:", e);
        setAdBlockedOrFailed(true);
      }
    }
  }, [publisherId]);

  // Dev mode or missing publisher ID: render subtle, non-intrusive placeholder
  if (!publisherId || adConfig.showPlaceholdersInDev) {
    return (
      <div
        className={`my-8 flex min-h-[90px] w-full max-w-4xl mx-auto flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4 text-center text-xs text-slate-400 backdrop-blur-sm ${className}`}
        aria-label="Advertisement Placeholder"
      >
        <span className="font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Advertisement
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          [ AdSense Banner Slot: {placement} ]
        </span>
      </div>
    );
  }

  if (adBlockedOrFailed) {
    return null; // Gracefully collapse container if ad blocker active
  }

  return (
    <div
      className={`my-8 flex min-h-[90px] w-full max-w-4xl mx-auto items-center justify-center overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/40 p-2 shadow-inner ${className}`}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "90px" }}
        data-ad-client={publisherId}
        data-ad-slot={targetSlotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
