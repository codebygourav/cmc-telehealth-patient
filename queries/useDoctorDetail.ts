import { useQuery } from "@tanstack/react-query";
import { getDoctorDetail } from "@/api/doctorDetails";
import type { DoctorDetailResponse } from "@/types/doctor-details";
import { useAuth } from "@/context/userContext";

export const doctorDetailKeys = {
  all: ["doctor-detail"] as const,
  detail: (userId: string) => [...doctorDetailKeys.all, userId] as const,
};

// Public: guests can view doctor details.
export const useDoctorDetail = (userId: string) => {
  const { token, initializing } = useAuth();

  return useQuery<DoctorDetailResponse>({
    queryKey: [...doctorDetailKeys.detail(userId), token ? "auth" : "guest"],
    queryFn: () => getDoctorDetail({ userId }),
    enabled: !!userId && !initializing,
  });
};