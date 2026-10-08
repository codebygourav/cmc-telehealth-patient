"use client";

import { CalendarDays, Clock, Star, Stethoscope, Video, Building2, BriefcaseMedical } from "lucide-react";
import type { AppointmentDoctor, AppointmentSchedule } from "@/types/appointment-summary";

interface BookingOverviewCardProps {
    doctor: AppointmentDoctor;
    schedule: AppointmentSchedule;
}

// Doctor + when / how, in one card.
export default function BookingOverviewCard({ doctor, schedule }: BookingOverviewCardProps) {
    const isVideo = String(schedule?.consultation_type || "").toLowerCase().includes("video");
    const years = parseInt(String(doctor?.years_experience ?? ""), 10) || 0;
    const reviews = Number(doctor?.total_reviews) || 0;
    const date = schedule?.date_format || schedule?.date_formatted || "—";
    const day = schedule?.day_format;

    const tiles = [
        { icon: CalendarDays, label: "Date", value: date, sub: day },
        { icon: Clock, label: "Time", value: schedule?.time_formatted || "—", sub: "Reach 45 min early" },
        {
            icon: isVideo ? Video : Building2,
            label: "Visit type",
            value: isVideo ? "Video Consultation" : "In-Clinic Visit",
            sub: !isVideo ? (schedule?.consultation_type_label || schedule?.booking_type) : undefined,
        },
    ];

    return (
        <section className="overflow-hidden rounded-lg border border-[#E7E8EB] bg-white shadow-[0px_2px_4px_0px_#0000001A]">
            <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-left">
                <img
                    src={doctor?.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=Dr"}
                    alt={doctor?.name || "Doctor"}
                    className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-primary/10"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                    {doctor?.department && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                            <Stethoscope size={13} /> {doctor.department}
                        </span>
                    )}
                    <h2 className="flex flex-wrap items-center justify-center gap-2 text-xl font-bold text-[#1F1E1E] sm:justify-start sm:text-2xl">
                        {doctor?.name}
                        {(doctor as { is_test_doctor?: boolean })?.is_test_doctor && (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                        )}
                    </h2>
                    {(doctor as { department_role?: string | null })?.department_role && (
                        <p className="-mt-1 text-sm font-medium text-primary">({(doctor as { department_role?: string | null }).department_role})</p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[#4D4D4D] sm:justify-start">
                        {years > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <BriefcaseMedical className="h-4 w-4 text-primary" /> {years} years experience
                            </span>
                        )}
                        {reviews > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <Star className="h-4 w-4" fill="#FABD2E" color="#FABD2E" />
                                <span className="font-semibold text-[#1F1E1E]">{doctor?.average_rating}</span>
                                <span className="text-[#8A8A8A]">({reviews})</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-[#E7E8EB] border-t border-[#E7E8EB] bg-[#F9FAFB] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {tiles.map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="flex items-center gap-3 px-5 py-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">{label}</p>
                            <p className="text-sm font-semibold text-[#1F1E1E]">{value}</p>
                            {sub && <p className="truncate text-xs text-[#4D4D4D]">{sub}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
