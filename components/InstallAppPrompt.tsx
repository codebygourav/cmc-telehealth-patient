"use client";

/**
 * "Install app" banner: lets the visitor add this portal to their phone / computer as an app.
 *  - Android / desktop Chrome, Edge: the Install button opens the browser's own install dialog.
 *  - iPhone / iPad (Safari has no install dialog): shows the two taps to add it to the Home Screen.
 * Not shown when the portal already runs as an installed app, or for 14 days after "Not now".
 */

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

// The browser's install event (not in the TypeScript DOM types yet).
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install_app_prompt_dismissed_at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

type Environment = "installed" | "snoozed" | "ios" | "other";

// What this browser is, read once on the client (a plain string, so it is stable between renders).
const readEnvironment = (): Environment => {
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return "installed";

    try {
        const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
        if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return "snoozed";
    } catch {
        // Storage blocked: just show the banner.
    }

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    // On iOS only Safari can add to the Home Screen (not Chrome / Firefox / in-app browsers).
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios|fban|fbav|instagram/i.test(ua);

    return isIos && isSafari ? "ios" : "other";
};

const subscribe = () => () => {};

export default function InstallAppPrompt({ appName }: { appName: string }) {
    const environment = useSyncExternalStore<Environment | null>(subscribe, readEnvironment, () => null);
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        const onBeforeInstall = (event: Event) => {
            // Keep the browser's mini-infobar away and offer our own button instead.
            event.preventDefault();
            setInstallEvent(event as BeforeInstallPromptEvent);
        };
        const onInstalled = () => {
            setInstallEvent(null);
            setClosed(true);
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const showIosSteps = environment === "ios";
    const canInstall = environment === "other" && installEvent !== null;

    if (closed || (!showIosSteps && !canInstall)) return null;

    const notNow = () => {
        try {
            localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        } catch {
            // Storage blocked: it will simply show again next time.
        }
        setClosed(true);
    };

    const install = async () => {
        if (!installEvent) return;
        await installEvent.prompt();
        const { outcome } = await installEvent.userChoice;
        // The event can be used once; "dismissed" also snoozes our banner.
        setInstallEvent(null);
        if (outcome === "dismissed") notNow();
    };

    return (
        <div
            role="region"
            aria-label={`Install ${appName}`}
            className="fixed inset-x-3 top-3 z-[60] rounded-xl border border-black/10 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:inset-x-auto sm:top-auto sm:bottom-4 sm:left-4 sm:w-[22rem] print:hidden"
        >
            <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192x192.png" alt="" className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black">Install {appName}</p>
                    {showIosSteps ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-[#4D4D4D]">
                            Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label="Share" /> Share, then{" "}
                            <SquarePlus className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden="true" />{" "}
                            <strong>Add to Home Screen</strong>.
                        </p>
                    ) : (
                        <p className="mt-0.5 text-xs leading-relaxed text-[#4D4D4D]">Add it to your home screen and open it like an app.</p>
                    )}

                    {canInstall && (
                        <div className="mt-2.5 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={install}
                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90"
                            >
                                <Download className="h-4 w-4" />
                                Install
                            </button>
                            <button type="button" onClick={notNow} className="h-9 cursor-pointer rounded-md px-3 text-sm font-semibold text-[#4D4D4D] hover:bg-black/5">
                                Not now
                            </button>
                        </div>
                    )}
                </div>
                <button type="button" onClick={notNow} aria-label="Close" className="shrink-0 cursor-pointer rounded-full p-1 text-[#6B6B6B] hover:bg-black/5">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
