'use client';

import { fetchAppointmentById } from '@/api/appointment-detail';
import AddReviewsDialouge from '@/components/pages/appointments/addReviewsDialouge';
import { AppointmentInfoCards } from '@/components/pages/appointments/AppointmentInfoCards';
import { Pill } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SheetDialog from '@/components/custom/SheetDialog';
import PrescriptionDetailBody from '@/components/pages/my-medicines/sections/PrescriptionDetailBody';
import { MedicineActionPlan } from '@/components/pages/my-medicines/MedicineActionPlan';
import HeroSection from '@/components/hero-section';
import PrescriptionSummary from '@/components/pages/appointments/PrescriptionSummary';

type AppointmentDetail = {
    notes?: string;
    doctor: {
        user_id: string;
        id?: string;
        name?: string;
    };
    status?: string;
    can_add_review?: boolean;
    appointment_id?: string;
    prescriptions?: any;
};

export default function AppointmentDetailPage() {

    const { id } = useParams();
    const [data, setData] = useState<AppointmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);

    useEffect(() => {
        const getData = async () => {
            try {
                const res = await fetchAppointmentById(id as string);

                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) getData();
    }, [id]);

    if (loading) return <p className="mt-10 text-center">Loading...</p>;
    if (!data) return <p className="mt-10 text-center">No Data</p>;


    const { notes } = data;
    const doctorId = data?.doctor?.id || "";
    const nextVisitDate = data?.prescriptions?.next_visit_date || "";

    return (
        <div className="min-h-screen bg-gray-50">

            <HeroSection
                showBackButton
                backHref="/appointments"
                title="Appointments Detail"
                description="Connect with world-class specialists curated for your health journey. Expert clinical care delivered with a human touch."
            />

            <div className="container-max-width mx-auto w-full">

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-12">

                    {/* LEFT COLUMN - Main Content */}
                    <div className="space-y-6 lg:col-span-3">
                        <AppointmentInfoCards data={data} />
                    </div>
                </div>

                {/* Medical Details & prescriptions - MedicineDetailView shown by default */}
                <div className="overflow-hidden mb-10">
                    <div className="pt-8 pb-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-[#1F1E1E]">
                            <Pill size={20} className="text-primary" />
                            Medical Details & Prescriptions
                        </h3>
                    </div>

                    {/* Show notes if they exist */}
                    {notes && (
                        <div className="p-6 italic text-gray-600 bg-gray-100 border-l-4 rounded-md border-primary">
                            <h3 className="text-sm">Symptoms Reported</h3>
                            <div className="mt-2 text-base">
                                &quot;{notes}&quot;
                            </div>
                        </div>
                    )}

                    {data.prescriptions ? (
                        <PrescriptionSummary prescription={data.prescriptions} onViewDetail={() => setSelectedMedicineId(data.appointment_id || (id as string))} />
                    ) : (
                        <div className="mt-6 rounded-md border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
                            No prescription details available.
                        </div>
                    )}

                    <div className="mt-6">
                        <MedicineActionPlan
                            showConclusion={false}
                            nextVisitDate={nextVisitDate}
                            doctor_id={doctorId}
                            footerActionGridClassName="grid-cols-1"
                        />
                    </div>

                    {/* Full prescription (medicines, timings, notes) in a drawer: bottom sheet on phones. */}
                    <SheetDialog
                        open={!!selectedMedicineId}
                        onOpenChange={(open) => !open && setSelectedMedicineId(null)}
                        title="Prescription details"
                        description="Medicines and notes from your doctor for this visit."
                        className="sm:max-w-3xl"
                    >
                        {selectedMedicineId && <PrescriptionDetailBody appointmentId={selectedMedicineId} />}
                    </SheetDialog>

                    <AddReviewsDialouge
                        appointmentStatus={data?.status}
                        hasExistingReview={false}
                        doctorName={data?.doctor?.name}
                        doctorId={data?.doctor?.id}
                        canSubmit={data?.can_add_review}
                        appointmentId={data?.appointment_id}
                        onSubmit={(result) => console.log(result)}
                    />

                </div>
            </div>
        </div>
    );
}
