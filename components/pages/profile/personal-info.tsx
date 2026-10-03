"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updatePatientPersonalInfo } from "@/mutations/profile-update";
import { useAuth } from "@/context/userContext";
import { savedUnitIdKey } from "@/queries/useSavedUnitId";
import { cn } from "@/lib/utils";
import type { FamilyProfile } from "@/api/family";
import { familyProfilesKey } from "@/context/activeProfileContext";

interface PersonalInfoFormProps {
    user: { id: string; first_name?: string; last_name?: string; email?: string };
    // A family member's profile is being viewed: the API saves on their profile (X-Patient-Profile),
    // and the signed-in account's own name is left alone.
    viewing?: FamilyProfile | null;
}

type FormState = { first_name: string; last_name: string; existing_patient_id: string; bio: string };
type FieldErrors = Partial<Record<keyof FormState, string>>;

const BIO_MAX = 2000;
const profileKey = (userId: string, profileId?: string) => ["patient-profile", "personal_information", userId, profileId ?? "own"] as const;

// Only the details a patient manages here: name, Unit ID (C Number) and a short bio.
export default function PersonalInfoForm({ user, viewing = null }: PersonalInfoFormProps) {
    const { updateUser } = useAuth();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>({ first_name: "", last_name: "", existing_patient_id: "", bio: "" });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [saving, setSaving] = useState(false);
    // The profile's own sign-in email (a family member without a login has none).
    const loginEmail = viewing ? (viewing.has_login ? viewing.login_email : null) : user.email;

    // Saved values come from the profile API (the stored login user may not have the Unit ID / bio).
    const { data: profile, isPending } = useQuery({
        queryKey: profileKey(user.id, viewing?.patient_id),
        queryFn: async () => {
            const response = await api.get(`/patient/${user.id}/profile`, { params: { group: "personal_information" } });
            return response.data?.data ?? {};
        },
        enabled: !!user.id,
    });

    useEffect(() => {
        if (!profile) return;
        setForm({
            first_name: profile.first_name ?? (viewing ? viewing.first_name : user.first_name) ?? "",
            last_name: profile.last_name ?? (viewing ? viewing.last_name : user.last_name) ?? "",
            existing_patient_id: profile.existing_patient_id ?? "",
            bio: profile.bio ?? "",
        });
    }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (field: keyof FormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const validate = (): FieldErrors => {
        const next: FieldErrors = {};
        if (!form.first_name.trim()) next.first_name = viewing ? "Please enter their first name." : "Please enter your first name.";
        // Family members are often saved with one name only.
        if (!viewing && !form.last_name.trim()) next.last_name = "Please enter your last name.";
        if (form.bio.length > BIO_MAX) next.bio = `Please keep your bio under ${BIO_MAX} characters.`;
        return next;
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length) return;

        try {
            setSaving(true);
            const saved = await updatePatientPersonalInfo(user.id, {
                group: "personal_information",
                first_name: form.first_name.trim(),
                ...(form.last_name.trim() || !viewing ? { last_name: form.last_name.trim() } : {}),
                existing_patient_id: form.existing_patient_id.trim(),
                bio: form.bio.trim(),
            });

            // Only my own profile changes the signed-in name; a family member's name lives on their profile.
            if (!viewing) await updateUser({ first_name: saved?.first_name, last_name: saved?.last_name });
            queryClient.setQueryData(profileKey(user.id, viewing?.patient_id), saved);
            queryClient.invalidateQueries({ queryKey: familyProfilesKey(user.id) });
            queryClient.invalidateQueries({ queryKey: savedUnitIdKey(user.id) });
            toast.success("Profile updated");
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { errors?: Record<string, string[] | string>; message?: string } } };
            const apiErrors = apiError.response?.data?.errors ?? {};
            const fieldErrors: FieldErrors = {};
            (Object.keys(form) as (keyof FormState)[]).forEach((field) => {
                const value = apiErrors[field];
                if (value) fieldErrors[field] = Array.isArray(value) ? value[0] : value;
            });
            setErrors(fieldErrors);
            toast.error(
                Object.values(fieldErrors)[0] ||
                (typeof apiErrors.message === "string" ? apiErrors.message : undefined) ||
                apiError.response?.data?.message ||
                "Could not save your profile. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    };

    if (isPending) {
        return (
            <div className="space-y-5 animate-pulse" aria-busy="true">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="h-16 rounded-md bg-gray-100" />
                    <div className="h-16 rounded-md bg-gray-100" />
                </div>
                <div className="h-16 rounded-md bg-gray-100" />
                <div className="h-28 rounded-md bg-gray-100" />
            </div>
        );
    }

    const fieldClass = (field: keyof FormState) =>
        cn("h-11 global-radius-10 border-slate-200 focus-visible:border-primary", errors[field] && "border-destructive");

    return (
        <form className="space-y-5" onSubmit={handleSave} noValidate>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="profile-first-name" className="text-sm font-semibold text-[#1F1E1E]">
                        First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="profile-first-name" value={form.first_name} maxLength={255}
                        onChange={(e) => set("first_name", e.target.value)} className={fieldClass("first_name")} placeholder="Enter first name" />
                    {errors.first_name && <p className="text-xs font-medium text-destructive">{errors.first_name}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="profile-last-name" className="text-sm font-semibold text-[#1F1E1E]">
                        Last Name {!viewing && <span className="text-destructive">*</span>}
                    </Label>
                    <Input id="profile-last-name" value={form.last_name} maxLength={255}
                        onChange={(e) => set("last_name", e.target.value)} className={fieldClass("last_name")} placeholder="Enter last name" />
                    {errors.last_name && <p className="text-xs font-medium text-destructive">{errors.last_name}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-sm font-semibold text-[#1F1E1E]">Email</Label>
                <Input id="profile-email" value={loginEmail || ""} readOnly disabled
                    className="global-radius-10 border-slate-200 bg-[#F5F6F8] text-[#4D4D4D]" placeholder="No email yet" />
                <p className="text-xs text-muted-foreground">
                    {!viewing
                        ? "Your sign-in email. It cannot be changed here."
                        : loginEmail
                            ? "Their own sign-in email."
                            : "No email yet. Give them their own login from Family Members → Edit."}
                </p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="profile-unit-id" className="text-sm font-semibold text-[#1F1E1E]">Unit ID (C Number)</Label>
                <Input id="profile-unit-id" value={form.existing_patient_id} maxLength={255}
                    onChange={(e) => set("existing_patient_id", e.target.value)} className={fieldClass("existing_patient_id")} placeholder="e.g. C-123456" />
                {errors.existing_patient_id
                    ? <p className="text-xs font-medium text-destructive">{errors.existing_patient_id}</p>
                    : <p className="text-xs text-muted-foreground">Hospital Unit ID, if visited before. Filled in for you when booking.</p>}
            </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="profile-bio" className="text-sm font-semibold text-[#1F1E1E]">Short Bio</Label>
                    <span className={cn("text-xs", form.bio.length > BIO_MAX ? "text-destructive" : "text-muted-foreground")}>
                        {form.bio.length}/{BIO_MAX}
                    </span>
                </div>
                <Textarea id="profile-bio" rows={4} value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    className={cn("global-radius-10 border-slate-200 resize-none focus-visible:border-primary", errors.bio && "border-destructive")}
                    placeholder="Anything you would like your doctor to know (optional)" />
                {errors.bio && <p className="text-xs font-medium text-destructive">{errors.bio}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                {viewing
                    ? <p className="text-xs text-muted-foreground">Saved on {viewing.name}&apos;s profile</p>
                    : user.email && <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>}
                <Button type="submit" className="btn-primary-cta w-full sm:w-auto sm:min-w-40" disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
