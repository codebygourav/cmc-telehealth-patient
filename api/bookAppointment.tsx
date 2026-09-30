import axiosInstance from "@/lib/axios";
import type {
  BookAppointmentPayload,
  BookAppointmentResponse,
} from "@/types/book-appointment";

export const bookAppointment = async (
  payload: BookAppointmentPayload
): Promise<BookAppointmentResponse> => {
  const formData = new FormData();

  formData.append("doctor_id", payload.doctor_id);
  formData.append("availability_id", payload.availability_id);
  formData.append("appointment_date", payload.appointment_date);
  formData.append("appointment_time", payload.appointment_time);
  formData.append("consultation_type", payload.consultation_type);
  formData.append("opd_type", payload.opd_type);

  if (payload.notes) {
    formData.append("notes", payload.notes);
  }

  // Optional "booked by / booked for" details
  const bookingFor = {
    booked_by_name: payload.booked_by_name,
    booked_for_name: payload.booked_for_name,
    booked_for_uid: payload.booked_for_uid,
    booked_for_gender: payload.booked_for_gender,
    booked_for_age: payload.booked_for_age,
    booked_for_phone: payload.booked_for_phone,
  };
  Object.entries(bookingFor).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      formData.append(key, String(value).trim());
    }
  });

  const response = await axiosInstance.post<BookAppointmentResponse>(
    "/book-appointment",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};