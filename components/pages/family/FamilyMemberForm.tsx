"use client";

import { cn } from "@/lib/utils";
import type { FamilyMemberInput, FamilyProfile } from "@/api/family";
import MemberLoginSection from "./MemberLoginSection";
import RelationCombobox from "./RelationCombobox";

/** Relation select value for a relation typed by the user (saved as "other" + the typed label). */
export const CUSTOM_RELATION = "custom";

export interface FamilyMemberFormValue {
    name: string;
    relationship: string;
    relationship_label: string;
    gender: string;
    age: string;
    phone: string;
    // New patient (no Unit ID) or old patient (has a Unit ID / C Number).
    patient_type: "" | "new" | "old";
    unit_id: string;
    // Their own login: email verified by a code, then a password.
    login_email: string;
    login_code_sent: boolean;
    login_email_verified: boolean;
    login_password: string;
}

export const emptyFamilyMember: FamilyMemberFormValue = {
    name: "", relationship: "", relationship_label: "", gender: "", age: "", phone: "", patient_type: "", unit_id: "",
    login_email: "", login_code_sent: false, login_email_verified: false, login_password: "",
};

export const familyMemberFromProfile = (profile: FamilyProfile): FamilyMemberFormValue => ({
    ...emptyFamilyMember,
    name: profile.name,
    relationship: profile.relationship_custom ? CUSTOM_RELATION : profile.relationship === "self" ? "" : profile.relationship,
    relationship_label: profile.relationship_custom || "",
    gender: profile.gender || "",
    age: profile.age != null ? String(profile.age) : "",
    phone: profile.phone || "",
    patient_type: profile.unit_id ? "old" : "new",
    unit_id: profile.unit_id || "",
});

/** What a draft may keep across a reload (never the password). */
export const familyMemberDraft = (value: FamilyMemberFormValue): FamilyMemberFormValue => ({ ...value, login_password: "" });

export type FamilyMemberErrors = Partial<Record<keyof FamilyMemberFormValue | "otp", string>>;

export const validateFamilyMember = (value: FamilyMemberFormValue): FamilyMemberErrors => {
    const errors: FamilyMemberErrors = {};
    if (!value.name.trim()) errors.name = "Please enter the patient name.";
    if (!value.relationship) errors.relationship = "Please select or type the relation.";
    if (value.relationship === CUSTOM_RELATION && !value.relationship_label.trim()) errors.relationship = "Please select or type the relation.";
    if (!value.gender) errors.gender = "Please select the gender.";
    const age = Number(value.age);
    if (value.age === "" || Number.isNaN(age) || age < 0 || age > 120) errors.age = "Please enter a valid age (0-120).";
    if (!/^\d{10}$/.test(value.phone)) errors.phone = "Please enter a 10 digit phone number.";
    if (!value.patient_type) errors.patient_type = "Please choose new or old patient.";
    if (value.patient_type === "old" && !value.unit_id.trim()) errors.unit_id = "Please enter the Unit ID (C Number).";
    if (value.login_email.trim()) {
        if (!value.login_email_verified) errors.login_email = "Please verify this email with the code, or clear it.";
        else if (value.login_password.length < 8) errors.login_password = "Password must be at least 8 characters.";
    }
    return errors;
};

export const toFamilyMemberInput = (value: FamilyMemberFormValue): FamilyMemberInput => ({
    name: value.name.trim(),
    relationship: value.relationship === CUSTOM_RELATION ? "other" : value.relationship,
    relationship_label: value.relationship === CUSTOM_RELATION ? value.relationship_label.trim() : null,
    gender: value.gender,
    age: Number(value.age),
    phone: value.phone,
    unit_id: value.patient_type === "old" ? value.unit_id.trim() || null : null,
    ...(value.login_email.trim() && value.login_email_verified
        ? { login_email: value.login_email.trim(), login_password: value.login_password }
        : {}),
});

export const familyInputClass =
    "h-11 w-full rounded-md border border-[#E7E8EB] bg-white px-3 text-sm text-[#1F1E1E] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F5F6F8] disabled:text-muted-foreground";

export const FormField = ({ label, error, required, children, htmlFor, hint }: { label: string; error?: string; required?: boolean; children: React.ReactNode; htmlFor: string; hint?: string }) => (
    <div className="min-w-0">
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
            {label} {required && <span className="text-destructive">*</span>}
            {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
);

interface FamilyMemberFormProps {
    value: FamilyMemberFormValue;
    onChange: (value: FamilyMemberFormValue) => void;
    errors?: FamilyMemberErrors;
    relationships: Record<string, string>;
    idPrefix?: string;
    // The member being edited (has a login: change their password instead of creating one).
    profile?: FamilyProfile | null;
    // The typed login email already has an account (offer to link that existing profile).
    onEmailTaken?: (email: string) => void;
}

/** Name, relation, gender, age, phone, Unit ID and the member's own login (email verified by code). */
export default function FamilyMemberForm({ value, onChange, errors = {}, relationships, idPrefix = "family", profile, onEmailTaken }: FamilyMemberFormProps) {
    const set = (key: keyof FamilyMemberFormValue, fieldValue: string) => onChange({ ...value, [key]: fieldValue });
    const relationOptions = Object.entries(relationships).filter(([key]) => key !== "self");
    const inputClass = familyInputClass;

    return (
        <div className="@container space-y-3">
            {/* One grid: 4 fields per row on wide screens, 2 on phones. */}
            <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
                <div className="col-span-2 min-w-0 @4xl:col-span-1">
                <FormField label="Patient Name" required error={errors.name} htmlFor={`${idPrefix}-name`}>
                    <input id={`${idPrefix}-name`} className={cn(inputClass, errors.name && "border-destructive")} value={value.name}
                        onChange={(e) => set("name", e.target.value)} placeholder="Person visiting the doctor" maxLength={255} />
                </FormField>
                </div>
                <div className="col-span-2 min-w-0 @4xl:col-span-1">
                <FormField label="Relation" required error={errors.relationship || errors.relationship_label} htmlFor={`${idPrefix}-relationship`}>
                    <RelationCombobox id={`${idPrefix}-relationship`} className={inputClass} options={relationOptions} customKey={CUSTOM_RELATION}
                        relationship={value.relationship} label={value.relationship_label} invalid={!!(errors.relationship || errors.relationship_label)}
                        onChange={(relationship, relationship_label) => onChange({ ...value, relationship, relationship_label })} />
                </FormField>
                </div>
                <FormField label="Gender" required error={errors.gender} htmlFor={`${idPrefix}-gender`}>
                    <select id={`${idPrefix}-gender`} className={cn(inputClass, errors.gender && "border-destructive")} value={value.gender}
                        onChange={(e) => set("gender", e.target.value)}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </FormField>
                <FormField label="Age" required error={errors.age} htmlFor={`${idPrefix}-age`}>
                    <input id={`${idPrefix}-age`} inputMode="numeric" className={cn(inputClass, errors.age && "border-destructive")} value={value.age}
                        onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="e.g. 35" />
                </FormField>
                <div className="col-span-2 min-w-0 @4xl:col-span-1">
                    <FormField label="Phone Number" required error={errors.phone} htmlFor={`${idPrefix}-phone`}>
                        <input id={`${idPrefix}-phone`} inputMode="numeric" className={cn(inputClass, errors.phone && "border-destructive")} value={value.phone}
                            onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digit mobile number" />
                    </FormField>
                </div>
                <div className="col-span-2 min-w-0">
                    <p className="mb-1 text-sm font-semibold text-[#1F1E1E]">Patient Type <span className="text-destructive">*</span></p>
                    <div className={cn("grid h-11 grid-cols-2 gap-1 rounded-md border bg-[#F5F6F8] p-1", errors.patient_type ? "border-destructive" : "border-[#E7E8EB]")}
                        role="radiogroup" aria-label="Patient type">
                        {([["new", "New Patient"], ["old", "Old Patient"]] as const).map(([type, label]) => (
                            <button key={type} type="button" role="radio" aria-checked={value.patient_type === type}
                                onClick={() => onChange({ ...value, patient_type: type, unit_id: type === "new" ? "" : value.unit_id })}
                                className={cn("rounded text-sm font-semibold transition-colors",
                                    value.patient_type === type ? "bg-primary text-white shadow-sm" : "text-[#4D4D4D] hover:bg-white hover:text-primary")}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {errors.patient_type
                        ? <p className="mt-1 text-xs font-medium text-destructive">{errors.patient_type}</p>
                        : <p className="mt-1 text-xs text-muted-foreground">Old patient: visited the clinic before and has a Unit ID.</p>}
                </div>
                {value.patient_type === "old" && (
                    <div className="col-span-2 min-w-0 @4xl:col-span-1">
                    <FormField label="Unit ID (C Number)" required error={errors.unit_id} htmlFor={`${idPrefix}-unit`}>
                        <input id={`${idPrefix}-unit`} className={cn(inputClass, errors.unit_id && "border-destructive")} value={value.unit_id}
                            onChange={(e) => set("unit_id", e.target.value)} placeholder="e.g. C-123456" maxLength={255} />
                    </FormField>
                    </div>
                )}
            </div>

            <MemberLoginSection value={value} onChange={onChange} errors={errors} idPrefix={idPrefix} profile={profile} onEmailTaken={onEmailTaken} />
        </div>
    );
}
