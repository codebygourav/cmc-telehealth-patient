import api from "@/lib/axios";
import { AppointmentListResponse } from "@/types/appointment";

export const fetchAppointments = async (
    filter: "today" | "upcoming" | "past" | "pending_payment",
    page: number = 1
): Promise<AppointmentListResponse> => {
    const { data } = await api.get(`/appointments/my?filter=${filter}&page=${page}`);
    return data;
};

// Delete an unpaid booking (slot chosen but payment not completed). Removed from the database.
export const deleteUnpaidAppointment = async (appointmentId: string) => {
    const { data } = await api.delete(`/appointments/${appointmentId}`);
    return data;
};  