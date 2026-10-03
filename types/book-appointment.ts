export interface BookAppointmentPayload {
  doctor_id: string;
  availability_id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  opd_type: string;
  notes?: string;
  // Who booked + who the appointment is for (a family member gets their own patient profile).
  booked_by_name?: string;
  booked_for_name?: string;
  booked_for_uid?: string;
  booked_for_gender?: "male" | "female" | "other";
  booked_for_age?: number;
  booked_for_phone?: string;
  booked_for_relationship?: string;
  // A saved family profile (managed by this login) the appointment is for.
  patient_profile_id?: string;
}

export interface BookAppointmentData {
  appointment: {
    id: string;
    slug: string;
    date: string;
    time: string;
    status: string;
  };
  payment: {
    status: string;
    order_id: string;
    payment_id: string | null;
    amount: string;
    amount_paise: number;
    razorpay_key_id: string;
  };
  // Optional fields for UI compatibility
  consultation_type?: string;
  opd_type?: string;
}

export interface BookAppointmentResponse {
  success: boolean;
  message: string;
  path?: string;
  timestamp?: string;
  data?: BookAppointmentData;
}