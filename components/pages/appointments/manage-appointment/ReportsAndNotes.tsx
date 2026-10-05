"use client"
import { useEffect, useState } from 'react';
import { FileText, Plus, MoreVertical, Eye, Edit3, Trash2, CalendarX2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report } from '@/types/medical-reports';
import { SlotItem } from '@/types/slots';
import { toast } from 'sonner';
import RescheduleDialog from './RescheduleDialog';
import { useRescheduleAppointment } from '@/mutations/useRescheduleAppointment';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';

interface ReportsAndNotesProps {
    reports: Report[];
    note: string;
    doctorId?: string;
    appointmentId?: string;
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
    onAddReport: () => void;
    onViewReport: (report: Report) => void;
    onEditReport: (report: Report) => void;
    onDeleteReport: (id: string) => void;
    onEditNote?: () => void;
    onCancel?: () => void;
    appointmentStatus?: string;
    /** Video call open now (any time on the appointment date, also after completion). */
    callNow?: boolean;
    joinUrl?: string;
    isRejoin?: boolean;
}

export default function ReportsAndNotes({
    reports,
    note,
    doctorId,
    appointmentId,
    activeMenu,
    setActiveMenu,
    onAddReport,
    onViewReport,
    onEditReport,
    onDeleteReport,
    onEditNote,
    onCancel,
    appointmentStatus,
    callNow = false,
    joinUrl,
    isRejoin = false,
}: ReportsAndNotesProps) {

    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [isAlreadyRescheduled, setIsAlreadyRescheduled] = useState(
        appointmentStatus === "rescheduled"
    );
    const rescheduleMutation = useRescheduleAppointment();
    const queryClient = useQueryClient();

    // Close the View / Edit / Delete menu on any click outside it (or Esc).
    useEffect(() => {
        if (!activeMenu) return;
        const close = (event: Event) => {
            if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
            if (event.target instanceof Element && event.target.closest('[data-report-menu]')) return;
            setActiveMenu(null);
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', close);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', close);
        };
    }, [activeMenu, setActiveMenu]);

    useEffect(() => {
        if (appointmentStatus === "rescheduled") {
            setIsAlreadyRescheduled(true);
        }
    }, [appointmentStatus]);

    const handleRescheduleClick = () => {
        if (isAlreadyRescheduled) {
            toast.error("You already rescheduled this appointment");
            return;
        }

        if (!doctorId) {
            toast.error('Doctor information not available');
            return;
        }
        setShowRescheduleDialog(true);
    };

    const handleConfirmReschedule = (slot: SlotItem, callbacks: { onSuccess: (message: string) => void, onError: (message: string) => void }) => {
        if (!appointmentId) {
            callbacks.onError('Appointment ID not available');
            return;
        }

        const payload = {
            appointment_id: appointmentId,
            availability_id: slot.id,
            appointment_date: slot.date,
            appointment_time: slot.booking_start_time
        };

        rescheduleMutation.mutate(payload, {
            onSuccess: (data) => {

                const message = data.message || 'Appointment rescheduled successfully';
                callbacks.onSuccess(message);

                // One reschedule per appointment: lock it and reload the appointment right away.
                setIsAlreadyRescheduled(true);
                queryClient.invalidateQueries({ queryKey: ['appointment-detail', appointmentId] });

            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.errors?.message
                    || error?.response?.data?.message
                    || 'Failed to reschedule appointment';
                callbacks.onError(errorMessage);
            }
        });
    };

    return (
        <Card className="lg:col-span-5 space-y-8 rounded-lg p-5 justify-between">

            <CardContent className='px-0'>

                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg text-[#1F1E1E] font-semibold">Manage Reports & Notes</h3>
                    <button
                        onClick={onAddReport}
                        className="p-2 bg-primary/15 text-emerald-600 rounded-xl"
                    >
                        <Plus size={18} strokeWidth={3} className="text-primary" />
                    </button>
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant/30">
                            <FileText size={32} className="text-primary" />
                        </div>
                        <p className="text-sm text-[#4D4D4D] font-medium leading-relaxed">
                            You have not added any medical reports or notes. If you'd like to share them with your doctor,
                            <button onClick={onAddReport} className="text-primary font-semibold hover:underline"> click here to upload</button>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report, index) => (
                            <div key={`report-${report.id || index}`} className="p-5 rounded-lg rounded-3xl border border-light-gray relative">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <h4 className="font-semibold text-[#1f1e1e] text-sm mb-1">{report.title}</h4>
                                        <p className="text-[10px] text-[#4D4D4D]">{report.date}</p>
                                    </div>
                                    <div className="relative" data-report-menu>
                                        <button
                                            aria-label="Report actions"
                                            aria-expanded={activeMenu === report.id}
                                            onClick={() => setActiveMenu(activeMenu === report.id ? null : report.id)}
                                            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-on-surface-variant" />
                                        </button>

                                        <AnimatePresence>
                                            {activeMenu === report.id && (
                                                <motion.div
                                                    key={`report-menu-${report.id || index}`}
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-lg border border-[#E7E8EB] bg-white shadow-lg"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            onViewReport(report);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-xs font-bold text-[#1F1E1E] hover:bg-surface-container-low flex items-center gap-2"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            onEditReport(report);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-xs font-bold text-[#1F1E1E] hover:bg-surface-container-low flex items-center gap-2"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteReport(report.id)}
                                                        className="w-full px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <p className="text-xs font-semibold text-[#1f1e1e]">Type: <span className="text-primary">{report.type}</span></p>
                            </div>
                        ))}

                        {/* Note Section */}
                        <div className="mt-8 pt-6 border-t border-outline-variant/10">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[#1F1E1E] font-semibold text-base">Patient Note</h4>
                                {onEditNote && (
                                    <button
                                        type="button"
                                        onClick={onEditNote}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-all shadow-2xs cursor-pointer"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" /> Edit Note
                                    </button>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                                <p className="text-xs text-[#1F1E1E] font-medium leading-relaxed whitespace-pre-wrap">
                                    {note ? note : 'No notes added yet.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Appointment actions. Only the doctor / clinic reschedules; the patient can join the
                call (rejoin all day on the date, also after completion) and cancel while not done. */}
            {(() => {
                const done = ['completed', 'cancelled', 'no_show', 'failed'].includes(String(appointmentStatus));
                const showJoin = (callNow || String(appointmentStatus) === 'completed') && !!joinUrl;
                const showCancel = !done && !!onCancel;
                if (!showJoin && !showCancel) return null;
                return (
                    <div className="space-y-2.5 border-t border-[#E7E8EB] pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manage this appointment</p>
                        <div className={`grid gap-2.5 ${showJoin && showCancel ? 'grid-cols-1 min-[420px]:grid-cols-2' : 'grid-cols-1'}`}>
                            {showJoin && (
                                <Button onClick={() => window.open(`/start-consultation?room_url=${encodeURIComponent(joinUrl!)}&appointment_id=${appointmentId}`, '_blank')}
                                    className="h-11 cursor-pointer font-semibold">
                                    <Video className="mr-1.5 h-4 w-4" /> {isRejoin || String(appointmentStatus) === 'completed' ? 'Rejoin video call' : 'Join video call'}
                                </Button>
                            )}
                            {showCancel && (
                                <Button onClick={onCancel} variant="outline"
                                    className="h-11 cursor-pointer border-red-300 font-semibold text-red-600 hover:bg-red-50 hover:text-red-700">
                                    <CalendarX2 className="mr-1.5 h-4 w-4" /> Cancel appointment
                                </Button>
                            )}
                        </div>
                        {String(appointmentStatus) === 'completed' && showJoin && (
                            <p className="text-xs text-muted-foreground">This consultation is completed. You can rejoin the call today if the doctor asks you to.</p>
                        )}
                        <p className="text-xs text-muted-foreground">Need a different time? The clinic or your doctor can reschedule it for you.</p>
                    </div>
                );
            })()}



        </Card>
    );
}
