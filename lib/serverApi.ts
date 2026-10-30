import { cookies, headers } from "next/headers";

/**
 * Server-side API read for the page's first HTML, made as whoever is looking: a logged-in
 * patient's request carries their token (from the login cookie), so the page is rendered with
 * their own data and prices at once and nothing changes after the browser takes over.
 * For guests, client IP and country headers are forwarded to ensure IP-based pricing accuracy.
 */
export async function fetchForVisitor<T>(
  path: string,
  options?: { searchParams?: Record<string, string | string[] | undefined> }
): Promise<T | undefined> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return undefined;

  let token: string | undefined;
  const forwardedHeaders: Record<string, string> = {};

  try {
    const store = await cookies();
    const isPatient = store.get("patient_role")?.value === "patient";
    const raw = store.get("patient_token")?.value;
    token = isPatient && raw ? decodeURIComponent(raw) : undefined;
  } catch {
    token = undefined;
  }

  try {
    const reqHeaders = await headers();
    for (const h of [
      "x-forwarded-for",
      "x-real-ip",
      "cf-ipcountry",
      "cloudfront-viewer-country",
      "x-vercel-ip-country",
      "x-country-iso",
      "x-country-code",
    ]) {
      const val = reqHeaders.get(h);
      if (val) forwardedHeaders[h] = val;
    }
  } catch {
    // ignore
  }

  // If testing country parameter exists in searchParams, forward as header and query
  const spCountry = options?.searchParams?.country || options?.searchParams?.country_iso;
  const countryCode = typeof spCountry === "string" ? spCountry.trim().toUpperCase() : undefined;
  if (countryCode) {
    forwardedHeaders["x-country-iso"] = countryCode;
    forwardedHeaders["x-country-code"] = countryCode;
  }

  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (countryCode && !url.searchParams.has("country_iso")) {
    url.searchParams.set("country_iso", countryCode);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...forwardedHeaders,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    return res.ok ? ((await res.json()) as T) : undefined;
  } catch {
    return undefined; // the page loads it in the browser instead
  }
}
