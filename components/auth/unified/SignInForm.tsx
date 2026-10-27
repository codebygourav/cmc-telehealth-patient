"use client";

import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/context/userContext";
import { consumePostAuthRedirect } from "@/lib/authRedirect";
import { getUserCountry } from "@/lib/location";
import { useLogin } from "@/mutations/useLogin";
import type { User, UserRole } from "@/types/user-context";
import Link from "next/link";
import { useState } from "react";

interface LoginFormData {
    email: string;
    password: string;
}

const FIELDS = [
    {
        // Mobile number first; email still works for older accounts.
        name: "email",
        type: "login",
        label: "WhatsApp Number or Email",
        placeholder: "e.g. 98765 43210 or name@mail.com",
        required: true,
    },
    {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "Enter your password",
        required: true,
    },
];

/** Sign in with mobile number or email + password; signs the patient in and goes back to where they were. */
export default function SignInForm({ onForgotPassword, initialLogin = "" }: { onForgotPassword: () => void; initialLogin?: string }) {
    const { login } = useAuth();
    const { mutate: signIn, isPending, isError, error } = useLogin();
    const [verifiedLink, setVerifiedLink] = useState<string | null>(null);
    // WhatsApp number on more than one account: the email of the account is asked too.
    const [needEmail, setNeedEmail] = useState(false);
    const [accountEmail, setAccountEmail] = useState("");
    const [accountEmailError, setAccountEmailError] = useState<string | null>(null);

    const handleLogin = async (formData: LoginFormData): Promise<void> => {
        setVerifiedLink(null);
        setAccountEmailError(null);
        if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail.trim())) {
            setAccountEmailError("Enter the email of your account");
            return;
        }
        // Never wait long for the location lookup: signing in must stay quick.
        const currentLocation = await Promise.race([
            getUserCountry(),
            new Promise<string>((resolve) => setTimeout(() => resolve(""), 1500)),
        ]);

        return new Promise((resolve) => {
            signIn({ ...formData, current_location: currentLocation, ...(needEmail ? { account_email: accountEmail.trim() } : {}) }, {
                onSuccess: async (responseData) => {
                    const payload = (responseData as any)?.data || responseData;
                    const user = (payload as any)?.user || payload;
                    const token = (responseData as any)?.token || (payload as any)?.token;
                    if (!user) {
                        resolve();
                        return;
                    }

                    const userData: User = {
                        id: user.id || "",
                        first_name: user.first_name || "",
                        last_name: user.last_name || "",
                        email: user.email || "",
                        role: user.role as UserRole,
                        gender: user.gender,
                        date_of_birth: user.date_of_birth,
                        mobile_no: user.phone,
                        patient_id: user.patient_id,
                        doctor_id: user.doctor_id,
                        status: user.status ?? "",
                        phone_verified: Boolean(user.phone_verified),
                        requires_phone_verification: Boolean(user.requires_phone_verification),
                        avatar: user.avatar,
                        address: {
                            address: user.address?.address,
                            area: user.address?.area,
                            city: user.address?.city,
                            landmark: user.address?.landmark,
                            pincode: user.address?.pincode,
                            state: user.address?.state,
                            bio: user.address?.bio,
                        },
                    };

                    await login(userData, token || "");
                    window.location.href = consumePostAuthRedirect();
                    resolve();
                },
                onError: (err: any) => {
                    const data = err?.response?.data;
                    if (data?.code === "ACCOUNT_EMAIL_REQUIRED" || data?.code === "ACCOUNT_EMAIL_MISMATCH") {
                        setNeedEmail(true);
                        setAccountEmailError(data?.errors?.message || "Enter the email of your account");
                        resolve();
                        return;
                    }
                    const status = data?.errors?.status || data?.data?.status || "";
                    if (data?.code === "ALREADY_VERIFIED" || status === "verified") {
                        const sent = err?.config?.data ? JSON.parse(err.config.data).email : "";
                        try {
                            if (sent) localStorage.setItem("reg_email", sent);
                        } catch {
                            // storage unavailable
                        }
                        setVerifiedLink(data?.errors?.message || data?.message || "Already verified. Please complete your profile.");
                    }
                    resolve();
                },
            });
        });
    };

    const errorText = isError && !verifiedLink && !accountEmailError
        ? ((error as any)?.response?.data?.errors?.message ?? (error as any)?.response?.data?.message ?? (error as any)?.message ?? "Sign in failed. Please check your details.")
        : null;

    return (
        <div className="space-y-4">
            {errorText && (
                <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {errorText}
                </div>
            )}
            {verifiedLink && (
                <div className="flex flex-col gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3 text-left">
                    <p className="text-sm text-foreground">{verifiedLink}</p>
                    <Link href="/auth/complete-profile" className="w-fit text-sm font-semibold text-primary hover:underline">
                        Complete your profile →
                    </Link>
                </div>
            )}
            {needEmail && (
                <div className="space-y-1.5">
                    <label htmlFor="account-email" className="text-sm font-medium text-muted-foreground">
                        Email of your account <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="account-email"
                        type="email"
                        autoComplete="email"
                        value={accountEmail}
                        onChange={(e) => { setAccountEmail(e.target.value); setAccountEmailError(null); }}
                        placeholder="name@mail.com"
                        className="flex h-10 w-full rounded-md border border-input bg-accent/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <p className={accountEmailError ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
                        {accountEmailError || "This WhatsApp number is on more than one account; your email tells us which one is yours."}
                    </p>
                </div>
            )}
            <AuthForm
                fields={FIELDS}
                buttonText={isPending ? "Signing in..." : "Sign in"}
                onSubmit={handleLogin}
                showForgotPassword
                onForgotPassword={onForgotPassword}
                defaultValues={{ email: initialLogin }}
            />
        </div>
    );
}
