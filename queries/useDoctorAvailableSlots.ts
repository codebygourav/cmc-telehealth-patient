import { useQuery } from "@tanstack/react-query";
import { getDoctorAvailableSlots } from "@/api/slots";

export const doctorSlotKeys = {
  all: ["doctor-available-slots"] as const,
  detail: (doctorId: string, appointmentId?: string) =>
    [...doctorSlotKeys.all, doctorId, appointmentId ?? null] as const,
};

export const useDoctorAvailableSlots = (
  doctorId: string,
  enabled: boolean,
  appointmentId?: string
) => {
  return useQuery({
    queryKey: doctorSlotKeys.detail(doctorId, appointmentId),
    queryFn: () => getDoctorAvailableSlots(doctorId, appointmentId),
    enabled: !!doctorId && enabled,
  });
};