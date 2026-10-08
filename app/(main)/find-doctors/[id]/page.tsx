import DoctorProfile from "./DoctorProfileClient";
import type { DoctorDetailResponse } from "@/types/doctor-details";

// The doctor is fetched on the server so the profile is in the HTML at once (no skeleton while
// the app's JavaScript loads). Refreshed every 60 s; the client refreshes it in the background.
export const revalidate = 60;

async function getInitialDoctor(id: string): Promise<DoctorDetailResponse | undefined> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base || !id) return undefined;
  try {
    const res = await fetch(`${base}/patient/browse-doctor/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? ((await res.json()) as DoctorDetailResponse) : undefined;
  } catch {
    return undefined; // the page loads it in the browser as before
  }
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialData = await getInitialDoctor(id);
  return <DoctorProfile id={id} initialData={initialData} />;
}
