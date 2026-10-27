"use client";

import Link from "next/link";
import { KeyRound, LogIn, UserCheck } from "lucide-react";
import { openAuthScreen, useAuthNav } from "./unified/AuthNav";

/**
 * Sign-up stopped because the WhatsApp number / email already has an account: offer Sign in or
 * Forgot password, prefilled. On the sign-in screen the form changes in place; elsewhere the
 * sign-in screen opens (nothing in the address).
 */
export default function AccountExistsNotice({ email, message }: { email: string; message?: string }) {
    const nav = useAuthNav();
    const shown = email && !email.includes("@") ? `+${email.replace(/\D/g, "")}` : email;
    const buttonClass = "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors";

    const go = (mode: "signin" | "forgot") => {
        if (nav) {
            nav.go(mode, email);
        } else {
            openAuthScreen(mode, email);
            window.location.href = "/auth/login";
        }
    };

    return (
        <div role="alert" className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-2.5">
                <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 text-sm">
                    <p className="font-semibold text-foreground">You already have an account</p>
                    <p className="text-muted-foreground">
                        {message || "An account with these details already exists."}{" "}
                        <span className="break-all font-medium text-foreground">{shown}</span>
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {nav ? (
                    <button type="button" onClick={() => go("signin")} className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`}>
                        <LogIn className="h-4 w-4" /> Sign in
                    </button>
                ) : (
                    <Link href="/auth/login" className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`}>
                        <LogIn className="h-4 w-4" /> Sign in
                    </Link>
                )}
                <button type="button" onClick={() => go("forgot")} className={`${buttonClass} border border-primary/30 bg-white text-primary hover:bg-primary/10`}>
                    <KeyRound className="h-4 w-4" /> Forgot password?
                </button>
            </div>
        </div>
    );
}
