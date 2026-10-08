"use client";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type ConsentStatus = "granted" | "denied";

export interface ConsentSettings {
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
  analytics_storage: ConsentStatus;
  wait_for_update?: number;
}

export const DEFAULT_CONSENT_SETTINGS: ConsentSettings = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  wait_for_update: 500,
};

// Google Consent Mode v2 initialization helper
export function initGoogleConsentMode(settings: Partial<ConsentSettings> = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }

  const merged = { ...DEFAULT_CONSENT_SETTINGS, ...settings };
  gtag("consent", "default", merged);
}

export function updateGoogleConsent(settings: Partial<ConsentSettings>) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }

  gtag("consent", "update", settings);
}


