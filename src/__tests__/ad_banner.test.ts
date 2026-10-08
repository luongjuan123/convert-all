import assert from "node:assert";
import test, { describe } from "node:test";
import { adConfig, formatPublisherId } from "../lib/advertising/ad-config";
import { DEFAULT_CONSENT_SETTINGS } from "../lib/advertising/consent";
import { GET as getAdsTxt } from "../app/ads.txt/route";
import { TOOLS_LIST } from "../config/site";

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

  test("Publisher ID Formatter handles all standard Google AdSense variations", () => {
    const rawDigits = "9876543210987654";

    // 1. Full ca-pub- format
    const withCaPub = formatPublisherId(`ca-pub-${rawDigits}`);
    assert.strictEqual(withCaPub.isValid, true);
    assert.strictEqual(withCaPub.pubId, `pub-${rawDigits}`);
    assert.strictEqual(withCaPub.clientTag, `ca-pub-${rawDigits}`);

    // 2. pub- format
    const withPub = formatPublisherId(`pub-${rawDigits}`);
    assert.strictEqual(withPub.isValid, true);
    assert.strictEqual(withPub.pubId, `pub-${rawDigits}`);
    assert.strictEqual(withPub.clientTag, `ca-pub-${rawDigits}`);

    // 3. Raw numeric string
    const rawNumber = formatPublisherId(rawDigits);
    assert.strictEqual(rawNumber.isValid, true);
    assert.strictEqual(rawNumber.pubId, `pub-${rawDigits}`);
    assert.strictEqual(rawNumber.clientTag, `ca-pub-${rawDigits}`);

    // 4. Invalid or empty
    const empty = formatPublisherId("");
    assert.strictEqual(empty.isValid, false);
    assert.strictEqual(empty.pubId, "");

    const invalid = formatPublisherId("not-a-publisher-id");
    assert.strictEqual(invalid.isValid, false);
  });

  test("ads.txt Route responds with valid headers and format", async () => {
    const response = await getAdsTxt();
    assert.strictEqual(response.status, 200);

    const contentType = response.headers.get("Content-Type");
    assert.ok(contentType?.includes("text/plain"), "ads.txt must have text/plain Content-Type");

    const cacheControl = response.headers.get("Cache-Control");
    assert.ok(cacheControl?.includes("public"), "ads.txt should be publicly cached");

    const text = await response.text();
    assert.ok(text.includes("google.com"), "ads.txt must reference google.com");
    assert.ok(text.includes("f08c47fec0942fa0"), "ads.txt must contain the official Google certification authority ID");
  });

  test("Google Consent Mode v2 Default Settings comply with EU User Consent Policy", () => {
    assert.strictEqual(DEFAULT_CONSENT_SETTINGS.ad_storage, "granted");
    assert.strictEqual(DEFAULT_CONSENT_SETTINGS.ad_user_data, "granted");
    assert.strictEqual(DEFAULT_CONSENT_SETTINGS.ad_personalization, "granted");
    assert.strictEqual(DEFAULT_CONSENT_SETTINGS.analytics_storage, "granted");
    assert.strictEqual(DEFAULT_CONSENT_SETTINGS.wait_for_update, 500);
  });

  test("Content Depth & Anti-Thin-Content Policy: All 24 tools have substantive FAQs and guides", () => {
    assert.strictEqual(TOOLS_LIST.length, 24, "Expected 24 high-intent converter tools");

    for (const tool of TOOLS_LIST) {
      assert.ok(tool.title.length > 0, `Tool ${tool.slug} must have a title`);
      assert.ok(tool.shortDescription.length > 20, `Tool ${tool.slug} must have a detailed description`);
      assert.ok(tool.howItWorks && tool.howItWorks.length >= 3, `Tool ${tool.slug} must have at least 3 how-it-works steps`);
      assert.ok(
        tool.faq && tool.faq.length >= 3,
        `Tool ${tool.slug} must have at least 3 FAQs to prevent low-value content AdSense rejection (found ${tool.faq?.length || 0})`
      );
      for (const faqItem of tool.faq) {
        assert.ok(faqItem.question.length > 10, `FAQ question too short in ${tool.slug}`);
        assert.ok(faqItem.answer.length > 20, `FAQ answer too short in ${tool.slug}`);
      }
    }
  });
});

