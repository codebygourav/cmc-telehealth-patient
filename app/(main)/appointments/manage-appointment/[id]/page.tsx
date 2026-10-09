"use client"

import { useState, use, useEffect } from 'react';
import { X, Upload, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Report } from '@/types/medical-reports';
import { useAppointmentDetail } from '@/queries/useAppointmentSummary';
import { useUpdateAppointmentInformation, useDeleteMedicalReport } from '@/queries/useManageAppointment';
import { useCancelAppointment } from '@/mutations/useCancelAppointment';
import { toast } from 'sonner';
import { useMedicalReports } from '@/queries/useGetMedicalReports';
import { useAuth } from '@/context/userContext';
import { Button } from '@/components/ui';

// Components
import DoctorInfoCard from '@/components/pages/appointments/manage-appointment/DoctorInfoCard';
import AppointmentInfo from '@/components/pages/appointments/manage-appointment/AppointmentInfo';
import ReportsAndNotes from '@/components/pages/appointments/manage-appointment/ReportsAndNotes';
import AddReportModal from '@/components/pages/appointments/manage-appointment/AddReportModal';
import CancelConfirmationModal from '@/components/pages/appointments/manage-appointment/CancelConfirmationModal';
import HeroSection from '@/components/hero-section';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const REPORT_TYPES = [
    "Blood Test",
    "X-Ray",
    "MRI Scan",
    "Ultrasound",
    "Prescription",
    "Other"
];

export default function ManageAppointment({ params }: PageProps) {

    const { id: appointmentId } = use(params);
    const router = useRouter();

    // Fetch appointment details using the proper hook
    const { data, isLoading, error } = useAppointmentDetail(appointmentId);
    const appointment = data?.data;
    // console.log("Appointments : ", appointment?.status);


    const { user } = useAuth();

    const { data: medicalReports, isLoading: isLoadingMedicalReports } = useMedicalReports(user?.id);
    // Mutations
    const { mutate: updateInformation, isPending: isUpdatingInfo } = useUpdateAppointmentInformation();
    const { mutate: deleteReport } = useDeleteMedicalReport();
    const { mutate: cancelAppointment, isPending: isCancelling } = useCancelAppointment();


    const [reports, setReports] = useState<Report[]>([]);
    const [note, setNote] = useState('');

    // UI State
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showAddReport, setShowAddReport] = useState(false);
    const [showEditReport, setShowEditReport] = useState<Report | null>(null);
    const [showEditNote, setShowEditNote] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Edit Modal State
    const [editTitle, setEditTitle] = useState('');
    const [editType, setEditType] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editingNoteText, setEditingNoteText] = useState(note);

    useEffect(() => {
        if (showEditReport) {
            setEditTitle(showEditReport.title);
            setEditType(showEditReport.type);
            setEditFile(null);
        }
    }, [showEditReport]);

    useEffect(() => {
        if (showEditNote) {
            setEditingNoteText(note);
        }
    }, [showEditNote, note]);

    const parseNoteText = (raw: any): string => {
        if (!raw) return '';
        if (Array.isArray(raw)) {
            return raw.map(item => parseNoteText(item)).filter(Boolean).join(', ');
        }
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        return parsed.map(item => parseNoteText(item)).filter(Boolean).join(', ');
                    }
                    if (typeof parsed === 'string') {
                        return parseNoteText(parsed);
                    }
                } catch (e) {
                    // ignore json parse error
                }
            }
            return trimmed;
        }
        return String(raw);
    };

    // Sync state with API data
    useEffect(() => {
        if (appointment) {
            if (appointment.medical_reports) {
                const mappedReports: Report[] = appointment.medical_reports.map((r, index) => ({
                    id: r.id || `api-${index}`,
                    title: r.title || 'Medical Report',
                    date: r.report_date || '',
                    type: r.type_label || r.type || 'General',
                    fileName: r.file_url ? r.file_url.split('/').pop() || 'report.pdf' : 'report.pdf',
                    fileUrl: r.file_url
                }));
                setReports(mappedReports);
            }
            if (appointment.notes) {
                setNote(parseNoteText(appointment.notes));
            }
        }
    }, [appointment]);

    const handleDeleteReport = (id: string) => {
        setReports(prev => prev.filter(r => r.id !== id));
        setActiveMenu(null);
        toast.info("Report removed from appointment");
    };

    const handleAddReport = (newReport: Report) => {
        setReports(prev => [...prev, newReport]);
    };

    const handleViewReport = (report: Report) => {
        if (report.fileUrl) {
            window.open(report.fileUrl, '_blank');
        } else if (report.file) {
            // If it's a newly added file (local), we can create a temporary URL
            const url = URL.createObjectURL(report.file);
            window.open(url, '_blank');
        } else {
            toast.error('Report file is not available');
        }
    };

    const handleSaveEditedReport = () => {
        if (!showEditReport) return;

        const updatedReports = reports.map(r => {
            if (r.id === showEditReport.id) {
                return {
                    ...r,
                    title: editTitle,
                    type: editType,
                    file: editFile || r.file,
                    fileName: editFile ? editFile.name : r.fileName
                };
            }
            return r;
        });

        setReports(updatedReports);

        // Trigger backend update
        updateInformation({
            appointmentId,
            notes: note,
            reports: updatedReports.map(r => ({
                id: (r.id && !r.id.startsWith('api-') && r.id.length > 15) ? r.id : undefined,
                name: r.title,
                type: r.type,
                file: r.file
            }))
        }, {
            onSuccess: () => {
                toast.success('Report updated successfully');
                setShowEditReport(null);
            },
            onError: (err) => {
                toast.error('Failed to update report');
                console.error('Update report error:', err);
            }
        });
    };

    const handleConfirmCancel = () => {
        cancelAppointment(appointmentId, {
            onSuccess: () => {
                toast.success('Appointment cancelled successfully');
                setShowCancelConfirm(false);
                router.push('/appointments');
            },
            onError: (err) => {
                toast.error('Failed to cancel appointment');
                console.error('Cancel appointment error:', err);
            }
        });
    };

    const handleModalSubmit = (newNote: string) => {
        updateInformation({
            appointmentId,
            notes: newNote,
            reports: reports.map(r => ({
                // Use the real ID if it's not our local fallback or a short random string
                id: (r.id && !r.id.startsWith('api-') && r.id.length > 15) ? r.id : undefined,
                name: r.title,
                type: r.type,
                file: r.file
            }))
        }, {
            onSuccess: () => {
                toast.success('Information updated successfully');
                setShowAddReport(false);
            },
            onError: (err: any) => {
                toast.error('Failed to update information');
                console.error('Update error:', err);
            }
        });
    };

    const handleSaveNote = (newNoteText: string) => {
        const clean = parseNoteText(newNoteText);
        updateInformation({
            appointmentId,
            notes: clean,
        }, {
            onSuccess: () => {
                toast.success('Patient notes updated successfully');
                setNote(clean);
                setShowEditNote(false);
            },
            onError: (err: any) => {
                toast.error('Failed to update notes');
                console.error('Update notes error:', err);
            }
        });
    };

    // Not found (wrong / old link, or it belongs to another profile): never show an empty or
    // placeholder appointment — go to My Appointments.
    const notFound = !isLoading && (!!error || !appointment);
    useEffect(() => {
        if (!notFound) return;
        toast.error('This appointment was not found in your account. If it was booked for a family member, switch to their profile.', { duration: 7000 });
        router.replace('/appointments');
    }, [notFound, router]);

    if (isLoading || notFound) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {notFound ? 'Opening your appointments…' : 'Loading appointment…'}
            </div>
        );
    }

    return (
        <div>

            <HeroSection
                showBackButton
                backHref="/appointments"
                title="Manage Appointment"
                description="Detailed information about your appointment."
            />

            <div className="container-max-width mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Info */}
                <div className="lg:col-span-7 space-y-8">
                    <DoctorInfoCard
                        doctor={appointment?.doctor}
                        appointment_status={appointment?.status_label || ''}
                    />
                    <AppointmentInfo
                        date={appointment?.schedule?.date_formatted}
                        time={appointment?.schedule?.time_formatted}
                        booking_type={appointment?.schedule?.booking_type}
                        consultation_type={appointment?.schedule?.consultation_type_label}
                        patient_name={appointment?.patient?.name}
                        patient_age={appointment?.patient?.age_formatted}
                        patient_gender={appointment?.patient?.gender_formatted}
                        patient_phone={appointment?.patient?.phone ?? undefined}
                        patient_email={appointment?.patient?.email ?? undefined}
                        patient_blood_group={appointment?.patient?.blood_group ?? undefined}
                    />
                </div>

                {/* Right Column: Reports & Notes */}
                <ReportsAndNotes
                    reports={reports}
                    note={note}
                    doctorId={appointment?.doctor?.id}
                    appointmentId={appointmentId}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onAddReport={() => setShowAddReport(true)}
                    onViewReport={handleViewReport}
                    onEditReport={setShowEditReport}
                    onDeleteReport={handleDeleteReport}
                    onEditNote={() => setShowEditNote(true)}
                    onCancel={() => setShowCancelConfirm(true)}
                    appointmentStatus={appointment?.status}
                    callNow={Boolean((appointment as any)?.call_now)}
                    joinUrl={(appointment as any)?.join_url || undefined}
                    isRejoin={Boolean((appointment as any)?.call_is_rejoin)}
                    canCancel={(appointment as any)?.can_cancel !== false}
                />
            </div>

            {/* Modals */}
            <AnimatePresence>

                {/* Add Report Modal */}
                <AddReportModal
                    key="add-report-modal"
                    isOpen={showAddReport}
                    onClose={() => setShowAddReport(false)}
                    reports={reports}
                    onAddReport={handleAddReport}
                    onDeleteReport={handleDeleteReport}
                    onSubmit={handleModalSubmit}
                    initialNote={note}
                    isUpdating={isUpdatingInfo}
                    patientReports={medicalReports?.data || []}
                    isLoadingReports={isLoadingMedicalReports}
                />

                <CancelConfirmationModal
                    key="cancel-confirm-modal"
                    isOpen={showCancelConfirm}
                    onClose={() => setShowCancelConfirm(false)}
                    onConfirm={handleConfirmCancel}
                    isPending={isCancelling}
                />

                {/* Edit Report Modal */}
                {showEditReport && (
                    <div key="edit-report-modal" className="sheet-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            onClick={() => setShowEditReport(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <div className="sheet-panel relative w-full max-w-lg bg-white rounded-md overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[#1F1E1E] font-bold text-lg">Edit Report</h3>
                                    <button onClick={() => setShowEditReport(null)} className="p-2 hover:bg-surface-container rounded-full">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[#4D4D4D] text-sm font-medium">Report Title</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full p-4 bg-white border-light-gray rounded-md outline-none mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#4D4D4D] text-sm font-medium">Report Type</label>
                                        <div className="relative">
                                            <select
                                                value={editType}
                                                onChange={(e) => setEditType(e.target.value)}
                                                className="w-full p-4 bg-white border-light-gray rounded-md outline-none mt-1.5 appearance-none"
                                            >
                                                <option value="">Select an option</option>
                                                {REPORT_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#4D4D4D] text-sm font-medium">Replace File (optional)</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full p-4 bg-white border-light-gray rounded-md outline-none mt-1.5 flex items-center justify-between">
                                                <span className="text-xs text-on-surface-variant truncate max-w-[200px]">
                                                    {editFile ? editFile.name : (showEditReport.fileName || 'report.pdf')}
                                                </span>
                                                <Upload className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-on-surface-variant/60 mt-2 italic">
                                            Current file: {showEditReport.fileName || 'report.pdf'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-8">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowEditReport(null)}
                                        className="py-3 h-auto max-w-28 w-full font-semibold cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleSaveEditedReport}
                                        className="py-3 h-auto max-w-28 w-full font-semibold cursor-pointer"
                                    >
                                        Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Note Modal */}
                {showEditNote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            onClick={() => setShowEditNote(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6 border-b border-[#E7E8EB] pb-3">
                                    <h3 className="text-lg font-bold text-[#1F1E1E]">Edit Patient Note</h3>
                                    <button onClick={() => setShowEditNote(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-muted-foreground">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#1F1E1E]">
                                        Write your health problem or notes to Doctor
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={editingNoteText}
                                        onChange={(e) => setEditingNoteText(e.target.value)}
                                        placeholder="Describe symptoms, questions, or medical context..."
                                        className="w-full p-3.5 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#1F1E1E] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E7E8EB] mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowEditNote(false)}
                                        className="py-2.5 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleSaveNote(editingNoteText)}
                                        disabled={isUpdatingInfo}
                                        className="btn-primary-cta py-2.5 font-semibold"
                                    >
                                        {isUpdatingInfo ? 'Saving...' : 'Update Note'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </AnimatePresence>
        </div>
    );
}
