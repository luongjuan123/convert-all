import assert from "node:assert";
import test, { describe } from "node:test";
import { adConfig } from "../lib/advertising/ad-config";

describe("Google AdSense Advertising Integration Tests", () => {
  test("Ad Strategy: Max 1 ad on homepage, Max 2 ads on converter pages", () => {
    assert.strictEqual(adConfig.maxAdsOnHomepage, 1);
    assert.strictEqual(adConfig.maxAdsPerConverterPage, 2);
  });

  test("Centralized Ad Configuration", () => {
    assert.ok(typeof adConfig.enabled === "boolean");
    assert.ok(typeof adConfig.topSlot === "string");
    assert.ok(typeof adConfig.bottomSlot === "string");
  });
});
