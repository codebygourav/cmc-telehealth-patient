'use client';
import { Star, ChevronRight, Video, Hospital, Play } from 'lucide-react';
import { Doctor, Appointment } from '@/types/appointment';
import { useRouter } from 'next/navigation';
import { getStatusColor } from '@/src/utils/getStatusColor';

interface UpcomingAppointmentCardProps {
    appointment: Appointment;
    doctor: Doctor | undefined;
    onManageClick: (appointmentId: string) => void;
    consultationType?: string;
    fee?: string;
    joinUrl?: string;
    call_now?: boolean;
    isRejoin?: boolean;
    status?: string;
    statusLabel?: string;
    bookedForName?: string | null;
    isTestDoctor?: boolean;
}

// Concept B: Modular Bento Healthcare Capsule for Upcoming Appointments
const UpcomingAppointmentCard = ({
    appointment,
    doctor,
    onManageClick,
    consultationType = "Video Call",
    fee = "0",
    joinUrl,
    call_now,
    isRejoin = false,
    status,
    statusLabel,
    bookedForName,
    isTestDoctor,
}: UpcomingAppointmentCardProps) => {
    const router = useRouter();

    const doctorName = appointment.doctorName || doctor?.name || "Doctor";
    const specialty = doctor?.specialty || "Specialist";
    const rating = doctor?.rating ? Number(doctor.rating).toFixed(1) : "5.0";
    const feeFormatted = parseFloat(String(fee || 0)).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const isVideo = String(appointment.type || consultationType).toLowerCase().includes("video");

    const initials = doctorName
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "DR";

    const canJoinCall = (call_now || (appointment as any).canJoin) && joinUrl;

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
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate" title={doctorName}>
                            {doctorName}
                            {isTestDoctor && (
                                <span className="ml-1.5 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                                    TEST
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                            <span className="truncate">{specialty}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-0.5 text-amber-500 font-semibold shrink-0">
                                ★ <span className="text-slate-700">{rating}</span>
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
                {statusLabel ? (
                    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getStatusColor("appointment", status)}`}>
                        {statusLabel}
                    </span>
                ) : (
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border bg-sky-50 text-sky-700 border-sky-200">
                        Confirmed
                    </span>
                )}
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
                            <div className="flex items-end gap-0.5 h-3" title="Active Video Signal">
                                <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="w-0.5 h-3 bg-emerald-500 rounded-full" />
                                <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
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

            {/* 3. Bottom Action Bar */}
            <div className="flex items-center gap-2 pt-0.5">
                {canJoinCall ? (
                    <>
                        <button
                            type="button"
                            onClick={() => window.open(`/start-consultation?room_url=${encodeURIComponent(joinUrl)}&appointment_id=${appointment.id}`, "_blank")}
                            className="flex-1 bg-[#064e3b] text-white hover:bg-[#043e2f] font-semibold text-xs sm:text-sm py-2.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                            <Play className="h-3.5 w-3.5 fill-white text-white shrink-0" />
                            <span>{isRejoin || status === "completed" ? "Rejoin Video Call" : "Join Video Call"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/appointments/manage-appointment/${appointment.id}`)}
                            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm py-2.5 px-3 rounded-md transition-colors cursor-pointer shrink-0"
                        >
                            Manage ›
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => router.push(`/appointments/manage-appointment/${appointment.id}`)}
                        className="w-full bg-[#064e3b] text-white hover:bg-[#043e2f] font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                        <span>Manage Appointment ›</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default UpcomingAppointmentCard;