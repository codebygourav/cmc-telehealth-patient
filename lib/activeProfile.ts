// The family profile the app is viewing (patient id). Empty = the account holder's own profile.
// Sent to the API as "X-Patient-Profile" so lists (appointments, reports, medicines…) follow it.
// Saved together with the signed-in user's id, so a choice never carries over to another login.
const KEY = "@active_profile_id";
const USER_KEY = "@patient_user";
export const ACTIVE_PROFILE_EVENT = "active-profile:change";
export const ACTIVE_PROFILE_STORAGE_KEY = KEY;

const currentUserId = (): string | null => {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null")?.id ?? null;
    } catch {
        return null;
    }
};

export const getActiveProfileId = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const saved = raw.startsWith("{") ? JSON.parse(raw) : { id: raw, user: null };
        // Chosen by another login (or an old value without the owner): ignore it.
        if (!saved?.id || !saved.user || saved.user !== currentUserId()) return null;
        return saved.id;
    } catch {
        return null;
    }
};

export const setActiveProfileId = (id: string | null) => {
    if (typeof window === "undefined") return;
    try {
        if (id) localStorage.setItem(KEY, JSON.stringify({ id, user: currentUserId() }));
        else localStorage.removeItem(KEY);
    } catch {
        // storage blocked: the app falls back to the own profile
    }
    window.dispatchEvent(new CustomEvent(ACTIVE_PROFILE_EVENT, { detail: id }));
};
