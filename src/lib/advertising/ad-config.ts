import { siteConfig } from "@/config/site";

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

export const adConfig: AdConfig = {
  enabled: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "true"),
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
  topSlot: process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT || "1234567890",
  bottomSlot: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT || "0987654321",
  showPlaceholdersInDev: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "true",
  maxAdsPerConverterPage: 2,
  maxAdsOnHomepage: 1,
};
