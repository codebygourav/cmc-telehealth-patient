"use client";

/**
 * Installing the portal as an app (PWA), shared by the install banner and the "Install app"
 * button on the profile screen.
 *
 *  - Android / desktop Chrome, Edge: the browser hands us an install event; `install()` opens
 *    its install dialog.
 *  - iPhone / iPad Safari: there is no such dialog; the app is added from Share → Add to Home Screen.
 */

import { useSyncExternalStore } from "react";

// The browser's install event (not in the TypeScript DOM types yet).
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState =
    | "installed" // already running as an installed app
    | "ready" // the browser's install dialog can be opened
    | "ios" // iPhone / iPad Safari: add from the Share menu
    | "manual"; // no install dialog offered (yet): install from the browser's menu

let installEvent: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// One listener for the whole app: the event fires once, soon after the page loads.
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (event) => {
        // Keep the browser's own mini-infobar away; we offer our own button instead.
        event.preventDefault();
        installEvent = event as BeforeInstallPromptEvent;
        notify();
    });
    window.addEventListener("appinstalled", () => {
        installEvent = null;
        justInstalled = true;
        notify();
    });
}

const readState = (): InstallState => {
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || justInstalled) return "installed";
    if (installEvent) return "ready";

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);

    return isIos ? "ios" : "manual";
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** Opens the browser's install dialog. Resolves to true when the app was installed. */
export async function installApp(): Promise<boolean> {
    if (!installEvent) return false;

    const event = installEvent;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // The event can be used only once.
    installEvent = null;
    notify();

    return outcome === "accepted";
}

/** Current install state (null while rendering on the server). */
export function useInstallState(): InstallState | null {
    return useSyncExternalStore<InstallState | null>(subscribe, readState, () => null);
}

/** iPhone / iPad browsers other than Safari cannot add to the Home Screen. */
export const isIosNonSafari = (): boolean =>
    typeof navigator !== "undefined" && /crios|fxios|edgios|opios|fban|fbav|instagram/i.test(navigator.userAgent);
