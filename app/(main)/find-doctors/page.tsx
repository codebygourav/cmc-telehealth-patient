import FindDoctors from "./FindDoctorsClient";
import type { BrowseDoctorsResponse } from "@/types/browse-doctors";
import { fetchForVisitor } from "@/lib/serverApi";

// Doctors are fetched on the server, as whoever is looking, so the list in the first HTML already
// has the right doctors, order and prices (no skeleton, and nothing switches after load).
export default async function FindDoctorsPage() {
  const initialData = await fetchForVisitor<BrowseDoctorsResponse>("/patient/browse-doctors");
  return <FindDoctors initialData={initialData} />;
}
