"use client";

import { useEffect, useRef } from "react";

export const readSessionDraft = <T,>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

export const clearSessionDraft = (key: string) => {
    try {
        sessionStorage.removeItem(key);
    } catch {
        // storage blocked: nothing to clear
    }
};

/**
 * Keep a form draft in sessionStorage so a page reload does not lose what was typed.
 * `restore` runs once with the saved draft; `draft` (null = nothing to keep) is saved on every change.
 * Never put passwords or codes in the draft.
 */
export function useSessionDraft<T>(key: string, draft: T | null, restore: (saved: T) => void) {
    const restored = useRef(false);
    // Only remove a draft after one was being kept (the form closed), never while restoring it.
    const hadDraft = useRef(false);

    useEffect(() => {
        if (restored.current) return;
        restored.current = true;
        const saved = readSessionDraft<T>(key);
        if (saved) restore(saved);
    }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!restored.current) return;
        try {
            if (draft !== null) {
                sessionStorage.setItem(key, JSON.stringify(draft));
                hadDraft.current = true;
            } else if (hadDraft.current) {
                sessionStorage.removeItem(key);
                hadDraft.current = false;
            }
        } catch {
            // storage blocked: the form still works, just without the draft
        }
    }, [key, draft]);
}
