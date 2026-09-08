import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppointmentTypeSelector from './AppointmentTypeSelector';
import DateSelector from './DateSelector';
import TimeSelector from './TimeSelector';
import { useBookAppointment } from '@/mutations/useBookAppointment';
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

const AppointmentBooking = ({ doctor, onBookingSuccess, onBookingError }: AppointmentBookingProps) => {

    const [appointmentType, setAppointmentType] = useState<'in_person' | 'video' | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<DoctorAvailabilitySlot | null>(null);
    const [selectedDateSlot, setSelectedDateSlot] = useState<DoctorAvailabilitySlot | null>(null);

    const { mutate: bookAppointment, isPending: isBooking } = useBookAppointment();

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

    const inPersonAvailable = (doctor.appointment_types?.in_person ?? false) || hasInPersonSlots;
    const videoAvailable = (doctor.appointment_types?.video ?? false) || hasVideoSlots;

    useEffect(() => {
        if (appointmentType === null) {
            if (inPersonAvailable) {
                setAppointmentType('in_person');
            } else if (videoAvailable) {
                setAppointmentType('video');
            }
        }
    }, [doctor, appointmentType, inPersonAvailable, videoAvailable]);

    const filteredSlots = availableSlots.filter(slot => {
        if (appointmentType === 'in_person') return matchConsultationType(slot, 'in_person');
        if (appointmentType === 'video') return matchConsultationType(slot, 'video');
        return true;
    });

    useEffect(() => {
        if (filteredSlots.length > 0) {
            const currentSelectedDate = selectedDateSlot?.date;
            const matchingSlot = currentSelectedDate
                ? filteredSlots.find(slot => slot.date === currentSelectedDate)
                : null;

            if (matchingSlot) {
                setSelectedDateSlot(matchingSlot);
            } else {
                setSelectedDateSlot(filteredSlots[0]);
            }
            setSelectedSlot(null);
        } else {
            setSelectedDateSlot(null);
            setSelectedSlot(null);
        }
    }, [appointmentType, availableSlots.length]);

    // Get slots for selected date
    const slotsForSelectedDate = selectedDateSlot
        ? filteredSlots.filter(slot => slot.date === selectedDateSlot.date)
        : [];

    const handleDateSelect = (slot: DoctorAvailabilitySlot) => {
        setSelectedDateSlot(slot);
        setSelectedSlot(null);
    };

    const handleTimeSelect = (slot: DoctorAvailabilitySlot) => {
        setSelectedSlot(slot);
    };

    const handleBooking = () => {
        if (!selectedSlot) return;

        const payload = {
            doctor_id: doctor.id,
            availability_id: selectedSlot.id,
            appointment_date: selectedSlot.date,
            appointment_time: selectedSlot.start_time,
            consultation_type: selectedSlot.consultation_type,
            opd_type: 'general',
        };

        bookAppointment(payload, {
            onSuccess: (response) => {
                const appointmentId = response?.data?.appointment?.id;
                const appointmentData = response?.data;
                if (appointmentId && appointmentData) {
                    onBookingSuccess(appointmentId);
                } else {
                    onBookingError('Failed to get appointment details');
                }
            },
            onError: (error) => {
                const errorMessage = error.response?.data?.message || error.message || 'Failed to book appointment. Please try again.';
                onBookingError(errorMessage);
            },
        });
    };

    const isBookingDisabled = !appointmentType || !selectedSlot || isBooking;

    return (
        <div className="border-[#E7E8EB] border rounded-lg p-5 shadow-[0px_2px_4px_0px_#0000001A] space-y-5">

            <div className="space-y-2">
                <h3 className="text-[#1F1E1E] font-bold text-2xl">
                    Book Appointment
                </h3>
                <p className="text-[#4D4D4D] text-base">Choose your preferred date and time.</p>
            </div>

            <AppointmentTypeSelector
                value={appointmentType}
                onChange={setAppointmentType}
                inPersonAvailable={inPersonAvailable}
                videoAvailable={videoAvailable}
            />

            {appointmentType && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <DateSelector
                        slots={filteredSlots}
                        selectedSlot={selectedDateSlot}
                        onSelectSlot={handleDateSelect}
                    />

                    {selectedDateSlot && slotsForSelectedDate.length > 0 && (
                        <TimeSelector
                            slots={slotsForSelectedDate}
                            selectedSlot={selectedSlot}
                            onSelectSlot={handleTimeSelect}
                        />
                    )}
                </div>
            )}

            <Button
                onClick={handleBooking}
                disabled={isBookingDisabled}
                variant="default"
                size="lg"
                className="w-full py-3 rounded-md font-semibold transition-all"
            >
                {isBooking ? "Booking..." : `Book Appointment (${selectedSlot?.currency_symbol ? selectedSlot?.currency_symbol : ''}${selectedSlot?.consultation_fee || 0}.00)`}
                <ChevronRight size={14} color='#fff' strokeWidth={3} />
            </Button>
        </div>
    );
};

export default AppointmentBooking;