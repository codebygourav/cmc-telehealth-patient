import { useState, useEffect } from 'react';
import { AlertCircle, ChevronRight, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CustomDialog from '@/components/custom/Dialogboxs';
import { useAuth } from '@/context/userContext';
import { loginUrlWithRedirect } from '@/lib/authRedirect';
import BookingPatientDetails, {
    emptyBookingPatientDetails,
    validateBookingPatientDetails,
    type BookingPatientDetailsValue,
    type BookingPatientErrors,
} from './BookingPatientDetails';
import AppointmentTypeSelector from './AppointmentTypeSelector';
import BookingCalendar, { dayStateFor, isSlotBookable } from './BookingCalendar';
import SlotPicker from './SlotPicker';
import { useBookAppointment } from '@/mutations/useBookAppointment';
import { useQueryClient } from '@tanstack/react-query';
import { savedUnitIdKey, useSavedUnitId } from '@/queries/useSavedUnitId';
import type { DoctorDetailData, DoctorAvailabilitySlot } from '@/types/doctor-details';

interface AppointmentBookingProps {
    doctor: DoctorDetailData;
    onBookingSuccess: (appointmentId: string) => void;
    onBookingError: (error: string) => void;
}

const matchConsultationType = (slot: DoctorAvailabilitySlot, type: 'in_person' | 'video'): boolean => {
    if (!slot) return false;

    const cType = (slot.consultation_type || '').toLowerCase().trim();
    const cLabel = (slot.consultation_type_label || '').toLowerCase().trim();

    if (!cType && !cLabel) return true;

    const combined = `${cType} ${cLabel}`.replace(/[-_]/g, ' ');

    if (type === 'in_person') {
        return (
            combined.includes('in person') ||
            combined.includes('in clinic') ||
            combined.includes('inperson') ||
            combined.includes('inclinic') ||
            combined.includes('clinic') ||
            combined.includes('physical') ||
            cType === 'both' ||
            cType === 'all'
        );
    }

    if (type === 'video') {
        return (
            combined.includes('video') ||
            combined.includes('online') ||
            combined.includes('tele') ||
            cType === 'both' ||
            cType === 'all'
        );
    }

    return true;
};

// Errors are shown inside the card (clear, next to the button) instead of a popup.
const AppointmentBooking = ({ doctor, onBookingSuccess }: AppointmentBookingProps) => {

    const [appointmentType, setAppointmentType] = useState<'in_person' | 'video' | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<DoctorAvailabilitySlot | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const { mutate: bookAppointment, isPending: isBooking } = useBookAppointment();
    const router = useRouter();
    const { user, initializing } = useAuth();
    const isGuest = !initializing && !user;
    const bookerName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '';
    const [patientDetails, setPatientDetails] = useState<BookingPatientDetailsValue>(emptyBookingPatientDetails);
    const [patientErrors, setPatientErrors] = useState<BookingPatientErrors>({});
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);
    const queryClient = useQueryClient();
    // Unit ID already saved on the patient's profile: prefilled for "Old Patient" + "myself".
    const { data: savedUnitId = '' } = useSavedUnitId(user?.id);
    const doctorPagePath = typeof window !== 'undefined' ? window.location.pathname : '/find-doctors';

    const availableSlots = (doctor.availability || []).flatMap(item => {
        if (item && Array.isArray(item.slots)) {
            return item.slots;
        }
        if (item && typeof item === 'object' && 'date' in item && 'start_time' in item) {
            return [item as unknown as DoctorAvailabilitySlot];
        }
        return [];
    });

    const hasInPersonSlots = availableSlots.some(s => matchConsultationType(s, 'in_person'));
    const hasVideoSlots = availableSlots.some(s => matchConsultationType(s, 'video'));

    // Both types are always offered; start on one that has schedules (in-clinic when both / neither do).
    useEffect(() => {
        if (appointmentType === null) {
            setAppointmentType(!hasInPersonSlots && hasVideoSlots ? 'video' : 'in_person');
        }
    }, [appointmentType, hasInPersonSlots, hasVideoSlots]);

    const filteredSlots = availableSlots.filter(slot => {
        if (appointmentType === 'in_person') return matchConsultationType(slot, 'in_person');
        if (appointmentType === 'video') return matchConsultationType(slot, 'video');
        return true;
    });

    // Pick the first bookable date for the chosen consultation type (keep the current one if still bookable).
    useEffect(() => {
        const todayKey = new Date().toLocaleDateString('en-CA');
        const firstBookable = filteredSlots.find(isSlotBookable)?.date ?? null;
        setSelectedDate((current) =>
            current && dayStateFor(current, filteredSlots, todayKey) === 'available' ? current : firstBookable,
        );
        setSelectedSlot(null);
        setBookingError(null);
    }, [appointmentType, availableSlots.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const slotsForSelectedDate = selectedDate ? filteredSlots.filter(slot => slot.date === selectedDate) : [];

    // Moving to another month hides the previous date's times and patient details
    // until a date in the shown month is picked.
    const handleMonthChange = (month: Date) => {
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        if (selectedDate && !selectedDate.startsWith(monthKey)) {
            setSelectedDate(null);
            setSelectedSlot(null);
            setBookingError(null);
        }
    };

    const handleDateSelect = (dateKey: string) => {
        setSelectedDate(dateKey);
        setSelectedSlot(null);
        setBookingError(null);
    };

    const handleTimeSelect = (slot: DoctorAvailabilitySlot) => {
        setSelectedSlot(slot);
        setBookingError(null);
    };

    const handleBooking = () => {
        if (!selectedSlot) return;

        // Browsing is public, booking needs an account.
        if (isGuest) {
            setLoginPromptOpen(true);
            return;
        }

        const errors = validateBookingPatientDetails(patientDetails);
        // Child-only slot: the family member's age must be within the limit.
        if (!patientDetails.forSelf && selectedSlot.is_child_only && selectedSlot.child_age != null
            && patientDetails.age !== '' && Number(patientDetails.age) > selectedSlot.child_age) {
            errors.age = `This slot is only for children up to ${selectedSlot.child_age} years.`;
        }
        setPatientErrors(errors);
        if (Object.keys(errors).length) {
            setBookingError('Please check the highlighted patient details.');
            return;
        }
        setBookingError(null);

        const unitId = patientDetails.patientType === 'old' ? patientDetails.unitId.trim() : undefined;
        const payload = {
            doctor_id: doctor.id,
            availability_id: selectedSlot.id,
            appointment_date: selectedSlot.date,
            // 24h time from the API (start_time is formatted for display, e.g. "2:26 PM")
            appointment_time: selectedSlot.booking_start_time || selectedSlot.start_time,
            consultation_type: selectedSlot.consultation_type,
            // Must match the slot (General / Private), otherwise the API rejects the booking
            opd_type: selectedSlot.opd_type || 'general',
            booked_by_name: bookerName || undefined,
            // Myself: only the Unit ID (saved on my profile). Family member: their own details / profile.
            booked_for_uid: unitId,
            ...(patientDetails.forSelf
                ? {}
                : {
                    booked_for_name: patientDetails.patientName.trim(),
                    booked_for_gender: patientDetails.gender || undefined,
                    booked_for_age: Number(patientDetails.age),
                    booked_for_phone: patientDetails.phone,
                }),
        };

        bookAppointment(payload, {
            onSuccess: (response) => {
                // A new / edited Unit ID for myself is saved on the profile by the API.
                if (patientDetails.forSelf && unitId) queryClient.invalidateQueries({ queryKey: savedUnitIdKey(user?.id) });
                const appointmentId = response?.data?.appointment?.id;
                const appointmentData = response?.data;
                if (appointmentId && appointmentData) {
                    onBookingSuccess(appointmentId);
                } else {
                    setBookingError('The booking was created but no appointment was returned. Please check My Appointments.');
                }
            },
            onError: (error) => {
                const errors = error.response?.data?.errors as any;
                const firstFieldError = errors && typeof errors === 'object'
                    ? (Object.values(errors).flat().find((m) => typeof m === 'string') as string | undefined)
                    : undefined;
                const errorMessage = (typeof errors === 'string' ? errors : firstFieldError)
                    || error.response?.data?.message || error.message || 'Failed to book appointment. Please try again.';
                setBookingError(errorMessage);
            },
        });
    };

    const isBookingDisabled = !appointmentType || !selectedSlot || isBooking || initializing;

    return (
        <div className="border-[#E7E8EB] border rounded-lg p-5 shadow-[0px_2px_4px_0px_#0000001A] space-y-5">
            <AppointmentTypeSelector
                value={appointmentType}
                onChange={setAppointmentType}
                inPersonAvailable={hasInPersonSlots}
                videoAvailable={hasVideoSlots}
            />

            {appointmentType && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                    {(
                        <>
                            {filteredSlots.length === 0 && (
                                <p className="rounded-md border border-dashed border-[#E7E8EB] bg-[#F5F6F8] px-3 py-2 text-center text-xs font-medium text-[#4D4D4D]">
                                    No {appointmentType === 'video' ? 'video consultation' : 'in-clinic'} schedules for this doctor right now.
                                </p>
                            )}
                            <BookingCalendar
                                onMonthChange={handleMonthChange}
                                key={appointmentType}
                                slots={filteredSlots}
                                selectedDate={selectedDate}
                                onSelectDate={handleDateSelect}
                                monthsAhead={doctor.availability_months}
                            />

                            {selectedDate && (
                                <div className="space-y-3 border-t border-[#E7E8EB] pt-4">
                                    <h3 className="text-[#1F1E1E] text-lg font-semibold">
                                        Select Time
                                        <span className="ml-2 text-sm font-normal text-[#4D4D4D]">
                                            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </span>
                                    </h3>
                                    <SlotPicker
                                        slots={slotsForSelectedDate}
                                        selectedSlot={selectedSlot}
                                        onSelectSlot={handleTimeSelect}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {!isGuest && selectedSlot && (
                <div className="space-y-2 border-t border-[#E7E8EB] pt-5 animate-in fade-in duration-300">
                    <h4 className="text-[#1F1E1E] font-bold text-base">Patient Details</h4>
                    <BookingPatientDetails
                        value={patientDetails}
                        onChange={(next) => {
                            setPatientDetails(next);
                            setPatientErrors({});
                        }}
                        errors={patientErrors}
                        bookerName={bookerName}
                        savedUnitId={savedUnitId}
                    />
                </div>
            )}

            {bookingError && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{bookingError}</span>
                </div>
            )}

            {!selectedSlot && filteredSlots.length > 0 && (
                <p className="text-center text-xs text-[#4D4D4D]">
                    {selectedDate ? 'Select a time slot to continue.' : 'Select a date to see the available times.'}
                </p>
            )}

            <Button
                onClick={handleBooking}
                disabled={isBookingDisabled}
                variant="default"
                size="lg"
                className="w-full py-3 rounded-md font-semibold transition-all"
            >
                {isBooking
                    ? "Booking..."
                    : isGuest
                        ? "Sign in to Book"
                        : `Book Appointment (${selectedSlot?.currency_symbol ? selectedSlot?.currency_symbol : ''}${selectedSlot?.consultation_fee || 0}.00)`}
                {isGuest ? <LogIn size={14} color='#fff' strokeWidth={3} /> : <ChevronRight size={14} color='#fff' strokeWidth={3} />}
            </Button>

            {isGuest && (
                <p className="text-center text-xs text-muted-foreground">
                    You can browse freely. Sign in or register to book this appointment.
                </p>
            )}

            <CustomDialog
                open={loginPromptOpen}
                onClose={() => setLoginPromptOpen(false)}
                type="success"
                icon={<LogIn className="h-6 w-6 text-primary" />}
                title="Sign in to book"
                description="Please sign in or create an account to book this appointment. You will come back to this doctor after signing in."
                confirmText="Sign In"
                cancelText="Register"
                onConfirm={() => router.push(loginUrlWithRedirect(doctorPagePath, 'login'))}
                onCancel={() => router.push(loginUrlWithRedirect(doctorPagePath, 'register'))}
            />
        </div>
    );
};

export default AppointmentBooking;