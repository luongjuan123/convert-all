"use client";

// Google Consent Mode v2 initialization helper
export function initGoogleConsentMode() {
  if (typeof window === "undefined") return;

  // @ts-ignore
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    // @ts-ignore
    window.dataLayer.push(args);
  }

  // Set default Consent Mode v2 parameters
  gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
    wait_for_update: 500,
  });
}
