import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export const savedUnitIdKey = (userId?: string) => ["saved-unit-id", userId] as const;

// The logged-in patient's hospital Unit ID (C Number) saved on their profile in admin.
export const useSavedUnitId = (userId?: string) =>
  useQuery({
    queryKey: savedUnitIdKey(userId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/patient/${userId}/profile`, {
        params: { group: "personal_information" },
      });
      const value = response.data?.data?.existing_patient_id;
      return typeof value === "string" && value.trim() ? value.trim() : "";
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
