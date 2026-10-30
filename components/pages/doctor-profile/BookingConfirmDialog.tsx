"use client";

import { Hospital, CalendarDays, Clock, CreditCard, Stethoscope, User, Video, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { DoctorAvailabilitySlot } from "@/types/doctor-details";

interface BookingConfirmDialogProps {
    open: boolean;
    slot: DoctorAvailabilitySlot | null;
    doctorName: string;
    patientName: string;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Shown before a booking is sent: what is being booked, for whom, and that payment comes next.
 * The appointment is only confirmed after payment, so the wording never says "booked" or "reserved".
 * Bottom sheet on phones (.sheet-backdrop / .sheet-panel in globals.css). Rendered on <body> above
 * the sticky header (the booking card is a sticky column, which would keep it under the header).
 */
export default function BookingConfirmDialog({ open, slot, doctorName, patientName, loading, onConfirm, onClose }: BookingConfirmDialogProps) {
    if (!open || !slot) return null;

    const isVideo = (slot.consultation_type || "").toLowerCase().includes("video");
    const opdLabel = (slot.opd_type || "general").toLowerCase() === "private" ? "Private" : "General";
    const TypeIcon = isVideo ? Video : Hospital;
    const typeLabel = isVideo ? "Video Consultation" : "Clinic Visit";
    const fee = `${slot.currency_symbol || "₹"}${typeof slot.consultation_fee === "number" ? slot.consultation_fee.toLocaleString("en-IN") : slot.consultation_fee || 0}`;
    const dateLabel = new Date(`${slot.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

    const rows = [
        { icon: Stethoscope, label: "Doctor", value: doctorName },
        { icon: CalendarDays, label: "Date", value: dateLabel },
        { icon: Clock, label: "Time", value: `${slot.start_time} - ${slot.end_time}` },
        { icon: User, label: "Patient", value: patientName },
    ];

    return createPortal(
        <div className="sheet-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="booking-confirm-title">
            <div className="sheet-panel relative w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain bg-white px-5 pb-5 sm:px-6 sm:pb-6 shadow-xl rounded-2xl">
                {/* Title and close stay visible while the content scrolls on short screens. */}
                <div className="sticky top-0 z-10 -mx-5 flex items-start justify-between gap-3 bg-white px-5 pt-5 pb-1 sm:-mx-6 sm:px-6 sm:pt-6">
                    <h2 id="booking-confirm-title" className="text-lg font-semibold text-[#1F1E1E]">Confirm your appointment</h2>
                    <button type="button" onClick={onClose} disabled={loading} aria-label="Close"
                        className="-mr-1 shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Consultation type, large and first: patients mixed up video and in-person. */}
                <div className={`mt-4 w-full rounded-xl border-2 p-3.5 sm:p-4 ${isVideo ? "border-blue-200 bg-blue-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Consultation type</p>
                    <div className="mt-2.5 flex flex-col items-center gap-2 text-center">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isVideo ? "bg-blue-600" : "bg-emerald-700"} text-white`}>
                            <TypeIcon className="h-6 w-6" />
                        </span>
                        <p className={`text-base font-bold sm:text-lg ${isVideo ? "text-blue-900" : "text-emerald-900"}`}>
                            {typeLabel}
                            {!isVideo && (
                                <span className="ml-2 inline-block rounded-full bg-white px-2 py-0.5 align-middle text-xs font-semibold text-emerald-800 border border-emerald-200">
                                    {opdLabel}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <dl className="mt-4 divide-y divide-[#E7E8EB] rounded-xl border border-[#E7E8EB]">
                    {rows.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-3 px-3.5 py-2.5">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <dt className="w-24 shrink-0 text-xs font-medium text-gray-500 sm:text-sm">{label}</dt>
                            <dd className="min-w-0 flex-1 break-words text-sm font-semibold text-[#1F1E1E]">{value}</dd>
                        </div>
                    ))}
                    <div className="flex items-center gap-3 bg-[#F5F6F8] px-3.5 py-3">
                        <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                        <dt className="w-24 shrink-0 text-xs font-medium text-gray-500 sm:text-sm">Amount to pay</dt>
                        <dd className="flex-1 text-base font-bold text-primary">{fee}</dd>
                    </div>
                </dl>

                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 sm:text-sm">
                    Your appointment is <strong>not confirmed yet</strong>. On the next step, complete the payment to confirm it.
                </p>

                <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:flex-1">
                        Go Back
                    </Button>
                    <Button type="button" onClick={onConfirm} disabled={loading} className="w-full sm:flex-1 font-semibold">
                        {loading ? "Please wait..." : `Continue to Pay ${fee}`}
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
