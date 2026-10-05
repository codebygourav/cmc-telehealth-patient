import { getPrescriptionDetail } from "@/api/prescriptions";
import { useQuery } from "@tanstack/react-query";

export const PRESCRIPTION_DETAIL_QUERY_KEY = ["prescription_detail"] as const;

// live: during a video call, follow what the doctor adds (refetch every 15 s).
export function usePrescriptionDetail(appointmentID: string | undefined, options: { live?: boolean } = {}) {
  return useQuery({
    queryKey: [...PRESCRIPTION_DETAIL_QUERY_KEY, appointmentID],
    queryFn: () => getPrescriptionDetail(appointmentID!),
    enabled: !!appointmentID,
    staleTime: options.live ? 0 : 1000 * 60 * 5, // 5 minutes
    refetchInterval: options.live ? 15 * 1000 : false,
    refetchOnMount: options.live ? "always" : true,
  });
}
