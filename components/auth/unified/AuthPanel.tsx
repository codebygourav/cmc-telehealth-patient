"use client";

import { useSettings } from "@/context/settingsContext";
import { rememberPostAuthRedirect } from "@/lib/authRedirect";
import Logo from "@/public/assets/icon/logo-green.png";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthNavContext, takeAuthStart, type AuthMode } from "./AuthNav";
import ForgotPasswordFlow from "./ForgotPasswordFlow";
import RegisterFlow from "./RegisterFlow";
import SignInForm from "./SignInForm";
import StepHeading from "./StepHeading";

export { openAuthScreen } from "./AuthNav";
export type { AuthMode } from "./AuthNav";

/**
 * Sign in, create a new account and reset the password on one screen. The header (Back to
 * Home + logo) stays; only the form under it changes, in place. Nothing is kept in the address:
 * ?redirect= / ?email= from older links are read once and removed.
 */
export default function AuthPanel() {
    const { settings } = useSettings();
    const [mode, setMode] = useState<AuthMode>("signin");
    const [prefill, setPrefill] = useState("");
    // A new key starts a flow from its first step every time it is opened.
    const [flowKey, setFlowKey] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        rememberPostAuthRedirect(params.get("redirect"));
        const start = takeAuthStart();
        const fromUrl = params.get("email") || "";
        if (start.mode !== "signin") setMode(start.mode);
        if (start.prefill || fromUrl) setPrefill(start.prefill || fromUrl);
        if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    }, []);

    const nav = useMemo(() => ({
        go: (next: AuthMode, value?: string) => {
            setMode(next);
            setPrefill(value || "");
            setFlowKey((k) => k + 1);
        },
    }), []);

    return (
        <AuthNavContext.Provider value={nav}>
            <div className="flex h-full w-full flex-col">
                {/* Header: the logo only, centred, with a line under it. */}
                <header className="flex justify-center">
                    <Link href="/" aria-label="Go to home page" title="Home">
                        <Image src={settings.logoUrl || Logo} alt={settings.appName || "Logo"} width={180} height={32} className="h-auto w-28 sm:w-36" priority unoptimized />
                    </Link>
                </header>

                {/* The form sits in the middle of the space under the header, on every step. */}
                <div className="flex flex-1 flex-col justify-center py-8">
                    <div key={`${mode}-${flowKey}`} className="mx-auto w-full max-w-md animate-in fade-in duration-200">
                        {mode === "signin" && (
                            <div className="space-y-5">
                                <StepHeading title="Welcome back" subtitle="Sign in with your WhatsApp number or email." />
                                <SignInForm initialLogin={prefill} onForgotPassword={() => nav.go("forgot")} />
                                <div className="relative flex items-center justify-center py-1">
                                    <span className="absolute inset-x-0 top-1/2 border-t border-border/80" />
                                    <span className="relative bg-card px-3 text-xs text-muted-foreground">New here?</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => nav.go("register")}
                                    className="h-11 w-full rounded-lg border border-primary/40 bg-transparent text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Create new account
                                </button>
                            </div>
                        )}
                        {mode === "register" && <RegisterFlow />}
                        {mode === "forgot" && <ForgotPasswordFlow initialLogin={prefill} onDone={() => nav.go("signin")} />}

                        {/* Small text links under the buttons. */}
                        <p className="mt-5 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                            <Link href="/" className="hover:text-primary hover:underline">Back to Home</Link>
                            {mode !== "signin" && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <button type="button" onClick={() => nav.go("signin")} className="hover:text-primary hover:underline">
                                        Sign in instead
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </AuthNavContext.Provider>
    );
}
