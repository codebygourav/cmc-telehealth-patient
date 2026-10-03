"use client";

import { useState } from "react";
import { CheckCircle2, IdCard, Loader2, Plus, User, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addFamilyProfile, familyApiError, familyFieldErrors, lookupFamilyMember, type ExistingProfileMatch, type FamilyProfile } from "@/api/family";
import ExistingProfileMatchPanel from "@/components/pages/family/ExistingProfileMatchPanel";
import { profileSubtitle, useActiveProfile } from "@/context/activeProfileContext";
import FamilyMemberForm, {
    emptyFamilyMember,
    toFamilyMemberInput,
    validateFamilyMember,
    type FamilyMemberErrors,
    type FamilyMemberFormValue,
} from "@/components/pages/family/FamilyMemberForm";

/** sessionStorage key of the new-member form on the booking card (survives a reload). */
export const BOOKING_NEW_MEMBER_DRAFT = "booking-new-member-draft";

// "" = not answered yet (asked only when the profile has no Unit ID).
export type PatientType = "" | "new" | "old";

export interface BookingPatientDetailsValue {
    forSelf: boolean;
    // Family booking: a saved family profile id, "new" (add one now) or "" (not chosen yet)
    memberId: string;
    newMember: FamilyMemberFormValue;
    patientType: PatientType;
    unitId: string;
}

export const emptyBookingPatientDetails: BookingPatientDetailsValue = {
    forSelf: true,
    memberId: "",
    newMember: emptyFamilyMember,
    patientType: "",
    unitId: "",
};

export type BookingPatientErrors = Partial<Record<"who" | "unitId" | "patientType", string>> & { member?: FamilyMemberErrors };

/** The profile the appointment is for (null = a new family member being added). */
export const bookingTargetProfile = (value: BookingPatientDetailsValue, ownProfile: FamilyProfile | null, members: FamilyProfile[]) =>
    value.forSelf ? ownProfile : members.find((member) => member.patient_id === value.memberId) ?? null;

export const validateBookingPatientDetails = (
    value: BookingPatientDetailsValue,
    target: FamilyProfile | null,
): BookingPatientErrors => {
    const errors: BookingPatientErrors = {};

    if (!value.forSelf) {
        if (!value.memberId) errors.who = "Please choose a family member or add a new one.";
        // A new member is saved first (with their verified email), then booked like any saved member.
        if (value.memberId === "new") errors.who = "Please save the new family member first (Save Member).";
    }

    // A saved Unit ID is never asked again. Without one: new or old patient; old needs the Unit ID.
    if (target && !target.unit_id) {
        if (!value.patientType) errors.patientType = "Please choose new or old patient.";
        else if (value.patientType === "old" && !value.unitId.trim()) errors.unitId = "Please enter the Unit ID (C Number).";
    }

    return errors;
};

interface BookingPatientDetailsProps {
    value: BookingPatientDetailsValue;
    onChange: (value: BookingPatientDetailsValue) => void;
    errors?: BookingPatientErrors;
    ownProfile: FamilyProfile | null;
    members: FamilyProfile[];
    relationships: Record<string, string>;
    canAddMember?: boolean;
}

const PATIENT_TYPES: { value: PatientType; title: string; subtitle: string }[] = [
    { value: "new", title: "New Patient", subtitle: "First time at this clinic" },
    { value: "old", title: "Old Patient", subtitle: "Has Unit ID (C Number)" },
];

const inputClass =
    "w-full rounded-md border border-[#E7E8EB] bg-white px-3 py-2.5 text-sm text-[#1F1E1E] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="mt-1 text-xs font-medium text-destructive">{message}</p> : null;

export default function BookingPatientDetails({
    value,
    onChange,
    errors = {},
    ownProfile,
    members,
    relationships,
    canAddMember = true,
}: BookingPatientDetailsProps) {
    const target = bookingTargetProfile(value, ownProfile, members);
    const { refresh } = useActiveProfile();
    const [savingMember, setSavingMember] = useState(false);
    const [memberErrors, setMemberErrors] = useState<FamilyMemberErrors>({});
    // The person being added is already a patient here: offer to link that profile.
    const [match, setMatch] = useState<ExistingProfileMatch | null>(null);

    // Choosing who the visit is for: prefill that person's Unit ID (and old/new when known).
    const choose = (forSelf: boolean, memberId: string) => {
        const profile = forSelf ? ownProfile : members.find((member) => member.patient_id === memberId) ?? null;
        onChange({
            ...value,
            forSelf,
            memberId: forSelf ? "" : memberId,
            unitId: profile?.unit_id || "",
            patientType: profile?.unit_id ? "old" : "",
        });
    };

    const newMember = value.newMember;
    const findExisting = (loginEmail?: string) => lookupFamilyMember({
        name: newMember.name.trim(),
        phone: newMember.phone,
        unit_id: newMember.patient_type === "old" ? newMember.unit_id.trim() || null : null,
        login_email: loginEmail ?? (newMember.login_email_verified ? newMember.login_email.trim() : null),
    });

    const onEmailTaken = async (email: string) => {
        try {
            const found = await findExisting(email);
            if (found) setMatch(found);
        } catch {
            // the email error under the field is enough
        }
    };

    // Linked an existing profile (or it was already in the family): select it for this booking.
    const selectLinked = async (profile: FamilyProfile | null, patientId: string | undefined) => {
        setMatch(null);
        await refresh();
        if (!patientId) return;
        onChange({
            ...value,
            forSelf: false,
            memberId: patientId,
            newMember: emptyFamilyMember,
            unitId: profile?.unit_id || members.find((m) => m.patient_id === patientId)?.unit_id || "",
            patientType: (profile?.unit_id || members.find((m) => m.patient_id === patientId)?.unit_id) ? "old" : "",
        });
    };

    // Save the new family member, then select them for this booking.
    const saveNewMember = async (createNew = false) => {
        const found = validateFamilyMember(value.newMember);
        setMemberErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSavingMember(true);
            // Already a patient here: link that profile instead of creating a duplicate.
            if (!createNew) {
                const existing = await findExisting();
                if (existing) {
                    setMatch(existing);
                    return;
                }
            }
            const saved = await addFamilyProfile(toFamilyMemberInput(value.newMember));
            await refresh();
            toast.success(`${saved.name} added to your family profiles`);
            setMemberErrors({});
            onChange({
                ...value,
                forSelf: false,
                memberId: saved.patient_id,
                newMember: emptyFamilyMember,
                unitId: saved.unit_id || "",
                patientType: saved.unit_id ? "old" : "",
            });
        } catch (err) {
            const fields = familyFieldErrors(err);
            setMemberErrors(fields);
            if (fields.login_email) onChange({ ...value, newMember: { ...value.newMember, login_email_verified: false, login_code_sent: false } });
            toast.error(familyApiError(err));
        } finally {
            setSavingMember(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Who is this appointment for? */}
            <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Who is this appointment for?</p>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#E7E8EB] bg-[#F5F6F8] p-1" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={value.forSelf}
                        onClick={() => choose(true, "")}
                        className={cn(
                            "flex min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2.5 text-sm font-semibold transition-colors",
                            value.forSelf ? "bg-primary text-white shadow-sm" : "text-[#4D4D4D] hover:bg-white hover:text-primary",
                        )}
                    >
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">Myself{ownProfile ? ` (${ownProfile.first_name})` : ""}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!value.forSelf}
                        onClick={() => choose(false, members[0]?.patient_id ?? "")}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-md px-2 py-2.5 text-sm font-semibold transition-colors",
                            !value.forSelf ? "bg-primary text-white shadow-sm" : "text-[#4D4D4D] hover:bg-white hover:text-primary",
                        )}
                    >
                        <Users className="h-4 w-4 shrink-0" />
                        Family Member
                    </button>
                </div>
            </div>

            {/* Myself: summary of the account holder's profile */}
            {value.forSelf && ownProfile && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 text-sm">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-[#1F1E1E]">
                            {ownProfile.name}
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                {ownProfile.is_self ? "Self (Primary)" : `${ownProfile.relationship_label} · viewing now`}
                            </span>
                        </p>
                        <p className="text-[#4D4D4D]">
                            {[ownProfile.gender ? ownProfile.gender[0].toUpperCase() + ownProfile.gender.slice(1) : null,
                                ownProfile.age != null ? `${ownProfile.age} Years` : null,
                                ownProfile.phone ? `Mobile: ${ownProfile.phone}` : null].filter(Boolean).join(" • ")}
                        </p>
                        {ownProfile.unit_id && (
                            <p className="mt-1 flex items-center gap-1.5 text-[#1F1E1E]">
                                <IdCard className="h-4 w-4 text-primary" /> Unit ID: <span className="font-semibold">{ownProfile.unit_id}</span>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Family member: saved profiles + add a new one */}
            {!value.forSelf && (
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1F1E1E]">Select Family Profile</p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Family member">
                        {members.map((member) => {
                            const selected = value.memberId === member.patient_id;
                            return (
                                <button
                                    key={member.patient_id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => choose(false, member.patient_id)}
                                    className={cn(
                                        "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-all",
                                        selected ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--color-primary)]" : "border-[#E7E8EB] bg-white hover:border-primary/40",
                                    )}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-[#1F1E1E]">{member.name}</span>
                                        <span className="block text-xs text-muted-foreground">{profileSubtitle(member)}</span>
                                        {member.phone && <span className="block font-mono text-[11px] text-muted-foreground">{member.phone}</span>}
                                        <span className={cn("mt-1 flex items-center gap-1 text-[11px]", member.unit_id ? "text-[#1F1E1E]" : "text-muted-foreground")}>
                                            <IdCard className="h-3.5 w-3.5 text-primary" />
                                            {member.unit_id ? <>Unit ID: <span className="font-semibold">{member.unit_id}</span></> : "No Unit ID yet"}
                                        </span>
                                    </span>
                                    <span className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2", selected ? "border-primary bg-primary shadow-[inset_0_0_0_2.5px_white]" : "border-gray-300")} />
                                </button>
                            );
                        })}
                        {canAddMember && (
                            <button
                                type="button"
                                onClick={() => choose(false, "new")}
                                className={cn(
                                    "flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-3 text-sm font-semibold transition-colors",
                                    value.memberId === "new" ? "border-primary text-primary" : "border-[#D1D5DB] text-[#4D4D4D] hover:border-primary hover:text-primary",
                                )}
                            >
                                <Plus className="h-4 w-4" /> Add {members.length ? "Another" : "a"} Member
                            </button>
                        )}
                    </div>
                    <FieldError message={errors.who} />

                    {value.memberId === "new" && (
                        <div className="rounded-lg border border-[#E7E8EB] bg-white p-3">
                            <p className="mb-3 text-sm font-semibold text-[#1F1E1E]">New Family Member</p>
                            <FamilyMemberForm
                                value={value.newMember}
                                onChange={(newMember) => { onChange({ ...value, newMember }); setMemberErrors({}); setMatch(null); }}
                                errors={memberErrors}
                                relationships={relationships}
                                idPrefix="booking-member"
                                onEmailTaken={onEmailTaken}
                            />
                            {match ? (
                                <div className="mt-3">
                                    <ExistingProfileMatchPanel
                                        match={match}
                                        relationship={toFamilyMemberInput(newMember).relationship}
                                        relationshipLabel={toFamilyMemberInput(newMember).relationship_label}
                                        idPrefix="booking-member"
                                        onLinked={selectLinked}
                                        onCreateNew={() => { setMatch(null); saveNewMember(true); }}
                                        onCancel={() => setMatch(null)}
                                    />
                                </div>
                            ) : (
                            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button type="button" disabled={savingMember}
                                    onClick={() => { onChange({ ...value, memberId: members[0]?.patient_id ?? "", newMember: emptyFamilyMember }); setMemberErrors({}); setMatch(null); }}
                                    className="h-10 rounded-md border border-[#E7E8EB] bg-white px-4 text-sm font-medium hover:border-primary hover:text-primary">
                                    Cancel
                                </button>
                                <button type="button" onClick={() => saveNewMember()} disabled={savingMember}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                                    {savingMember && <Loader2 className="h-4 w-4 animate-spin" />} Save Member
                                </button>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* No Unit ID saved yet: new or old patient (old gives the Unit ID, saved on the profile) */}
            {target && !target.unit_id && (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">Patient Type</span>
                            <span className="text-[11px] text-muted-foreground">Select one option</span>
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
                                        onClick={() => onChange({ ...value, patientType: type.value, unitId: type.value === "new" ? "" : value.unitId })}
                                        className={cn(
                                            "flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition-all",
                                            selected ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--color-primary)]" : "border-[#E7E8EB] bg-white hover:border-primary/40",
                                        )}
                                    >
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-[#1F1E1E]">{type.title}</span>
                                            <span className="block text-xs text-muted-foreground">{type.subtitle}</span>
                                        </span>
                                        <span className={cn("h-4 w-4 shrink-0 rounded-full border-2", selected ? "border-primary bg-primary shadow-[inset_0_0_0_2.5px_white]" : "border-gray-300")} />
                                    </button>
                                );
                            })}
                        </div>
                        <FieldError message={errors.patientType} />
                        {value.patientType === "old" && (
                            <div>
                                <label htmlFor="booking-unit-id" className="mb-1 block text-sm font-semibold text-[#1F1E1E]">
                                    Unit ID (C Number) <span className="text-destructive">*</span>
                                </label>
                                <input
                                    id="booking-unit-id"
                                    className={cn(inputClass, errors.unitId && "border-destructive")}
                                    value={value.unitId}
                                    onChange={(e) => onChange({ ...value, unitId: e.target.value })}
                                    placeholder="e.g. C-123456"
                                    maxLength={255}
                                />
                                <FieldError message={errors.unitId} />
                            </div>
                        )}
                    </div>
            )}
        </div>
    );
}
