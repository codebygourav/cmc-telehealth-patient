'use client';
import { Video } from "lucide-react";

interface PendingPaymentCardProps {
    appointment: {
        id: string;
        doctorName: string;
        doctorImage: string;
        date: string;
        time: string;
    };
    specialty?: string;
    rating?: number;
    consultationType?: string;
    fee?: string;
    bookedForName?: string | null;
    onComplete: (appointmentId: string) => void;
    onDelete: (appointmentId: string) => void;
}

// Concept B: Modular Bento Healthcare Capsule for Pending Payment Appointments
const PendingPaymentCard = ({
    appointment,
    specialty = "Specialist",
    rating,
    consultationType = "Video Call",
    fee = "0",
    bookedForName,
    onComplete,
    onDelete,
}: PendingPaymentCardProps) => {
    const doctorName = appointment.doctorName || "Doctor";
    const feeFormatted = parseFloat(String(fee || 0)).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const isVideo = String(consultationType).toLowerCase().includes("video");

    const initials = doctorName
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "DR";

    return (
        <div className="flex h-full flex-col bg-white rounded-md border border-slate-200/90 p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-all justify-between gap-3.5">
            {/* 1. Header Row - Doctor Micro-Cell */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Dark Green Circle Initials / Avatar */}
                    <div className="relative shrink-0">
                        {appointment.doctorImage ? (
                            <img
                                src={appointment.doctorImage}
                                alt={doctorName}
                                className="w-11 h-11 rounded-md object-cover border border-slate-100"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : null}
                        <div className={`w-11 h-11 bg-[#064e3b] text-white font-bold text-sm rounded-md flex items-center justify-center shrink-0 ${appointment.doctorImage ? "hidden" : ""}`}>
                            {initials}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate" title={doctorName}>
                            {doctorName}
                        </h3>
                        {/* Department (role) in small text; the rating only when the doctor has at least 1 review. */}
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] leading-snug text-slate-500">
                            <span className="min-w-0 truncate" title={specialty}>{specialty}</span>
                            {Number(rating) > 0 && (
                                <span className="flex shrink-0 items-center gap-0.5 font-semibold text-amber-500">
                                    ★ <span className="text-slate-700">{Number(rating).toFixed(1)}</span>
                                </span>
                            )}
                        </div>
                        {bookedForName && (
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                For {bookedForName}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status Pill Badge */}
                <span className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                    Payment Pending
                </span>
            </div>

            {/* 2. Middle Bento Micro-Cells (2 Columns) */}
            <div className="grid grid-cols-2 gap-2.5">
                {/* Cell 1: CONSULT DATE */}
                <div className="bg-slate-50/90 border border-slate-100 rounded-md p-2.5 sm:p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        CONSULT DATE
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                        {appointment.date}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                        {appointment.time}
                    </p>
                </div>

                {/* Cell 2: SESSION MODE */}
                <div className="bg-slate-50/90 border border-slate-100 rounded-md p-2.5 sm:p-3 space-y-1 relative flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            SESSION MODE
                        </span>
                        {isVideo ? (
                            /* Video call */
                            <Video className="h-4 w-4 text-emerald-600" aria-label="Video call" />
                        ) : (
                            <span className="bg-slate-200/80 text-slate-600 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                OPD
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                            {isVideo ? "Video Call" : "General (In-Clinic)"}
                        </p>
                        <p className="text-xs text-slate-500 font-medium truncate">
                            Fee: ₹{feeFormatted}
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-md p-2.5 text-center text-xs text-amber-800 font-medium leading-normal">
                This slot is not booked until the payment is completed.
            </div>

            {/* 3. Bottom Action Bar */}
            <div className="flex items-center gap-2 pt-0.5">
                <button
                    type="button"
                    onClick={() => onComplete(appointment.id)}
                    className="flex-1 bg-[#064e3b] text-white hover:bg-[#043e2f] font-semibold text-xs sm:text-sm py-2.5 px-3 rounded-md transition-colors cursor-pointer shadow-2xs text-center truncate"
                >
                    Confirm &amp; Book (₹{feeFormatted})
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(appointment.id)}
                    className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs sm:text-sm py-2.5 px-3.5 rounded-md transition-colors cursor-pointer shrink-0"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default PendingPaymentCard;
