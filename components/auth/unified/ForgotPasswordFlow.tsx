"use client";

import OtpBoxes from "@/components/auth/OtpBoxes";
import ResetPasswordForm from "@/components/auth/forgot-password/ResetPasswordForm";
import VerifyOtpForm from "@/components/auth/forgot-password/VerifyOtpForm";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/constants/countries";
import api from "@/lib/axios";
import { toInternational } from "@/lib/loginId";
import { cn } from "@/lib/utils";
import { useSendOtp } from "@/mutations/auth/useForgotPassword";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";
import NewNumberStep from "./NewNumberStep";
import StepHeading from "./StepHeading";

/**
 * email     → the account
 * verified  → it has a verified WhatsApp number: code there (shown masked), nothing to type
 * phone     → not verified: the WhatsApp number on the profile gets the code
 * emailCode → "verify with another WhatsApp number": a code to the account email proves it is theirs
 * newNumber → add + verify their own WhatsApp number (also after a profile number another account owns)
 * verify / reset → WhatsApp code, then the new password
 */
type Step = "email" | "verified" | "phone" | "emailCode" | "verify" | "newNumber" | "reset";

const fieldClass = "h-11 w-full rounded-lg border border-input bg-accent/30 px-3 text-base sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const apiMessage = (err: any, fallback: string) => {
    const data = err?.response?.data;
    const fieldErrors = data?.errors && typeof data.errors === "object" ? Object.values(data.errors).flat() : [];
    return (data?.errors?.message as string) || (fieldErrors.find((e) => typeof e === "string") as string) || data?.message || fallback;
};

export default function ForgotPasswordFlow({ onDone, initialLogin = "" }: { onDone: () => void; initialLogin?: string }) {
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState(initialLogin.includes("@") ? initialLogin : "");
    const [maskedVerified, setMaskedVerified] = useState("");
    // The number saved on the profile is verified on another account: no code goes there.
    const [savedTaken, setSavedTaken] = useState(false);
    const [countryIso, setCountryIso] = useState("IN");
    const [number, setNumber] = useState(initialLogin && !initialLogin.includes("@") ? initialLogin.replace(/\D/g, "").slice(-10) : "");
    // What identifies the code's destination for verify / reset: a number, or the email (verified number).
    const [target, setTarget] = useState("");
    const [sentTo, setSentTo] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [emailCodeSent, setEmailCodeSent] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [managed, setManaged] = useState<{ isManaged: boolean; holderName: string | null }>({ isManaged: false, holderName: null });
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const { mutate: sendOtp, isPending } = useSendOtp();

    const country = COUNTRIES.find((c) => c.iso === countryIso) || COUNTRIES[0];
    const accountEmail = email.trim().toLowerCase();
    const go = (next: Step) => { setError(null); setStep(next); };

    const sendWhatsAppCode = (to: string) => {
        setError(null);
        sendOtp({ email: to, account_email: accountEmail }, {
            onSuccess: (res: any) => {
                setTarget(to);
                setSentTo(res?.data?.sent_to || to);
                go("verify");
            },
            onError: (err: any) => setError(apiMessage(err, "Could not send the code. Please try again.")),
        });
    };

    const anotherNumberLink = (
        <button type="button" onClick={() => { setEmailCode(""); setEmailCodeSent(""); go("emailCode"); }}
            className="block w-full text-center text-sm font-medium text-primary hover:underline">
            Verify {accountEmail} with another WhatsApp number
        </button>
    );

    if (step === "email") {
        const next = async () => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
                setError("Enter the email of your account.");
                return;
            }
            setBusy(true);
            setError(null);
            try {
                const { data } = await api.post("/auth/forgot-password/lookup", { account_email: accountEmail });
                setSavedTaken(Boolean(data?.data?.saved_phone_taken));
                if (data?.data?.has_verified_phone) {
                    setMaskedVerified(data.data.verified_phone_masked || "");
                    go("verified");
                } else if (data?.data?.saved_phone_taken) {
                    setEmailCode("");
                    setEmailCodeSent("");
                    go("emailCode");
                } else {
                    go("phone");
                }
            } catch (err) {
                setError(apiMessage(err, "Could not check this email. Please try again."));
            } finally {
                setBusy(false);
            }
        };

        return (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); next(); }}>
                <StepHeading title="Forgot password?" subtitle="Enter the email of your account." />
                <div className="space-y-1.5">
                    <label htmlFor="fp-email" className="text-sm font-medium text-muted-foreground">Email <span className="text-destructive">*</span></label>
                    <input id="fp-email" type="email" autoComplete="email" value={email} disabled={busy}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="name@mail.com" className={cn(fieldClass, error && "border-destructive")} />
                </div>
                {error && <ErrorLine message={error} />}
                <Button type="submit" className="h-11 w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Continue
                </Button>
            </form>
        );
    }

    if (step === "verified") {
        return (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); sendWhatsAppCode(accountEmail); }}>
                <StepHeading title="Send the code" subtitle={<>For <span className="break-all font-semibold text-foreground">{accountEmail}</span></>} />
                <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 px-3 py-3">
                    <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 text-sm">
                        <p className="text-muted-foreground">Your verified WhatsApp number</p>
                        <p className="font-semibold text-foreground">{maskedVerified}</p>
                    </div>
                </div>
                {error && <ErrorLine message={error} />}
                <Button type="submit" className="h-11 w-full" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPending ? "Sending…" : "Send code on WhatsApp"}
                </Button>
                {anotherNumberLink}
                <button type="button" onClick={() => go("email")} className="block w-full text-center text-sm text-muted-foreground hover:underline">
                    Use a different email
                </button>
            </form>
        );
    }

    if (step === "phone") {
        const send = () => {
            if (!/^\d{6,15}$/.test(number)) {
                setError("Enter the WhatsApp number of your account, without the country code.");
                return;
            }
            sendWhatsAppCode(toInternational(country.code, number));
        };

        return (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <StepHeading
                    title="Your WhatsApp number"
                    subtitle={<>Enter the WhatsApp number saved on <span className="break-all font-semibold text-foreground">{accountEmail}</span>. We will send the code there.</>}
                />
                <div className="space-y-1.5">
                    <label htmlFor="fp-number" className="text-sm font-medium text-muted-foreground">WhatsApp Number <span className="text-destructive">*</span></label>
                    <div className="flex gap-2">
                        <select aria-label="Country code" value={countryIso} onChange={(e) => { setCountryIso(e.target.value); setError(null); }} disabled={isPending} className={cn(fieldClass, "w-[6.5rem] shrink-0 px-2")}>
                            {COUNTRIES.map((c) => (
                                <option key={`${c.iso}-${c.code}`} value={c.iso}>{c.flag} {c.code}</option>
                            ))}
                        </select>
                        <input id="fp-number" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={15} value={number}
                            onChange={(e) => { setNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                            disabled={isPending} placeholder="98765 43210" className={cn(fieldClass, "min-w-0 flex-1", error && "border-destructive")} />
                    </div>
                </div>
                {error && <ErrorLine message={error} />}
                <Button type="submit" className="h-11 w-full" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPending ? "Sending…" : "Send code on WhatsApp"}
                </Button>
                {/* The number on the profile is not theirs / used by someone else: verify with a new one. */}
                <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-center text-sm">
                    <p className="mb-1 text-muted-foreground">Don&apos;t have that number, or it&apos;s used by another account?</p>
                    {anotherNumberLink}
                </div>
                <button type="button" onClick={() => go("email")} className="block w-full text-center text-sm text-muted-foreground hover:underline">
                    Use a different email
                </button>
            </form>
        );
    }

    if (step === "emailCode") {
        const sendEmailCode = async () => {
            setBusy(true);
            setError(null);
            try {
                const { data } = await api.post("/auth/forgot-password/email-code/send", { account_email: accountEmail });
                setEmailCodeSent(data?.data?.sent_to || accountEmail);
                setEmailCode("");
            } catch (err) {
                setError(apiMessage(err, "Could not send the code. Please try again."));
            } finally {
                setBusy(false);
            }
        };
        const verifyEmailCode = async (code = emailCode) => {
            if (code.length < 6) {
                setError("Enter the 6-digit code from your email.");
                return;
            }
            setBusy(true);
            setError(null);
            try {
                const { data } = await api.post("/auth/forgot-password/email-code/verify", { account_email: accountEmail, otp: code });
                setResetToken(data?.data?.reset_token || "");
                go("newNumber");
            } catch (err) {
                setEmailCode("");
                setError(apiMessage(err, "Invalid or expired code."));
            } finally {
                setBusy(false);
            }
        };

        return (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); emailCodeSent ? verifyEmailCode() : sendEmailCode(); }}>
                <StepHeading title="Confirm it's your account" subtitle={<>First we send a code to <span className="break-all font-semibold text-foreground">{accountEmail}</span>. Then you add your WhatsApp number.</>} />
                {savedTaken && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                        The WhatsApp number saved on this account is already verified on another account, so we can&apos;t send a code there. Add your own WhatsApp number instead.
                    </div>
                )}
                {emailCodeSent && (
                    <div className="space-y-3">
                        <p className="text-center text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-semibold text-foreground">{emailCodeSent}</span></p>
                        <OtpBoxes value={emailCode} onChange={(v) => { setEmailCode(v); setError(null); }} disabled={busy} invalid={!!error} autoFocus onComplete={(v) => verifyEmailCode(v)} />
                    </div>
                )}
                {error && <ErrorLine message={error} />}
                <Button type="submit" className="h-11 w-full" disabled={busy || (!!emailCodeSent && emailCode.length < 6)}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {emailCodeSent ? (busy ? "Checking…" : "Continue") : (busy ? "Sending…" : "Send code to my email")}
                </Button>
                {emailCodeSent && (
                    <button type="button" onClick={sendEmailCode} disabled={busy} className="block w-full text-center text-sm font-medium text-primary hover:underline">Resend code</button>
                )}
                <button type="button" onClick={() => go(savedTaken ? "email" : "phone")} className="block w-full text-center text-sm text-muted-foreground hover:underline">
                    Back
                </button>
            </form>
        );
    }

    if (step === "verify") {
        return (
            <div className="space-y-5">
                <StepHeading title="Enter the code" subtitle={<>We sent a 6-digit code on WhatsApp to <span className="font-semibold text-foreground">{sentTo}</span>.</>} />
                <VerifyOtpForm
                    email={target}
                    accountEmail={accountEmail}
                    onBack={() => go(maskedVerified ? "verified" : "phone")}
                    onSuccess={(token, isManaged, holderName, needsNewNumber) => {
                        setResetToken(token);
                        setManaged({ isManaged: Boolean(isManaged), holderName: holderName || null });
                        go(needsNewNumber ? "newNumber" : "reset");
                    }}
                />
            </div>
        );
    }

    if (step === "newNumber") {
        return (
            <div className="space-y-5">
                <StepHeading title="Add your WhatsApp number" subtitle={<>For <span className="break-all font-semibold text-foreground">{accountEmail}</span>. Then you set your new password.</>} />
                <NewNumberStep accountEmail={accountEmail} resetToken={resetToken} onDone={(newPhone) => { setTarget(newPhone); go("reset"); }} />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <StepHeading title="Set a new password" subtitle="Use a password you haven't used before." />
            <ResetPasswordForm email={target} accountEmail={accountEmail} resetToken={resetToken} isManaged={managed.isManaged} holderName={managed.holderName} onDone={onDone} />
        </div>
    );
}

function ErrorLine({ message }: { message: string }) {
    return (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
        </p>
    );
}
