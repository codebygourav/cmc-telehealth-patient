/**
 * Pricing test mode: a secret link from Admin → International Payments lets staff book as an
 * Indian (₹ INR) or international ($ USD) patient. Saved in this browser only; the API checks the
 * secret, so a made-up value changes nothing.
 */
export type PricingTestMode = "international" | "domestic";

const KEY = "cmc_pricing_test";

export function getPricingTest(): { secret: string; mode: PricingTestMode } | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    if (value && typeof value.secret === "string" && (value.mode === "international" || value.mode === "domestic")) {
      return value;
    }
  } catch {
    // ignore broken value
  }
  return null;
}

export function setPricingTest(secret: string, mode: PricingTestMode): void {
  localStorage.setItem(KEY, JSON.stringify({ secret, mode }));
  window.dispatchEvent(new Event("pricing-test-change"));
}

export function clearPricingTest(): void {
  localStorage.removeItem(KEY);
  // Left over from the old, unprotected ?country= override.
  localStorage.removeItem("test_country_iso");
  window.dispatchEvent(new Event("pricing-test-change"));
}
