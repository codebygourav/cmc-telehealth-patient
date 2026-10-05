"use client";

import { useState, useEffect } from "react";
import {
    X,
    ChevronDown,
    Upload,
    Trash2,
    Lock,
    Folder,
    FileText,
    Check,
    Plus,
    UploadCloud,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Report } from "@/types/medical-reports";
import { useAuth } from "@/context/userContext";
import { useUploadMedicalReport } from "@/queries/useUploadMedicalReport";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reports: Report[];
    onAddReport: (newReport: Report) => void;
    onDeleteReport: (id: string) => void;
    onSubmit: (note: string) => void;
    initialNote: string;
    isUpdating?: boolean;
    patientReports: any[];
    isLoadingReports: boolean;
}

const REPORT_TYPES = [
    "Blood Test",
    "X-Ray",
    "MRI Scan",
    "Ultrasound",
    "Prescription",
    "Diabetes Screening",
    "Other"
];

export default function AddReportModal({
    isOpen,
    onClose,
    reports,
    onAddReport,
    onDeleteReport,
    onSubmit,
    initialNote,
    isUpdating,
    patientReports,
    isLoadingReports
}: AddReportModalProps) {
    const { user } = useAuth();
    const { mutate: uploadToProfile, isPending: isUploadingToProfile } = useUploadMedicalReport();

    const [modalNote, setModalNote] = useState(initialNote);
    const [sourceTab, setSourceTab] = useState<"profile" | "new">("profile");

    // New report form state
    const [newReportTitle, setNewReportTitle] = useState("");
    const [newReportType, setNewReportType] = useState("");
    const [newFile, setNewFile] = useState<File | null>(null);
    const [saveToProfile, setSaveToProfile] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setModalNote(initialNote);
        }
    }, [isOpen, initialNote]);

    if (!isOpen) return null;

    // A profile report is attached when the same report (id) or the same file is in the list.
    // Never by title: two different reports can share a name (e.g. "3436").
    const sameReport = (r: Report, record: any) =>
        r.id === record.id || (!!record.file_url && !!r.fileUrl && r.fileUrl === record.file_url);
    const isReportAttached = (profileRecord: any) => reports.some((r) => sameReport(r, profileRecord));

    const handleToggleProfileReport = (record: any) => {
        const title = record.report_name || record.title;
        const attached = isReportAttached(record);

        if (attached) {
            // Find report ID in current reports array
            const existing = reports.find((r) => sameReport(r, record));
            if (existing) {
                onDeleteReport(existing.id);
                toast.info(`Removed "${title}" from doctor share list`);
            }
        } else {
            onAddReport({
                id: record.id || Math.random().toString(36).substring(2, 11),
                title: title || "Medical Report",
                date: record.report_date_formatted || record.report_date || record.date || new Date().toLocaleDateString(),
                type: record.type_label || record.type || record.report_type || "General",
                fileName: record.file_name || record.report_name || "report.pdf",
                fileUrl: record.file_url
            });
            toast.success(`Attached "${title}" to share with doctor`);
        }
    };

    const handleAddNewReport = () => {
        if (!newReportTitle.trim()) {
            toast.error("Please enter a report title");
            return;
        }
        if (!newReportType) {
            toast.error("Please select a report type");
            return;
        }

        setIsAdding(true);

        const createAndAttach = () => {
            const newReport: Report = {
                id: Math.random().toString(36).substring(2, 11),
                title: newReportTitle,
                date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
                type: newReportType,
                fileName: newFile?.name || "document.pdf",
                file: newFile || undefined
            };

            onAddReport(newReport);
            toast.success(`Report "${newReportTitle}" added & attached for doctor`);

            // Reset form
            setNewReportTitle("");
            setNewReportType("");
            setNewFile(null);
            setIsAdding(false);
        };

        // If user wants to save to profile storage as well
        if (saveToProfile && newFile && user?.id) {
            uploadToProfile({
                patientId: user.id,
                name: newReportTitle,
                type: newReportType,
                file: newFile,
            }, {
                onSuccess: () => {
                    createAndAttach();
                },
                onError: () => {
                    // Fallback attach anyway if profile save fails
                    createAndAttach();
                }
            });
        } else {
            createAndAttach();
        }
    };

    return (
        <div className="sheet-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <div className="sheet-panel relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="max-h-[88dvh] overflow-y-auto overscroll-contain px-4 pt-4 sm:max-h-[90vh] sm:px-6 sm:pt-6 custom-scrollbar">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-[#1F1E1E] sm:text-xl">Upload Reports & Notes</h2>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Share reports & health notes with your doctor for this appointment.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-muted-foreground hover:bg-gray-100 hover:text-[#1F1E1E] transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-4 space-y-5">
                        {/* Doctor Notes Section */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#1F1E1E]">
                                Write your health problem / note to Doctor
                            </label>
                            <textarea
                                value={modalNote}
                                onChange={(e) => setModalNote(e.target.value)}
                                placeholder="Describe symptoms, medical history context, or specific questions for the doctor..."
                                rows={3}
                                className="w-full rounded-lg border border-[#D1D5DB] bg-white p-3 text-sm text-[#1F1E1E] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>


                        {/* Source Selector Tabs */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-[#1F1E1E]">
                                How would you like to attach reports?
                            </label>
                            <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-[13px] font-semibold sm:text-sm">
                                <button
                                    type="button"
                                    onClick={() => setSourceTab("profile")}
                                    className={cn(
                                        "flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 transition-all",
                                        sourceTab === "profile"
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-muted-foreground hover:text-[#1F1E1E]"
                                    )}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span><span className="hidden sm:inline">From </span>My Reports ({patientReports.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceTab("new")}
                                    className={cn(
                                        "flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 transition-all",
                                        sourceTab === "new"
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-muted-foreground hover:text-[#1F1E1E]"
                                    )}
                                >
                                    <UploadCloud className="h-4 w-4" />
                                    <span>Upload New<span className="hidden sm:inline"> File</span></span>
                                </button>
                            </div>
                        </div>

                        {/* TAB 1: Select from My Profile Storage */}
                        {sourceTab === "profile" && (
                            <div className="rounded-lg border border-[#E7E8EB] bg-gray-50/50 p-3 sm:p-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Your Private Profile Reports
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Tap a report to share or remove it
                                    </span>
                                </div>

                                {isLoadingReports ? (
                                    <div className="flex h-32 items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : patientReports.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Lock className="mb-2 h-8 w-8 text-muted-foreground/60" />
                                        <p className="text-sm font-semibold text-[#1F1E1E]">No reports in your profile storage</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            You haven&apos;t uploaded any reports to your profile yet.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSourceTab("new")}
                                            className="mt-3 border-primary text-primary hover:bg-primary/10"
                                        >
                                            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload a file from device
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:max-h-56 sm:overflow-y-auto sm:pr-1 custom-scrollbar">
                                        {patientReports.map((record, index) => {
                                            const attached = isReportAttached(record);
                                            const title = record.report_name || record.title || "Medical Report";
                                            return (
                                                <div
                                                    key={`profile-rec-${record.id || index}`}
                                                    onClick={() => handleToggleProfileReport(record)}
                                                    className={cn(
                                                        "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all",
                                                        attached
                                                            ? "border-emerald-500 bg-emerald-50/80 shadow-xs"
                                                            : "border-[#E7E8EB] bg-white hover:border-primary/50 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={cn("rounded-md p-2", attached ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary")}>
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-[#1F1E1E]">{title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {record.type_label || record.report_type || "Report"} {record.report_date ? `· ${record.report_date_formatted || record.report_date}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "ml-2 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
                                                            attached
                                                                ? "bg-emerald-600 text-white"
                                                                : "bg-gray-100 text-muted-foreground hover:bg-primary hover:text-white"
                                                        )}
                                                    >
                                                        {attached ? (
                                                            <>
                                                                <Check className="h-3.5 w-3.5" /> Attached
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="h-3.5 w-3.5" /> Share
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: Upload New File */}
                        {sourceTab === "new" && (
                            <div className="rounded-lg border border-[#E7E8EB] bg-gray-50/50 p-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#1F1E1E]">Report Title *</label>
                                    <input
                                        type="text"
                                        value={newReportTitle}
                                        onChange={(e) => setNewReportTitle(e.target.value)}
                                        placeholder="e.g. Annual Blood Work 2026"
                                        className="w-full rounded-md border border-[#D1D5DB] bg-white p-2.5 text-sm outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#1F1E1E]">Report Type *</label>
                                    <div className="relative">
                                        <select
                                            value={newReportType}
                                            onChange={(e) => setNewReportType(e.target.value)}
                                            className="w-full appearance-none rounded-md border border-[#D1D5DB] bg-white p-2.5 text-sm outline-none focus:border-primary"
                                        >
                                            <option value="">Select report type...</option>
                                            {REPORT_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#1F1E1E]">Attach File</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                        />
                                        <div className="flex items-center justify-between rounded-md border border-[#D1D5DB] bg-white p-2.5 text-sm text-[#1F1E1E]">
                                            <span className="truncate text-muted-foreground">
                                                {newFile ? newFile.name : "Choose File (PDF, PNG, JPG)"}
                                            </span>
                                            <Upload className="h-4 w-4 text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 pt-1 text-xs text-[#1F1E1E] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={saveToProfile}
                                        onChange={(e) => setSaveToProfile(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span>Save a copy to my private Profile Storage for future appointments</span>
                                </label>

                                <Button
                                    type="button"
                                    onClick={handleAddNewReport}
                                    disabled={isAdding || isUploadingToProfile}
                                    className="w-full btn-primary-cta py-2.5"
                                >
                                    {isAdding || isUploadingToProfile ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding & Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-1.5 h-4 w-4" /> Add Report to Appointment
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Attached Reports for Doctor Summary */}
                        <div className="space-y-2 pt-2 border-t border-[#E7E8EB]">
                            <div>
                                <label className="text-sm font-semibold text-[#1F1E1E]">
                                    Shared with doctor ({reports.length})
                                </label>
                                {reports.length > 0 && (
                                    <p className="text-xs text-emerald-700">These reports will be shared for this appointment.</p>
                                )}
                            </div>

                            {reports.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-1">
                                    No reports attached yet. Select from your profile storage above or upload a new file.
                                </p>
                            ) : (
                                <div className="space-y-2 sm:max-h-40 sm:overflow-y-auto custom-scrollbar">
                                    {reports.map((report, index) => (
                                        <div
                                            key={`attached-${report.id || index}`}
                                            className="flex items-center justify-between rounded-lg border border-[#E7E8EB] bg-white p-3 shadow-2xs"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="rounded-md bg-emerald-100 p-2 text-emerald-700">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="truncate text-xs font-semibold text-[#1F1E1E] sm:text-sm">
                                                        {report.title}
                                                    </h4>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {report.type} {report.fileName ? `· ${report.fileName}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteReport(report.id)}
                                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
                                                title="Remove report"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer buttons: stay pinned at the bottom while the form scrolls. */}
                        <div className="sticky bottom-0 z-10 -mx-4 grid grid-cols-2 gap-2 border-t border-[#E7E8EB] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:flex sm:justify-end sm:gap-3 sm:px-6 sm:pb-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="w-full font-semibold sm:w-28"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => onSubmit(modalNote)}
                                disabled={isUpdating}
                                className="w-full btn-primary-cta font-semibold sm:w-32"
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                ) : (
                                    "Save & Submit"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
