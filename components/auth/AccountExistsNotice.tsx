"use client";

import Link from "next/link";
import { KeyRound, LogIn, UserCheck } from "lucide-react";

/** Sign-up stopped because the email already has an account: offer Sign in / Forgot password. */
export default function AccountExistsNotice({ email, message }: { email: string; message?: string }) {
    const forgotHref = `/auth/forgot-password?email=${encodeURIComponent(email)}`;

    return (
        <div role="alert" className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-2.5">
                <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 text-sm">
                    <p className="font-semibold text-foreground">You already have an account</p>
                    <p className="text-muted-foreground">
                        {message || "An account with this email already exists."}{" "}
                        <span className="break-all font-medium text-foreground">{email}</span>
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link
                    href="/auth/login"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <LogIn className="h-4 w-4" /> Sign in
                </Link>
                <Link
                    href={forgotHref}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                    <KeyRound className="h-4 w-4" /> Forgot password?
                </Link>
            </div>
        </div>
    );
}
