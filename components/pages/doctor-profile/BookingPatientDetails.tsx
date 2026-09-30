"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

export type PatientType = "new" | "old";

export interface BookingPatientDetailsValue {
    patientType: PatientType;
    unitId: string;
    forSelf: boolean;
    patientName: string;
    gender: "" | "male" | "female" | "other";
    age: string;
    phone: string;
}

export const emptyBookingPatientDetails: BookingPatientDetailsValue = {
    patientType: "new",
    unitId: "",
    forSelf: true,
    patientName: "",
    gender: "",
    age: "",
    phone: "",
};

export type BookingPatientErrors = Partial<Record<keyof BookingPatientDetailsValue, string>>;

// Validation shared by the booking card before calling the API.
export const validateBookingPatientDetails = (value: BookingPatientDetailsValue): BookingPatientErrors => {
    const errors: BookingPatientErrors = {};

    if (value.patientType === "old" && !value.unitId.trim()) {
        errors.unitId = "Please enter the Unit ID (C Number).";
    }

    if (!value.forSelf) {
        if (!value.patientName.trim()) errors.patientName = "Please enter the patient name.";
        if (!value.gender) errors.gender = "Please select the patient gender.";
        const age = Number(value.age);
        if (value.age === "" || Number.isNaN(age) || age < 0 || age > 120) errors.age = "Please enter a valid age (0-120).";
        if (!/^\d{10}$/.test(value.phone)) errors.phone = "Please enter a 10 digit phone number.";
    }

    return errors;
};

interface BookingPatientDetailsProps {
    value: BookingPatientDetailsValue;
    onChange: (value: BookingPatientDetailsValue) => void;
    errors?: BookingPatientErrors;
    bookerName?: string;
    // Unit ID saved on the logged-in patient's profile (prefilled when booking for myself).
    savedUnitId?: string;
}

const PATIENT_TYPES: { value: PatientType; title: string; subtitle: string }[] = [
    { value: "new", title: "New Patient", subtitle: "First time at this clinic" },
    { value: "old", title: "Old Patient", subtitle: "Has Unit ID (C Number)" },
];

const inputClass =
    "w-full rounded-md border border-[#E7E8EB] bg-white px-3 py-2.5 text-sm text-[#1F1E1E] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="mt-1 text-xs font-medium text-destructive">{message}</p> : null;

export default function BookingPatientDetails({ value, onChange, errors = {}, bookerName, savedUnitId = '' }: BookingPatientDetailsProps) {
    const set = <K extends keyof BookingPatientDetailsValue>(key: K, fieldValue: BookingPatientDetailsValue[K]) =>
        onChange({ ...value, [key]: fieldValue });

    // Old patient booking for myself: fill in my saved Unit ID (still editable).
    // Switching to a family member clears it, since their Unit ID is different.
    const withUnitId = (next: BookingPatientDetailsValue): BookingPatientDetailsValue => {
        if (next.patientType !== 'old') return { ...next, unitId: '' };
        if (next.forSelf && !next.unitId.trim() && savedUnitId) return { ...next, unitId: savedUnitId };
        if (!next.forSelf && value.forSelf && next.unitId === savedUnitId) return { ...next, unitId: '' };
        return next;
    };

    // The saved Unit ID can arrive after "Old Patient" was picked.
    useEffect(() => {
        if (savedUnitId && value.patientType === 'old' && value.forSelf && !value.unitId) {
            onChange({ ...value, unitId: savedUnitId });
        }
    }, [savedUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

    const unitIdEdited = value.forSelf && !!savedUnitId && value.unitId.trim() !== '' && value.unitId.trim() !== savedUnitId;

    return (
        <div className="space-y-4">
            {/* Patient type */}
            <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Patient Type</span>
                    <span className="font-mono text-[11px] text-muted-foreground">Select one option</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Patient type">
                    {PATIENT_TYPES.map((type) => {
                        const selected = value.patientType === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => onChange(withUnitId({ ...value, patientType: type.value }))}
                                className={cn(
                                    "flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition-all",
                                    selected
                                        ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--color-primary)]"
                                        : "border-[#E7E8EB] bg-white hover:border-primary/40",
                                )}
                            >
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold text-[#1F1E1E]">{type.title}</span>
                                    <span className="block text-xs text-muted-foreground">{type.subtitle}</span>
                                </span>
                                <span
                                    aria-hidden
                                    className={cn(
                                        "h-4 w-4 shrink-0 rounded-full border-2",
                                        selected ? "border-primary bg-primary shadow-[inset_0_0_0_2.5px_white]" : "border-gray-300",
                                    )}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            {value.patientType === "old" && (
                <div>
                    <label htmlFor="booking-unit-id" className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
                        Unit ID (C Number) <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="booking-unit-id"
                        className={cn(inputClass, errors.unitId && "border-destructive")}
                        value={value.unitId}
                        onChange={(e) => set("unitId", e.target.value)}
                        placeholder="e.g. C-123456"
                        maxLength={255}
                    />
                    <FieldError message={errors.unitId} />
                    {!errors.unitId && value.forSelf && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {!savedUnitId
                                ? "No Unit ID on your profile yet. It will be saved to your profile when you book."
                                : unitIdEdited
                                    ? `Your profile has ${savedUnitId}. It will be updated to this Unit ID when you book.`
                                    : "From your profile. You can edit it if it has changed."}
                        </p>
                    )}
                </div>
            )}

            {/* Who is the appointment for */}
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1F1E1E]">
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-primary)]"
                    checked={value.forSelf}
                    onChange={(e) => onChange(withUnitId({ ...value, forSelf: e.target.checked }))}
                />
                I am booking for myself{bookerName ? ` (${bookerName})` : ""}
            </label>

            {!value.forSelf && (
                <div className="space-y-3 rounded-lg border border-[#E7E8EB] bg-[#F9FAFB] p-3">
                    <p className="text-xs text-muted-foreground">
                        Booking for a family member? Enter their details. You will receive the booking emails.
                    </p>
                    <div>
                        <label htmlFor="booking-patient-name" className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
                            Patient Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="booking-patient-name"
                            className={cn(inputClass, errors.patientName && "border-destructive")}
                            value={value.patientName}
                            onChange={(e) => set("patientName", e.target.value)}
                            placeholder="Person visiting the doctor"
                            maxLength={255}
                        />
                        <FieldError message={errors.patientName} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="booking-patient-gender" className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
                                Patient Gender <span className="text-destructive">*</span>
                            </label>
                            <select
                                id="booking-patient-gender"
                                className={cn(inputClass, errors.gender && "border-destructive")}
                                value={value.gender}
                                onChange={(e) => set("gender", e.target.value as BookingPatientDetailsValue["gender"])}
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <FieldError message={errors.gender} />
                        </div>
                        <div>
                            <label htmlFor="booking-patient-age" className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
                                Patient Age <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="booking-patient-age"
                                inputMode="numeric"
                                className={cn(inputClass, errors.age && "border-destructive")}
                                value={value.age}
                                onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                                placeholder="e.g. 35"
                            />
                            <FieldError message={errors.age} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="booking-patient-phone" className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
                            Patient Phone Number <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="booking-patient-phone"
                            inputMode="numeric"
                            className={cn(inputClass, errors.phone && "border-destructive")}
                            value={value.phone}
                            onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10 digit mobile number"
                        />
                        <FieldError message={errors.phone} />
                    </div>
                </div>
            )}
        </div>
    );
}
