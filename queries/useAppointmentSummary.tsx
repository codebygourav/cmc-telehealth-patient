import { useQuery } from "@tanstack/react-query";
import { getAppointmentDetail } from "@/api/appointmentSummary";
import type { AppointmentDetailResponse } from "@/types/appointment-summary";

export const appointmentDetailKeys = {
  all: ["appointment-detail"] as const,
  detail: (appointmentId: string) =>
    [...appointmentDetailKeys.all, appointmentId] as const,
};

export const useAppointmentDetail = (appointmentId: string) => {
  return useQuery<AppointmentDetailResponse>({
    queryKey: appointmentDetailKeys.detail(appointmentId),
    queryFn: () => getAppointmentDetail({ appointmentId }),
    enabled: !!appointmentId,
    // Opened from a WhatsApp / email link the browser can briefly report "offline": fetch anyway
    // instead of pausing (which left the page on "Loading…").
    networkMode: "always",
    retry: 2,
  });
};