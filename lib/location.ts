import { COUNTRIES } from "@/constants/countries";

let cachedCountryName: string | null = null;

/**
 * Fetches the user's current location country name.
 * Uses IP lookup services with a timeout and graceful fallbacks.
 */
export async function getUserCountry(fallbackName: string = "India"): Promise<string> {
  if (cachedCountryName) {
    return cachedCountryName;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.country_name) {
        cachedCountryName = data.country_name;
        return data.country_name;
      }
    }
  } catch {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.countryName) {
          cachedCountryName = data.countryName;
          return data.countryName;
        }
      }
    } catch {
      // Fallthrough
    }
  }

  return fallbackName;
}

/**
 * Helper to get country ISO code from a country name.
 */
export function getCountryIsoFromName(countryName: string): string | null {
  if (!countryName) return null;
  const normalized = countryName.trim().toLowerCase();
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === normalized || c.iso.toLowerCase() === normalized
  );
  return found ? found.iso : null;
}
