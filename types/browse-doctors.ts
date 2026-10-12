export interface Doctor {
  id: string;
  name: string;
  speciality: string | { id: string; name: string; symptoms?: any[] };
  avatar: string;
  rating: number;
  years_experience: string;
  languages_known: string[];
  // Ready-made label from the API, e.g. "₹500 (GNL) ₹600 / $30 (VD)".
  consultation_fee: number | string;
  consultation_type: string | string[] | null;
  consultation_type_label: string[] | string | null;
  // Lowest fee per mode, in `currency_symbol`. `international` is sent only before login.
  fees_breakdown?: {
    video_consultation?: number;
    clinic_visit?: { general?: number; private?: number };
    international?: { video_consultation?: number; currency_symbol?: string };
  };
  currency_symbol?: string;
  is_international?: boolean;
  // Next day with an open slot: the day only, never a time.
  availability_status?: { key: 'today' | 'tomorrow' | 'later' | 'unavailable'; label: string; date: string | null };
  total_reviews?: number;
  is_test_doctor?: boolean;
  hospital?: string;
  availability?: string;
}

export interface BrowseDoctorsResponse {
  data: Doctor[];
  success: boolean;
  message?: string;
}

export type ConsultationType = 'video' | 'in-person' | 'all';
export type SortOption = 'recommended' | 'highest-rated' | 'price-low-high' | 'next-available';
export type Page = 'appointments' | 'medical-records' | 'find-doctors' | 'doctor-profile';