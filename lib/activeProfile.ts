// The family profile the app is viewing (patient id). Empty = the account holder's own profile.
// Sent to the API as "X-Patient-Profile" so lists (appointments, reports, medicines…) follow it.
const KEY = "@active_profile_id";
export const ACTIVE_PROFILE_EVENT = "active-profile:change";

export const getActiveProfileId = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
};

export const setActiveProfileId = (id: string | null) => {
    if (typeof window === "undefined") return;
    try {
        if (id) localStorage.setItem(KEY, id);
        else localStorage.removeItem(KEY);
    } catch {
        // storage blocked: the app falls back to the own profile
    }
    window.dispatchEvent(new CustomEvent(ACTIVE_PROFILE_EVENT, { detail: id }));
};
