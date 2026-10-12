import DoctorProfile from "./DoctorProfileClient";
import type { DoctorDetailResponse } from "@/types/doctor-details";
import { fetchForVisitor } from "@/lib/serverApi";

// The doctor is fetched on the server, as whoever is looking, so the profile in the first HTML
// already shows that patient's fees and slots (no skeleton, and nothing switches after load).
export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialData = id
    ? await fetchForVisitor<DoctorDetailResponse>(`/patient/browse-doctor/${encodeURIComponent(id)}`)
    : undefined;
  return <DoctorProfile id={id} initialData={initialData} />;
}
