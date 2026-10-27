"use client";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthPanel from "@/components/auth/unified/AuthPanel";

// Sign in, create a new account and forgot password: one screen, the form changes in place.
export default function LoginPage() {
    return (
        <AuthLayout title="" subtitle="" bannerImage="/assets/images/login-banner.png" bare>
            <AuthPanel />
        </AuthLayout>
    );
}
