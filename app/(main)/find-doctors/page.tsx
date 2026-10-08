import FindDoctors from "./FindDoctorsClient";
import type { BrowseDoctorsResponse } from "@/types/browse-doctors";

// Doctors are fetched on the server so the list is in the HTML at once (no skeleton while the
// app's JavaScript loads). Refreshed every 60 s; the client refreshes it again in the background.
export const revalidate = 60;

async function getInitialDoctors(): Promise<BrowseDoctorsResponse | undefined> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return undefined;
  try {
    const res = await fetch(`${base}/patient/browse-doctors`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? ((await res.json()) as BrowseDoctorsResponse) : undefined;
  } catch {
    return undefined; // the page loads it in the browser as before
  }
}

export default async function FindDoctorsPage() {
  const initialData = await getInitialDoctors();
  return <FindDoctors initialData={initialData} />;
}
