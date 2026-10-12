"use client";

/**
 * "Install app" on the profile screen: always available, for Android, iPhone and desktop.
 *  - When the browser offers its install dialog, the button opens it.
 *  - Otherwise it shows how to install on this device (iPhone: Share → Add to Home Screen;
 *    other browsers: from the browser's menu).
 *  - When the portal already runs as the installed app, it says so.
 */

import { installApp, isIosNonSafari, useInstallState } from "@/lib/installApp";
import { CheckCircle2, Download, MoreVertical, Share, SquarePlus } from "lucide-react";
import { useState } from "react";

export default function InstallAppButton({ appName, className = "" }: { appName: string; className?: string }) {
    const state = useInstallState();
    const [showSteps, setShowSteps] = useState(false);

    // Nothing is known on the server, so nothing is rendered there.
    if (state === null) return null;

    const onClick = async () => {
        if (state === "ready") {
            await installApp();
        } else {
            setShowSteps((value) => !value);
        }
    };

    return (
        <section aria-label={`Install ${appName}`} className={`rounded-lg border border-[#E7E8EB] bg-white p-4 ${className}`}>
            <div className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192x192.png" alt="" className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black">{appName} app</p>
                    <p className="text-xs text-[#4D4D4D]">
                        {state === "installed" ? "You are using the installed app." : "Install it on your phone or computer and open it like an app."}
                    </p>
                </div>

                {state === "installed" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-3 py-2 text-sm font-semibold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Installed
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={onClick}
                        aria-expanded={state === "ready" ? undefined : showSteps}
                        className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                        <Download className="h-4 w-4" />
                        Install app
                    </button>
                )}
            </div>

            {showSteps && state === "ios" && (
                <div className="mt-3 rounded-md bg-[#F4F7F5] p-3 text-sm leading-relaxed text-[#1F1E1E]">
                    {isIosNonSafari() ? (
                        <p>On iPhone and iPad the app can only be added from <strong>Safari</strong>. Open this page in Safari, then:</p>
                    ) : (
                        <p>To install on iPhone or iPad:</p>
                    )}
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5">
                        <li>Tap <Share className="inline h-4 w-4 align-text-bottom" aria-hidden="true" /> <strong>Share</strong> at the bottom of Safari.</li>
                        <li>Choose <SquarePlus className="inline h-4 w-4 align-text-bottom" aria-hidden="true" /> <strong>Add to Home Screen</strong>.</li>
                        <li>Tap <strong>Add</strong>.</li>
                    </ol>
                </div>
            )}

            {showSteps && state === "manual" && (
                <div className="mt-3 rounded-md bg-[#F4F7F5] p-3 text-sm leading-relaxed text-[#1F1E1E]">
                    <p>Your browser did not offer the install dialog here. To install:</p>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5">
                        <li>Open the browser menu (<MoreVertical className="inline h-4 w-4 align-text-bottom" aria-hidden="true" />).</li>
                        <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                    </ol>
                    <p className="mt-1.5 text-xs text-[#4D4D4D]">Use Chrome or Edge on Android and computers. If the app is already installed, open it from your home screen.</p>
                </div>
            )}
        </section>
    );
}
