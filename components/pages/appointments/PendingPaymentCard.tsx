'use client';

interface PendingPaymentCardProps {
    appointment: {
        id: string;
        doctorName: string;
        doctorImage: string;
        date: string;
        time: string;
    };
    specialty?: string;
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
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                            <span className="truncate">{specialty}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-0.5 text-amber-500 font-semibold shrink-0">
                                ★ <span className="text-slate-700">5.0</span>
                            </span>
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
                            /* Signal Equalizer Bars */
                            <div className="flex items-end gap-0.5 h-3" title="Video Signal">
                                <span className="w-0.5 h-2 bg-emerald-500 rounded-full" />
                                <span className="w-0.5 h-3 bg-emerald-500 rounded-full" />
                                <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full" />
                            </div>
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
