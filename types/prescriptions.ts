export interface Prescription {
  /** Name / how to take for display, without the strength. */
  display_name?: string | null;
  display_instructions?: string | null;
  appointment_id: string;
  doctor_name: string;
  medician_name: string;
  problem: string;
  medician_timings: string;
  pdf_url: string;
  instructions_by_doctor: string | null;
  next_visit_date: string | null;
  medicine_name?: string | null;
  dosage?: string | null;
  frequencylabel?: string | null;
  timing?: string | null;
  status?: string;
  appointment_date?: string | null;
  diagnosis?: string | null;
}

export interface GetPrescriptionsResponse {
  success: boolean;
  message: string;
  path: string;
  timestamp: string;
  data: Prescription[];
}

export interface MedicineDetail {
  /** Name / how to take for display, without the strength. */
  display_name?: string | null;
  display_instructions?: string | null;
  number: number;
  prescription_id: string;
  name: string;
  type: string;
  frequency: string;
  frequencylabel: string;
  times: string;
  date: string;
  start_date: string;
  end_date: string;
  instructions: string[];
  dosage: string;
  meal: string;
  status: string;
  notes: string | null;
  use_type?: string;
  take_when?: string;
  min_gap?: string;
  max_doses_per_day?: string;
  patient_instruction?: string;
}

export interface MedicineDetailsData {
  pdf_url: string;
  medicines: MedicineDetail[];
  instructions_by_doctor: string | string[] | null;
  next_visit_date: string | null;
  doctor_name: string;
  appointment_id: string;
  doctor_id: string;
  appointment_date?: string | null;
  department?: string | null;
  diagnosis?: string | null;
  order_investigation?: string | null;
  notes?: string | string[] | null;
}

export interface MedicineDetailsResponse {
  success: boolean;
  message: string;
  path: string;
  timestamp: string;
  data: MedicineDetailsData;
}


