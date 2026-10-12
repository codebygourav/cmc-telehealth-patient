import { cookies } from "next/headers";

/**
 * Server-side API read for the page's first HTML, made as whoever is looking: a logged-in
 * patient's request carries their token (from the login cookie), so the page is rendered with
 * their own data and prices at once and nothing changes after the browser takes over.
 * Guests get the public response, cached for 60 s.
 */
export async function fetchForVisitor<T>(path: string): Promise<T | undefined> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return undefined;

  let token: string | undefined;
  try {
    const store = await cookies();
    const isPatient = store.get("patient_role")?.value === "patient";
    const raw = store.get("patient_token")?.value;
    token = isPatient && raw ? decodeURIComponent(raw) : undefined;
  } catch {
    token = undefined;
  }

  try {
    const res = await fetch(`${base}${path}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // A patient's response is theirs alone: never stored or shared between visitors.
      ...(token ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
      signal: AbortSignal.timeout(5000),
    });

    return res.ok ? ((await res.json()) as T) : undefined;
  } catch {
    return undefined; // the page loads it in the browser instead
  }
}
