import api from "@/lib/axios";
import { MedicalReportsResponse } from "@/types/medical-reports";

export const fetchMedicalReports = async (patientId: string, page: number
): Promise<MedicalReportsResponse & { meta: any }> => {
    const { data } = await api.get(
        `/patient/${patientId}/medical-reports`,
        { params: { page } }
    );
    return data;
};
// Remove a report from the viewed profile's private storage.
export const deleteMedicalReport = async (reportId: string) => {
    const { data } = await api.delete(`/patient/medical-reports/${reportId}`);
    return data;
};
