import api from "@/lib/axios";

export type FamilyRelationship =
    | "self" | "spouse" | "son" | "daughter" | "father" | "mother"
    | "brother" | "sister" | "grandparent" | "grandchild" | "other";

export interface FamilyProfile {
    patient_id: string;
    is_self: boolean;
    is_unlinked?: boolean;
    name: string;
    first_name: string;
    last_name: string | null;
    relationship: FamilyRelationship;
    relationship_label: string;
    // Relation typed by the holder (relationship is then "other").
    relationship_custom?: string | null;
    // The profile this member was added under; each profile shows only its own family members.
    added_under?: string | null;
    gender: "male" | "female" | "other" | null;
    age: number | null;
    phone: string | null;
    email?: string | null;
    unit_id: string | null;
    has_appointments: boolean;
    // New / old patient is known (Unit ID saved or a past appointment): booking skips the question.
    patient_type_known: boolean;
    avatar?: string | null;
    // Family member with their own login (they can sign in too; you keep managing the profile).
    has_login?: boolean;
    login_email?: string | null;
}

export interface FamilyManager {
    link_id: string;
    holder_name: string | null;
    holder_email: string | null;
    relationship_label: string;
    linked_at: string | null;
}

export interface FamilyProfilesResponse {
    profiles: FamilyProfile[];
    relationships: Record<string, string>;
    max_profiles: number;
    // Signed in as a family member: the primary account(s) managing this profile.
    managed_by?: FamilyManager[];
}

export interface FamilyMemberInput {
    name: string;
    relationship: string;
    relationship_label?: string | null;
    gender: string;
    age: number;
    phone: string;
    unit_id?: string | null;
    login_email?: string;
    login_password?: string;
}

export const getFamilyProfiles = async (): Promise<FamilyProfilesResponse> => {
    const { data } = await api.get("/patient/family-profiles");
    return data?.data;
};

export const addFamilyProfile = async (input: FamilyMemberInput): Promise<FamilyProfile> => {
    const { data } = await api.post("/patient/family-profiles", input);
    return data?.data;
};

export const updateFamilyProfile = async (patientId: string, input: Partial<FamilyMemberInput>): Promise<FamilyProfile> => {
    const { data } = await api.patch(`/patient/family-profiles/${patientId}`, input);
    return data?.data;
};

export const unlinkFamilyProfile = async (patientId: string, input: { email?: string; phone?: string }) => {
    const { data } = await api.post(`/patient/family-profiles/${patientId}/unlink`, input);
    return data;
};

// The person being added is already a patient here (not yet in this family).
export interface ExistingProfileMatch {
    already_linked: boolean;
    patient_id?: string;
    name: string;
    reason?: "unit_id" | "email" | "phone_name";
    // "otp": a code sent to the profile's email confirms the link; "unavailable": no email to verify with.
    method?: "otp" | "unavailable";
    gender?: string | null;
    age?: number | null;
    phone_masked?: string | null;
    unit_id_masked?: string | null;
    has_login?: boolean;
    email_masked?: string | null;
    match_token?: string;
}

export const lookupFamilyMember = async (input: { name?: string; phone?: string; unit_id?: string | null; login_email?: string | null }): Promise<ExistingProfileMatch | null> => {
    const { data } = await api.post("/patient/family-profiles/lookup", input);
    return data?.data?.match ?? null;
};

export const sendLinkExistingOtp = async (matchToken: string) => {
    const { data } = await api.post("/patient/family-profiles/link-existing/otp", { match_token: matchToken });
    return data;
};

export const linkExistingProfile = async (input: { match_token: string; relationship: string; relationship_label?: string | null; otp?: string }): Promise<FamilyProfile> => {
    const { data } = await api.post("/patient/family-profiles/link-existing", input);
    return data?.data;
};

// Member login: verify the email with a code, then save the member with login_email + login_password.
export const sendMemberLoginOtp = async (email: string) => {
    const { data } = await api.post("/patient/family-profiles/login-email/otp", { email });
    return data;
};

export const verifyMemberLoginOtp = async (email: string, otp: string) => {
    const { data } = await api.post("/patient/family-profiles/login-email/verify", { email, otp });
    return data;
};

export const memberLoginEmailVerified = async (email: string): Promise<boolean> => {
    const { data } = await api.get("/patient/family-profiles/login-email/status", { params: { email } });
    return Boolean(data?.data?.verified);
};

// Change a member's password with a code sent to their login email.
export const sendMemberPasswordOtp = async (patientId: string) => {
    const { data } = await api.post(`/patient/family-profiles/${patientId}/password/otp`);
    return data;
};

export const changeMemberPassword = async (patientId: string, otp: string, password: string) => {
    const { data } = await api.post(`/patient/family-profiles/${patientId}/password`, { otp, password });
    return data;
};

// Signed in as a family member: remove the primary account's access.
export const leaveFamilyManager = async (linkId: string) => {
    const { data } = await api.post(`/patient/family-profiles/managers/${linkId}/unlink`);
    return data;
};

// First field error / message from a family API error.
export const familyApiError = (err: any, fallback = "Something went wrong. Please try again.") => {
    const errors = err?.response?.data?.errors;
    if (errors && typeof errors === "object") {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") return first;
    }
    return err?.response?.data?.message || fallback;
};

export const familyFieldErrors = (err: any): Record<string, string> => {
    const fields = err?.response?.data?.errors?.fields;
    if (fields && typeof fields === "object") return fields as Record<string, string>;
    const errors = err?.response?.data?.errors;
    if (!errors || typeof errors !== "object") return {};
    return Object.fromEntries(
        Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value)]),
    );
};
