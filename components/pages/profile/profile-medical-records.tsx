"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, FileText, Loader2, Lock, Plus, Trash2, Upload } from "lucide-react";
import { deleteMedicalReport } from "@/api/getMedicalReports";
import SheetDialog from "@/components/custom/SheetDialog";
import { useMedicalReports } from "@/queries/useGetMedicalReports";
import { UploadReportModal } from "@/components/pages/medical-records/UploadReportModal";
import { Button } from "@/components/ui/button";

interface ProfileMedicalRecordsProps {
    user: { id: string };
}

export default function ProfileMedicalRecords({ user }: ProfileMedicalRecordsProps) {
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, isLoading } = useMedicalReports(user?.id, page);
    const records = data?.data ?? [];

    // Remove a report (asks first).
    const queryClient = useQueryClient();
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await deleteMedicalReport(deleteTarget.id);
            toast.success(`"${deleteTarget.name}" removed from your reports.`);
            setDeleteTarget(null);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["medical-reports"] }),
                queryClient.invalidateQueries({ queryKey: ["patient-medical-reports"] }),
            ]);
        } catch (err: any) {
            toast.error(err?.response?.data?.errors?.message || err?.response?.data?.message || "Could not remove the report. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Private Storage Banner */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs sm:text-sm">
                        <p className="font-semibold text-[#1F1E1E]">Private Profile Storage</p>
                        <p className="mt-0.5 text-muted-foreground">
                            Medical reports uploaded here are stored privately under your profile. They are <span className="font-semibold text-[#1F1E1E]">not shared with any doctor</span> until you select them when booking or managing an appointment.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#1F1E1E]">
                    {records.length > 0 ? `${records.length} report(s) in your private storage` : "No reports uploaded yet"}
                </p>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary-cta w-full sm:w-auto"
                >
                    <Upload className="mr-1.5 h-4 w-4" /> Upload New Report to Profile
                </Button>
            </div>

            {/* Records List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                </div>
            ) : records.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D1D5DB] p-6 text-center">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-semibold text-[#1F1E1E]">Your private records folder is empty</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Upload lab tests, prescriptions, or scans to keep them organized safely in your profile.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 border-primary text-primary hover:bg-primary/10"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Upload your first report
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {records.map((record) => (
                        <div
                            key={record.id}
                            className="flex flex-col justify-between rounded-lg border border-[#E7E8EB] bg-white p-4 shadow-sm transition-all hover:border-primary/40"
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-sm font-semibold text-[#1F1E1E]">{record.report_name}</h4>
                                    <p className="text-xs text-muted-foreground">{record.type_label || record.report_type}</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">{record.report_date_formatted || record.report_date}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E7E8EB] pt-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget({ id: record.id, name: record.report_name || "Report" })}
                                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                </button>
                                {record.file_url && (
                                    <a
                                        href={record.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        View File <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SheetDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
                title="Remove this report?"
                description={deleteTarget ? `"${deleteTarget.name}" will be removed from your private reports.` : undefined}
                footer={
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                        <Button variant="outline" className="h-10" onClick={() => setDeleteTarget(null)} disabled={deleting}>Keep it</Button>
                        <Button className="h-10 bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...</> : <><Trash2 className="mr-1.5 h-4 w-4" /> Remove</>}
                        </Button>
                    </div>
                }
            >
                <p className="text-sm text-[#4D4D4D]">
                    If you already shared it with a doctor for an appointment, it will no longer appear there either. This cannot be undone from the app.
                </p>
            </SheetDialog>

            <UploadReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
