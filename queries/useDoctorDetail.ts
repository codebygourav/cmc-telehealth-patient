import { useQuery } from "@tanstack/react-query";
import { getDoctorDetail } from "@/api/doctorDetails";
import type { DoctorDetailResponse } from "@/types/doctor-details";
import { useAuth } from "@/context/userContext";

export const doctorDetailKeys = {
  all: ["doctor-detail"] as const,
  detail: (userId: string) => [...doctorDetailKeys.all, userId] as const,
};

// Public: guests can view doctor details. initialData (from the server-rendered page) is shown at
// once — also while the auth state loads — and refreshed in the background.
export const useDoctorDetail = (userId: string, initialData?: DoctorDetailResponse) => {
  const { token, initializing } = useAuth();

  return useQuery<DoctorDetailResponse>({
    queryKey: [...doctorDetailKeys.detail(userId), token ? "auth" : "guest"],
    queryFn: () => getDoctorDetail({ userId }),
    enabled: !!userId && !initializing,
    placeholderData: (previous) => previous ?? initialData,
  });
};
