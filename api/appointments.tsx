import api from "@/lib/axios";
import { AppointmentListResponse } from "@/types/appointment";

export interface AppointmentListOptions {
    search?: string;
    status?: string;            // "all" or a status value
    consultationType?: string;  // "all" | "video" | "in-person"
    perPage?: number | "all";
    hideCancelled?: boolean;
}

/** Tab, search, status, type and page size are applied by the server over every appointment. */
export const fetchAppointments = async (
    filter: "all" | "today" | "upcoming" | "past" | "pending_payment",
    page: number = 1,
    options: AppointmentListOptions = {}
): Promise<AppointmentListResponse> => {
    const params: Record<string, string | number> = { filter, page };
    if (options.search?.trim()) params.search = options.search.trim();
    if (options.status && options.status !== "all") params.status = options.status;
    if (options.consultationType && options.consultationType !== "all") params.consultation_type = options.consultationType;
    if (options.perPage) params.per_page = options.perPage;
    if (options.hideCancelled) params.hide_cancelled = 1;
    const { data } = await api.get(`/appointments/my`, { params });
    return data;
};

// Delete an unpaid booking (slot chosen but payment not completed). Removed from the database.
export const deleteUnpaidAppointment = async (appointmentId: string) => {
    const { data } = await api.delete(`/appointments/${appointmentId}`);
    return data;
};  
