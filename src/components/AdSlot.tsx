"use client";

import React, { useEffect, useRef, useState } from "react";
import { adConfig, AdPlacement } from "@/lib/advertising/ad-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  placement?: AdPlacement;
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  placement = "afterConverter",
  slotId,
  format = "auto",
  className = "",
}) => {
  const [adStatus, setAdStatus] = useState<"loading" | "filled" | "unfilled" | "blocked">("loading");
  const insRef = useRef<HTMLModElement>(null);
  const publisherId = adConfig.clientId;
  const targetSlotId =
    slotId || (placement === "afterConverter" ? adConfig.topSlot : adConfig.bottomSlot);

  // Height reservation to eliminate Cumulative Layout Shift (CLS)
  const minHeightClass =
    format === "rectangle" ? "min-h-[280px]" : "min-h-[100px]";

  useEffect(() => {
    // Only attempt ad push if we have a real publisher ID and the <ins> element is in the DOM
    const insEl = insRef.current;
    if (!publisherId || !insEl || adConfig.showPlaceholdersInDev) {
      return;
    }

    // Check if already processed
    const currentStatus = insEl.getAttribute("data-ad-status");
    if (currentStatus === "unfilled") {
      setAdStatus("unfilled");
      return;
    }
    if (currentStatus === "filled") {
      setAdStatus("filled");
      return;
    }

    // Observe changes to data-ad-status by Google AdSense (e.g. unfilled / filled)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-ad-status") {
          const status = insEl.getAttribute("data-ad-status");
          if (status === "unfilled") {
            setAdStatus("unfilled");
          } else if (status === "filled") {
            setAdStatus("filled");
          }
        }
      }
    });

    observer.observe(insEl, { attributes: true, attributeFilter: ["data-ad-status"] });

    // Guard against duplicate adsbygoogle.push in React 19 / StrictMode / Next.js SPA transitions
    const status = insEl.getAttribute("data-adsbygoogle-status");
    if (status !== "done" && insEl.innerHTML.trim().length === 0) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (e) {
        console.warn("Google AdSense push ignored or blocked:", e);
        setAdStatus("blocked");
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [publisherId, targetSlotId, format]);

  // Dev mode or missing publisher ID: render subtle, non-intrusive placeholder
  if (!publisherId || adConfig.showPlaceholdersInDev) {
    return (
      <aside
        className={`my-8 flex ${minHeightClass} w-full max-w-4xl mx-auto flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4 text-center text-xs text-slate-400 backdrop-blur-sm ${className}`}
        aria-label="Advertisement Placeholder"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 select-none">
          Advertisement
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          [ AdSense Banner Slot: {placement} • {format} ]
        </span>
      </aside>
    );
  }

  // Gracefully collapse container if ad blocker is active, script failed, or Google returned unfilled
  if (adStatus === "blocked" || adStatus === "unfilled") {
    return null;
  }

  return (
    <aside
      className={`my-8 flex ${minHeightClass} w-full max-w-4xl mx-auto flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3 shadow-inner ${className}`}
      aria-label="Advertisement"
    >
      {/* Official AdSense compliant label */}
      <div className="w-full text-center mb-1.5 select-none">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Advertisement
        </span>
      </div>

      <div className="w-full flex justify-center items-center overflow-hidden">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={publisherId}
          data-ad-slot={targetSlotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
};

