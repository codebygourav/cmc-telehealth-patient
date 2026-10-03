"use client"
import { useRef, useState } from 'react';
import { X, Calendar, Clock, ChevronLeft, ChevronRight, Loader2, Video, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDoctorAvailableSlots } from '@/queries/useDoctorAvailableSlots';
import { SlotItem, SlotGroup } from '@/types/slots';
import { toast } from 'sonner';
import SuccessDialog from './SuccessDialog';
import ErrorDialog from './ErrorDialog';

interface RescheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    doctorId: string;
    appointmentId?: string;
    isLoading?: boolean;
    onConfirmReschedule?: (slot: SlotItem, callbacks: { onSuccess: (message: string) => void, onError: (message: string) => void }) => void;

    currentSlotId?: string;
    currentSlotDate?: string;
    isAlreadyRescheduled?: boolean;
}

export default function RescheduleDialog({
    isOpen,
    onClose,
    doctorId,
    appointmentId,
    isLoading,
    onConfirmReschedule,
    currentSlotId,
    currentSlotDate,
    isAlreadyRescheduled
}: RescheduleDialogProps) {
    const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
    const [activeDate, setActiveDate] = useState<string | null>(null);
    const dateStrip = useRef<HTMLDivElement>(null);
    const slideDates = (direction: 1 | -1) =>
        dateStrip.current?.scrollBy({ left: direction * dateStrip.current.clientWidth * 0.8, behavior: 'smooth' });
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [dialogTitle, setDialogTitle] = useState('');

    // Generate unique key for slot (handles recurring slots with same IDs)
    const getSlotKey = (slot: SlotItem) => `${slot.id}-${slot.date}`;

    // Fetch available slots when dialog is open
    const { data: slotsData, isLoading: isLoadingSlots, error: slotsError } = useDoctorAvailableSlots(
        doctorId,
        isOpen,
        appointmentId
    );
    const schedule = slotsData?.schedule;



    const slotGroups: SlotGroup[] = slotsData?.data || [];
    // One date at a time: the picked date, else the first date that still has a free slot.
    const visibleDate = activeDate && slotGroups.some((g) => g.date === activeDate)
        ? activeDate
        : (slotGroups.find((g) => g.slots.some((slot) => slot.available))?.date ?? slotGroups[0]?.date ?? null);
    const activeGroup = slotGroups.find((g) => g.date === visibleDate);

    const handleSlotSelect = (slot: SlotItem) => {
        setSelectedSlot(slot);
    };

    const handleConfirm = () => {
        if (isAlreadyRescheduled) {
            setDialogTitle('Error');
            setDialogMessage('You already rescheduled this appointment');
            setShowErrorDialog(true);
            return;
        }


        if (!selectedSlot) {
            setDialogTitle('Error');
            setDialogMessage('Please select a time slot');
            setShowErrorDialog(true);
            return;
        }
        if (onConfirmReschedule) {
            onConfirmReschedule(selectedSlot, {
                onSuccess: (message: string) => {
                    setDialogTitle('Success');
                    setDialogMessage(message || 'Appointment rescheduled successfully');
                    setShowSuccessDialog(true);
                    setSelectedSlot(null);
                },
                onError: (message: string) => {
                    setDialogTitle('Error');
                    setDialogMessage(message || 'Failed to reschedule appointment');
                    setShowErrorDialog(true);
                }
            });
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessDialog(false);
        onClose();
    };

    const handleErrorClose = () => {
        setShowErrorDialog(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
                        />
                        {/* Bottom sheet on phones, centred dialog from sm up. */}
                        <motion.div
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 60 }}
                            transition={{ type: 'tween', duration: 0.2 }}
                            role="dialog" aria-modal="true" aria-label="Reschedule appointment"
                            className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg"
                        >
                            <span className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden" aria-hidden="true" />
                            {/* Header */}
                            <div className="flex items-center gap-3 border-b border-[#E7E8EB] px-4 py-3 sm:px-6 sm:py-4">
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-surface-container rounded-full transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-primary" />
                                </button>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-[#1F1E1E] sm:text-xl">Reschedule Appointment</h3>
                                    <p className="text-xs text-muted-foreground">Pick a new date, then a time.</p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

                                {schedule && (
                                    <div className={`mb-4 flex items-center gap-3 rounded-lg border px-3 py-2.5 ${schedule.consultation_type === 'video' ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-primary/20 bg-primary/5 text-primary'}`}>
                                        {schedule.consultation_type === 'video' ? <Video className="h-5 w-5 shrink-0" /> : <Building2 className="h-5 w-5 shrink-0" />}
                                        <div className="text-sm">
                                            <p className="font-semibold">You are on the {schedule.label}</p>
                                            <p className="text-xs opacity-80">
                                                {schedule.consultation_type === 'video'
                                                    ? 'This is a video appointment, so only video dates are shown.'
                                                    : `This is an in-person ${schedule.opd_type === 'private' ? 'private' : 'general'} OPD appointment, so only ${schedule.opd_type === 'private' ? 'private' : 'general'} OPD dates are shown.`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isAlreadyRescheduled && (
                                    <div className="text-red-500 text-sm text-center mb-4 font-semibold">
                                        You already rescheduled this appointment
                                    </div>
                                )}

                                {isLoadingSlots ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                                        <p className="text-sm text-on-surface-variant">Loading available slots...</p>
                                    </div>
                                ) : slotsError ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <X className="w-8 h-8 text-red-500" />
                                        </div>
                                        <p className="text-sm text-on-surface-variant">Failed to load slots</p>
                                        <button
                                            onClick={onClose}
                                            className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : slotGroups.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant/30">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm text-on-surface-variant">No available slots found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* Dates */}
                                        <div>
                                            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                                <Calendar className="h-4 w-4" /> Date
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => slideDates(-1)} aria-label="Previous dates"
                                                    className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7E8EB] bg-white text-primary hover:border-primary sm:flex">
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <div ref={dateStrip} className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Available dates">
                                                    {slotGroups.map((group) => {
                                                        const freeSlots = group.slots.filter((slot) => slot.available).length;
                                                        const selected = group.date === visibleDate;
                                                        const d = new Date(group.date);
                                                        return (
                                                            <button key={group.date} type="button" role="tab" aria-selected={selected}
                                                                onClick={() => setActiveDate(group.date)}
                                                                title={`${freeSlots} free`}
                                                                className={`flex py-2 h-16 w-16 shrink-0 snap-start flex-col items-center justify-center rounded-lg border leading-none transition-colors ${selected
                                                                    ? 'border-primary bg-primary text-white'
                                                                    : freeSlots > 0
                                                                        ? 'border-[#E7E8EB] bg-white text-[#1F1E1E] hover:border-primary/50'
                                                                        : 'border-[#E7E8EB] bg-[#F5F6F8] text-gray-400'}`}>
                                                                <span className="text-[10px] font-semibold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                                <span className=" text-lg font-bold">{d.getDate()}</span>
                                                                <span className={`text-[10px] ${selected ? 'text-white/80' : 'text-muted-foreground'}`}>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <button type="button" onClick={() => slideDates(1)} aria-label="Next dates"
                                                    className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7E8EB] bg-white text-primary hover:border-primary sm:flex">
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Times for the chosen date */}
                                        {activeGroup && (
                                            <div>
                                                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                                    <Clock className="h-4 w-4" /> Time · {formatDate(activeGroup.date)}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                    {activeGroup.slots.map((slot) => {
                                                        const isCurrentSlot = currentSlotId === slot.id && currentSlotDate === slot.date;
                                                        const selected = selectedSlot && getSlotKey(selectedSlot) === getSlotKey(slot);
                                                        return (
                                                            <button key={getSlotKey(slot)} type="button"
                                                                onClick={() => handleSlotSelect(slot)}
                                                                disabled={!slot.available || isCurrentSlot}
                                                                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${selected
                                                                    ? 'border-primary bg-primary text-white'
                                                                    : slot.available && !isCurrentSlot
                                                                        ? 'border-[#E7E8EB] bg-white text-[#1F1E1E] hover:border-primary hover:text-primary'
                                                                        : 'cursor-not-allowed border-[#E7E8EB] bg-[#F5F6F8] text-gray-400'}`}>
                                                                {slot.start_time}{slot.end_time ? ` - ${slot.end_time}` : ''}
                                                                <span className={`mt-0.5 block text-[10px] font-medium ${selected ? 'text-white/80' : 'text-muted-foreground'}`}>
                                                                    {String(slot.consultation_type).toLowerCase() === 'video' ? 'Video' : `In-person · ${slot.opd_type === 'private' ? 'Private' : 'General'} OPD`}
                                                                </span>
                                                                {isCurrentSlot && <span className="mt-0.5 block text-[10px] font-medium">Your current slot</span>}
                                                                {!slot.available && !isCurrentSlot && <span className="mt-0.5 block text-[10px] font-medium">Full</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-[#E7E8EB] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm">
                                        {selectedSlot ? (
                                            <div className="text-primary">
                                                <span className="font-bold">Selected:</span>{' '}
                                                {formatDate(selectedSlot.date)} at {selectedSlot.start_time}
                                            </div>
                                        ) : (
                                            <span className="text-on-surface-variant">Select a time slot</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-3 bg-white text-primary border border-outline-variant/20 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={!selectedSlot || isLoadingSlots || isLoading || isAlreadyRescheduled}
                                            className="px-6 py-3 bg-[#0A2E1F] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SuccessDialog
                isOpen={showSuccessDialog}
                onClose={handleSuccessClose}
                title={dialogTitle}
                message={dialogMessage}
            />

            <ErrorDialog
                isOpen={showErrorDialog}
                onClose={handleErrorClose}
                title={dialogTitle}
                message={dialogMessage}
            />
        </>
    );
}
