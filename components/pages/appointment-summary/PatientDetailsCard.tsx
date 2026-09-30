"use client";

import { IdCard, UserRound, Users, UserPlus } from "lucide-react";
import type { AppointmentDetailData } from "@/types/appointment-summary";

interface PatientDetailsCardProps {
    appointment: AppointmentDetailData;
}

const Row = ({ label, value, wide }: { label: string; value?: string | number | null; wide?: boolean }) =>
    value || value === 0 ? (
        <div className={wide ? "col-span-2 min-w-0 sm:col-span-1" : "min-w-0"}>
            <dt className="text-xs text-[#8A8A8A]">{label}</dt>
            <dd className="break-words text-sm font-semibold text-[#1F1E1E]">{value}</dd>
        </div>
    ) : null;

const capitalise = (value?: string | null) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : null);

// Who the appointment is for, new/old patient (with Unit ID) and, for family bookings, who booked it.
export default function PatientDetailsCard({ appointment }: PatientDetailsCardProps) {
    const isFamily = appointment.booking_for === "family" || !!appointment.booked_for;
    const isOld = appointment.patient_type === "old";
    const unitId = appointment.patient_uid || appointment.booked_for?.uid || null;
    const p = appointment.patient;
    const family = appointment.booked_for;

    const name = family?.name || p?.name;
    const age = family?.age != null ? `${family.age} Years` : p?.age_formatted || (p?.age ? `${p.age} Years` : null);
    const gender = capitalise(family?.gender) || p?.gender_formatted;
    const phone = family?.phone || p?.phone;
    const booker = appointment.booked_by || (isFamily && appointment.booked_by_name ? { name: appointment.booked_by_name, email: null, phone: null } : null);

    return (
        <section className="rounded-lg border border-[#E7E8EB] bg-white p-5 shadow-[0px_2px_4px_0px_#0000001A]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[#1F1E1E]">
                    <UserRound className="h-5 w-5 text-primary" /> Patient Details
                </h3>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                        {isFamily ? <Users className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
                        {isFamily ? "Booking for Family Member" : "Booking for Myself"}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isOld ? "border border-blue-200 bg-blue-50 text-blue-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {isOld ? <IdCard className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        {isOld ? "Old Patient" : "New Patient"}
                    </span>
                </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Row label="Patient Name" value={name} wide />
                <Row label="Age" value={age} />
                <Row label="Gender" value={gender} />
                <Row label="Phone" value={phone} />
                {!isFamily && <Row label="Email" value={p?.email} wide />}
                {!isFamily && <Row label="Blood Group" value={p?.blood_group} />}
                <Row label="Unit ID (C Number)" value={isOld ? unitId : "Created at your first visit"} />
            </dl>

            {isFamily && booker && (
                <div className="mt-5 border-t border-[#E7E8EB] pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">Booked by</p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                        <Row label="Name" value={booker.name} wide />
                        <Row label="Email" value={booker.email} wide />
                        <Row label="Phone" value={booker.phone} />
                    </dl>
                    <p className="mt-3 text-xs text-[#4D4D4D]">Booking updates are sent to the booker&apos;s email.</p>
                </div>
            )}
        </section>
    );
}
