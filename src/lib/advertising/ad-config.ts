export type AdPlacement = "afterConverter" | "beforeFooter" | "homepageBottom";

export interface AdConfig {
  enabled: boolean;
  clientId: string;
  topSlot: string;
  bottomSlot: string;
  showPlaceholdersInDev: boolean;
  maxAdsPerConverterPage: number;
  maxAdsOnHomepage: number;
}

/**
 * Normalizes any variation of an AdSense publisher ID into standard forms:
 * Handles: "ca-pub-1234567890123456", "pub-1234567890123456", or "1234567890123456"
 */
export function formatPublisherId(rawId?: string): {
  pubId: string;       // e.g. "pub-1234567890123456" (used for ads.txt)
  clientTag: string;   // e.g. "ca-pub-1234567890123456" (used for data-ad-client and script param)
  rawDigits: string;   // e.g. "1234567890123456"
  isValid: boolean;
} {
  if (!rawId || typeof rawId !== "string") {
    return { pubId: "", clientTag: "", rawDigits: "", isValid: false };
  }
  const trimmed = rawId.trim();
  const digitsOnly = trimmed.replace(/^(ca-)?pub-/, "").replace(/[^0-9]/g, "");
  if (!digitsOnly) {
    return { pubId: "", clientTag: "", rawDigits: "", isValid: false };
  }
  return {
    pubId: `pub-${digitsOnly}`,
    clientTag: `ca-pub-${digitsOnly}`,
    rawDigits: digitsOnly,
    isValid: digitsOnly.length >= 10,
  };
}

const rawClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
const formattedPub = formatPublisherId(rawClientId);

export const adConfig: AdConfig = {
  enabled: Boolean(rawClientId || process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "true"),
  clientId: formattedPub.isValid ? formattedPub.clientTag : rawClientId,
  topSlot: process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT || "6763399568",
  bottomSlot: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT || "5901744038",
  showPlaceholdersInDev:
    process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "true" ||
    (process.env.NODE_ENV === "development" && !rawClientId),
  maxAdsPerConverterPage: 2,
  maxAdsOnHomepage: 1,
};

