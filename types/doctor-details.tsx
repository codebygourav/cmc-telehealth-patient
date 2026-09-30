export interface DoctorProfileInfo {
  name: string;
  avatar: string;
  department: string;
  years_experience: number | null;
  career_start_year?: string | number | null;
  // Qualifications line, e.g. "MBBS, MS (Orthopaedics)"
  sub_title?: string | null;
}

export interface DoctorAboutInfo {
  bio: string;
  description: string;
}

export interface DoctorEducationItem {
  degree: string;
  institution: string;
  completion_year?: string | null;
}

// One profile section saved in admin (Availability Notes, Memberships, Education, ...).
// The API only sends sections that have content.
export interface DoctorProfileSectionItem {
  title: string | null;
  subtitle: string | null;
  meta: string | null;
  description: string | null;
}

export type DoctorProfileSection =
  | { key: string; title: string; type: "html"; html: string }
  | { key: string; title: string; type: "list"; items: DoctorProfileSectionItem[] };

export interface DoctorConsultationFee {
  min: number;
  max: number;
}

export interface DoctorAppointmentTypes {
  in_person: boolean;
  video: boolean;
}

export interface DoctorReviewItem {
  id: string;
  patient_name: string;
  patient_image: string;
  patient_age: string;
  patient_location: string | null;
  title: string;
  content: string;
  rating: number;
  total_reviews: number;
  doctor_name: string;
  doctor_avatar: string;
  doctor_experience: string;
  doctor_departments: string;
  rating_stars: string;
  created_at: string;
}

export interface DoctorAvailabilitySlot {
  id: string;
  date: string;
  day_of_week: string;
  booking_start_time: string;
  start_time: string;
  end_time: string;
  consultation_type: string;
  consultation_type_label: string;
  capacity: number;
  booked_count: number;
  available: boolean;
  currency_symbol: string;
  consultation_fee: number;
  doctor_room: string | null;
  recurring_start_date: string;
  recurring_end_date: string;
  // Booking state from the API
  opd_type?: string | null;
  available_slots?: number;
  is_full?: boolean;
  // OPD session is over
  is_past?: boolean;
  // Online booking closed (X before the slot's start or end time, set in admin)
  is_booking_closed?: boolean;
  booking_closes_at?: string | null;
  is_child_only?: boolean;
  child_age?: number | null;
}

export interface DoctorAvailabilityItem {
  date: string;
  slots: DoctorAvailabilitySlot[];
}

export interface DoctorReviewSummary {
  average_rating: number;
  total_reviews: number;
}

export interface DoctorDetailData {
  id: string;
  // How many months (this month + next) patients can browse — admin setting
  availability_months?: number;
  slug: string;
  user_id: string;
  status: string;
  profile: DoctorProfileInfo;
  about: DoctorAboutInfo;
  education: DoctorEducationItem[];
  languages: string[];
  profile_sections?: DoctorProfileSection[];
  social_links?: Record<string, string> | null;
  consultation_fee?: DoctorConsultationFee | null;
  appointment_types: DoctorAppointmentTypes;
  doctor_reviews: DoctorReviewItem[];
  availability: DoctorAvailabilityItem[];
  review_summary: DoctorReviewSummary;
}

export interface DoctorDetailResponse {
  success: boolean;
  message: string;
  path: string;
  timestamp: string;
  data: DoctorDetailData;
}