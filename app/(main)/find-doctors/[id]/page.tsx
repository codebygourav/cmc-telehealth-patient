"use client";

import React, { useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorDetail } from '@/queries/useDoctorDetail';
import DoctorHeader from '@/components/pages/doctor-profile/DoctorHeader';
import DoctorAbout from '@/components/pages/doctor-profile/DoctorAbout';
import DoctorProfileSections from '@/components/pages/doctor-profile/DoctorProfileSections';
import AppointmentBooking from '@/components/pages/doctor-profile/AppointmentBooking';
import ReviewSection from '@/components/pages/doctor-profile/ReviewSection';
import LoadingSkeleton from '@/components/pages/doctor-profile/LoadingSkeleton';
import CustomDialog from '@/components/custom/Dialogboxs';
import CustomTabs from '@/components/custom/CustomTabs';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/hero-section';

interface DoctorProfileProps {
    params: Promise<{
        id: string;
    }>;
}

const DoctorProfile = ({ params }: DoctorProfileProps) => {

    const { id } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
    const [appointmentId, setAppointmentId] = useState<string>('');
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        type: 'danger' | 'success';
        title: string;
        description: string;
        confirmText?: string;
    }>({
        open: false,
        type: 'danger',
        title: '',
        description: '',
        confirmText: 'OK',
    });

    // isPending (not isLoading): keep the loader until data or a real error, so no error flash on reload.
    const { data, error, isPending: isLoading, refetch } = useDoctorDetail(id);
    const doctor = data?.data;

    const handleBookingSuccess = (appointmentId: string) => {
        setDialogState({
            open: true,
            type: 'success',
            title: 'Slot Reserved - Payment Required',
            description: 'Your slot has been reserved. Please review your booking details and complete the payment to confirm your appointment.',
            confirmText: 'Confirm & Pay',
        });
        setAppointmentId(appointmentId);
    };

    const handleBookingError = (error: string) => {
        setDialogState({
            open: true,
            type: 'danger',
            title: 'Booking Failed',
            description: error || 'Unable to book appointment. Please try again later.',
            confirmText: 'OK',
        });
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error || !doctor) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive mb-4">Failed to load doctor details. Please try again.</p>
                <Button onClick={() => refetch()} variant="default" className="btn-primary-cta px-6">
                    Retry
                </Button>
            </div>
        );
    }

    const totalReviews = Number(doctor.review_summary?.total_reviews) || 0;
    const hasReviews = totalReviews > 0 && (doctor.doctor_reviews?.length ?? 0) > 0;

    return (
        <>

            <HeroSection
                showBackButton
                backHref="/find-doctors"
                title="Doctor Detail"
                description="Connect with world-class specialists curated for your health journey. Expert clinical care delivered with a human touch."
            />

            <div className="container-max-width w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column - Doctor Info */}
                <div className="lg:col-span-7 space-y-8">

                    <DoctorHeader doctor={doctor} />

                    <div className="space-y-6">

                        {/* Reviews tab only when the doctor has reviews */}
                        {hasReviews && (
                            <div className="flex justify-center md:justify-start">
                                <div className="flex gap-2.5 overflow-x-auto no-scrollbar p-1.5 border border-[#E7E8EB] bg-[#F5F6F8] rounded-md">
                                    {(['overview', 'reviews'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`transition-all whitespace-nowrap text-sm font-semibold py-2 px-7 rounded-md ${activeTab === tab ? 'text-white bg-primary' : 'text-[#4D4D4D]'}`}
                                        >
                                            {tab === 'overview' ? 'Overview' : `Reviews (${totalReviews})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'overview' || !hasReviews) && (
                            <>
                                <DoctorAbout about={doctor.about} />
                                <DoctorProfileSections sections={doctor.profile_sections} />
                            </>
                        )}

                        {hasReviews && activeTab === 'reviews' && (
                            <ReviewSection reviews={doctor.doctor_reviews || []} />
                        )}
                    </div>
                </div>

                {/* Right Column - Booking */}
                <div className="lg:col-span-5 sticky top-28">
                    <AppointmentBooking
                        doctor={doctor}
                        onBookingSuccess={handleBookingSuccess}
                        onBookingError={handleBookingError}
                    />
                </div>
            </div>

            {/* Custom Dialog */}
            <CustomDialog
                open={dialogState.open}
                onClose={() => setDialogState(prev => ({ ...prev, open: false }))}
                type={dialogState.type}
                title={dialogState.title}
                description={dialogState.description}
                confirmText={dialogState.confirmText || (dialogState.type === 'success' ? 'Confirm & Pay' : 'OK')}
                cancelText="Cancel"
                onConfirm={
                    () => {
                        setDialogState(prev => ({ ...prev, open: false }));
                        if (dialogState.type === 'success' && appointmentId) {
                            router.push(`/appointments/${appointmentId}`);
                        }
                    }
                }
                icon={dialogState.type === 'danger' ?
                    <AlertCircle className="h-6 w-6 text-destructive" /> :
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                }
            />
        </>
    );
};

export default DoctorProfile;