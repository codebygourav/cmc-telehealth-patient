import DoctorProfile from "./DoctorProfileClient";
import type { DoctorDetailResponse } from "@/types/doctor-details";
import { fetchForVisitor } from "@/lib/serverApi";
import { permanentRedirect } from "next/navigation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The doctor is fetched on the server, as whoever is looking, so the profile in the first HTML
// already shows that patient's fees and slots (no skeleton, and nothing switches after load).
// Old links by id (/find-doctors/848f…) move to the doctor's name address (/find-doctors/dr-bobby-john).
export default async function DoctorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const initialData = id
    ? await fetchForVisitor<DoctorDetailResponse>(`/patient/browse-doctor/${encodeURIComponent(id)}`)
    : undefined;

  const slug = initialData?.data?.slug;
  if (UUID.test(id) && slug && slug !== id && !UUID.test(slug)) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      for (const v of Array.isArray(value) ? value : value != null ? [value] : []) query.append(key, v);
    }
    const qs = query.toString();
    permanentRedirect(`/find-doctors/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`);
  }

  return <DoctorProfile id={id} initialData={initialData} />;
}
