"use client";

/**
 * "Install app" banner: offers to add this portal to the phone / computer as an app.
 *  - Android / desktop Chrome, Edge: the Install button opens the browser's own install dialog.
 *  - iPhone / iPad Safari: shows the two taps to add it to the Home Screen.
 * Not shown when the portal already runs as an installed app, or for 14 days after "Not now".
 * The same install is always available from the "Install app" button on the profile screen.
 */

import { installApp, isIosNonSafari, useInstallState } from "@/lib/installApp";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const DISMISSED_KEY = "install_app_prompt_dismissed_at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

const readSnoozed = (): boolean => {
    try {
        const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
        return dismissedAt > 0 && Date.now() - dismissedAt < SNOOZE_MS;
    } catch {
        return false; // storage blocked: just show the banner
    }
};

const subscribe = () => () => {};

export default function InstallAppPrompt({ appName }: { appName: string }) {
    const state = useInstallState();
    const snoozed = useSyncExternalStore(subscribe, readSnoozed, () => true);
    const [closed, setClosed] = useState(false);

    const showIosSteps = state === "ios" && !isIosNonSafari();
    const canInstall = state === "ready";

    if (closed || snoozed || (!showIosSteps && !canInstall)) return null;

    const notNow = () => {
        try {
            localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        } catch {
            // Storage blocked: it will simply show again next time.
        }
        setClosed(true);
    };

    const install = async () => {
        const installed = await installApp();
        // Declined in the browser's dialog: do not ask again for a while.
        if (installed) setClosed(true);
        else notNow();
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
