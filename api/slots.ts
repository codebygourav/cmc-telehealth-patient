import axiosInstance from "@/lib/axios";
import type { ApiResponse, RescheduleSchedule, SlotGroup } from "@/types/slots";

export const getDoctorAvailableSlots = async (
  doctorId: string,
  appointmentId?: string
): Promise<ApiResponse<SlotGroup[]> & { schedule?: RescheduleSchedule }> => {
  // With an appointment: only slots of its own schedule (video / general OPD / private OPD).
  const response = await axiosInstance.get<ApiResponse<SlotGroup[]> & { schedule?: RescheduleSchedule }>(
    `/doctor/${doctorId}/get-slot-detail`,
    { params: appointmentId ? { appointment_id: appointmentId } : undefined }
  );

  return response.data;
};