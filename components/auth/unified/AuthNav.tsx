"use client";

import { createContext, useContext } from "react";

export type AuthMode = "signin" | "register" | "forgot";

/** Switch the sign-in screen to another form (same page, nothing in the address). */
export interface AuthNav {
    go: (mode: AuthMode, prefill?: string) => void;
}

export const AuthNavContext = createContext<AuthNav | null>(null);

/** Null outside the sign-in screen (e.g. the standalone complete-profile page). */
export const useAuthNav = () => useContext(AuthNavContext);

/** Older links (/auth/register, /auth/forgot-password, ?email=, ?redirect=) hand over through here. */
const START_KEY = "@auth_start";

export const openAuthScreen = (mode: AuthMode, prefill?: string | null) => {
    try {
        sessionStorage.setItem(START_KEY, JSON.stringify({ mode, prefill: prefill || "" }));
    } catch {
        // storage unavailable: the sign-in form opens
    }
};

export const takeAuthStart = (): { mode: AuthMode; prefill: string } => {
    try {
        const raw = sessionStorage.getItem(START_KEY);
        sessionStorage.removeItem(START_KEY);
        const data = raw ? JSON.parse(raw) : null;
        const mode: AuthMode = data?.mode === "register" || data?.mode === "forgot" ? data.mode : "signin";
        return { mode, prefill: typeof data?.prefill === "string" ? data.prefill : "" };
    } catch {
        return { mode: "signin", prefill: "" };
    }
};
