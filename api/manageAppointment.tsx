import axiosInstance from "@/lib/axios";

export interface UpdateAppointmentInformationParams {
  appointmentId: string;
  notes?: string;
  reports?: {
    id?: string;
    name: string;
    type: string;
    file?: File;
  }[];
}

export const updateAppointmentInformation = async ({
  appointmentId,
  notes,
  reports,
}: UpdateAppointmentInformationParams): Promise<any> => {
  const formData = new FormData();

  if (notes) {
    formData.append("notes", notes);
  }

  if (reports && reports.length > 0) {
    reports.forEach((report, index) => {
      if (report.id) formData.append(`reports[${index}][id]`, report.id);
      formData.append(`reports[${index}][name]`, report.name);
      formData.append(`reports[${index}][type]`, report.type);
      if (report.file) {
        formData.append(`reports[${index}][file]`, report.file);
      }
    });
  }

  const response = await axiosInstance.post(
    `/appointments/${appointmentId}/update-information`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const deleteMedicalReport = async (reportId: string): Promise<any> => {
  try {
    const response = await axiosInstance.delete(`/patient/medical-reports/${reportId}`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return { success: true, message: "Report already removed" };
    }
    throw err;
  }
};

export const getPatientMedicalReports = async (patientId: string): Promise<any> => {
  const response = await axiosInstance.get(`/patient/${patientId}/medical-reports`);
  return response.data;
};
