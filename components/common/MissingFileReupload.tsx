"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

/**
 * Shown instead of "View" when a report is saved but its file was lost from storage
 * (API: file_missing = true). Lets the patient upload the same file again; it is saved
 * at the same place, so the report opens again everywhere.
 */
export default function MissingFileReupload({
    reportId,
    compact = false,
    onDone,
}: {
    reportId: string | number;
    compact?: boolean;
    onDone?: (fileUrl: string | null) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const queryClient = useQueryClient();

    const upload = async (file: File) => {
        setBusy(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await api.post(`/patient/medical-reports/${reportId}/reupload`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("File uploaded again");
            onDone?.(res.data?.data?.file_url ?? null);
            // Refresh every list that shows this report.
            await queryClient.invalidateQueries();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Could not upload the file. Please try again.");
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            <span
                className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600"
                title="This file is no longer on our server. Please upload it again."
            >
                <AlertTriangle className="h-3 w-3" /> File missing
            </span>
            <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                }}
                className={`inline-flex items-center gap-1 rounded-md border border-primary px-2 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-60 ${compact ? "" : "h-8"}`}
            >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {busy ? "Uploading…" : "Re-upload"}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                }}
            />
        </span>
    );
}
