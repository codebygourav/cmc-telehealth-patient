"use client";

/**
 * Confirm a mobile number with a WhatsApp code: number first, then the 6-digit code.
 * Used when an account verifies its number (first time) and to change a verified number.
 */

import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/constants/countries";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import OtpBoxes from "./OtpBoxes";

export interface VerifiedPhone {
    phone: string;
    country_code: string;
    verified_phone: string;
}

const apiError = (err: any, fallback: string) => {
    const data = err?.response?.data;
    const fieldErrors = data?.errors && typeof data.errors === "object" ? Object.values(data.errors).flat() : [];
    return (data?.errors?.message as string) || (fieldErrors.find((e) => typeof e === "string") as string) || data?.message || fallback;
};

export default function MobileVerifyForm({
    initialCountryCode,
    initialNumber,
    currentVerified,
    submitLabel = "Verify",
    onVerified,
}: {
    initialCountryCode?: string | null;
    initialNumber?: string | null;
    /** The account's verified number (digits with country code): changing to the same one is refused. */
    currentVerified?: string | null;
    submitLabel?: string;
    onVerified: (result: VerifiedPhone, message?: string) => void | Promise<void>;
}) {
    const [countryIso, setCountryIso] = useState("IN");
    const [number, setNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"number" | "code">("number");
    const [sentTo, setSentTo] = useState("");
    const [timer, setTimer] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const country = COUNTRIES.find((c) => c.code === initialCountryCode);
        if (country) setCountryIso(country.iso);
        if (initialNumber) setNumber(initialNumber.replace(/\D/g, ""));
    }, [initialCountryCode, initialNumber]);

    useEffect(() => {
        if (timer <= 0) return;
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [timer]);

    const country = COUNTRIES.find((c) => c.iso === countryIso) || COUNTRIES[0];
    const fullNumber = `${country.code.replace(/\D/g, "")}${number.replace(/^0+/, "")}`;

    const sendCode = async () => {
        setError(null);
        if (!/^\d{6,15}$/.test(number)) {
            setError("Enter your mobile number without the country code.");
            return;
        }
        if (currentVerified && fullNumber === currentVerified) {
            setError("This is already your verified number. Enter the new number.");
            return;
        }
        setBusy(true);
        try {
            const { data } = await api.post("/auth/phone/send-otp", { phone: number, country_code: country.code });
            setSentTo(data?.data?.sent_to || `${country.code} ${number}`);
            setOtp("");
            setStep("code");
            setTimer(60);
        } catch (err) {
            setError(apiError(err, "Could not send the code. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    const verify = async (code = otp) => {
        setError(null);
        if (code.length < 6) {
            setError("Enter the 6-digit code from WhatsApp.");
            return;
        }
        setBusy(true);
        try {
            // The country chosen here becomes the patient's country (fees for that country).
            const { data } = await api.post("/auth/phone/verify", {
                phone: number,
                country_code: country.code,
                country_iso: country.iso,
                country_name: country.name,
                otp: code,
            });
            await onVerified(
                { phone: data?.data?.phone ?? number, country_code: data?.data?.country_code ?? country.code, verified_phone: data?.data?.verified_phone ?? fullNumber },
                data?.message,
            );
        } catch (err) {
            setOtp("");
            setError(apiError(err, "Invalid or expired code."));
        } finally {
            setBusy(false);
        }
    };

    const fieldClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base sm:text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

    return (
        <div className="space-y-4">
            {step === "number" ? (
                <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); sendCode(); }}
                >
                    <div className="space-y-1.5">
                        <label htmlFor="mv-number" className="text-sm font-medium text-slate-700">Mobile number (WhatsApp)</label>
                        <div className="flex gap-2">
                            <select
                                aria-label="Country code"
                                value={countryIso}
                                onChange={(e) => { setCountryIso(e.target.value); setError(null); }}
                                disabled={busy}
                                className={cn(fieldClass, "w-[6.5rem] shrink-0 px-2")}
                            >
                                {COUNTRIES.map((c) => (
                                    <option key={`${c.iso}-${c.code}`} value={c.iso}>{c.flag} {c.code}</option>
                                ))}
                            </select>
                            <input
                                id="mv-number"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                maxLength={15}
                                value={number}
                                onChange={(e) => { setNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                                disabled={busy}
                                placeholder="98765 43210"
                                className={cn(fieldClass, "min-w-0 flex-1", error && "border-destructive")}
                            />
                        </div>
                    </div>
                    {error && <ErrorLine message={error} />}
                    <Button type="submit" className="h-11 w-full" disabled={busy}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        {busy ? "Sending…" : "Send code on WhatsApp"}
                    </Button>
                </form>
            ) : (
                <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); verify(); }}
                >
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                        Enter the 6-digit code sent on WhatsApp to{" "}
                        <span className="font-semibold text-slate-900 whitespace-nowrap">{sentTo}</span>{" "}
                        <button
                            type="button"
                            onClick={() => { setStep("number"); setError(null); setOtp(""); }}
                            className="font-medium text-primary hover:underline"
                            disabled={busy}
                        >
                            Change
                        </button>
                    </div>
                    <OtpBoxes value={otp} onChange={(v) => { setOtp(v); setError(null); }} disabled={busy} invalid={!!error} autoFocus onComplete={(v) => verify(v)} />
                    {error && <ErrorLine message={error} />}
                    <Button type="submit" className="h-11 w-full" disabled={busy || otp.length < 6}>
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {busy ? "Verifying…" : submitLabel}
                    </Button>
                    <p className="text-center text-sm text-slate-500">
                        Didn&apos;t get it?{" "}
                        <button
                            type="button"
                            onClick={sendCode}
                            disabled={busy || timer > 0}
                            className={cn("font-medium", timer > 0 ? "text-slate-400" : "text-primary hover:underline")}
                        >
                            {timer > 0 ? `Resend in ${timer}s` : "Resend code"}
                        </button>
                    </p>
                </form>
            )}
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
