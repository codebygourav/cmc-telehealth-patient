"use client";

import OtpBoxes from "@/components/auth/OtpBoxes";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/constants/countries";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const fieldClass = "h-11 w-full rounded-lg border border-input bg-accent/30 px-3 text-base sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const apiMessage = (err: any, fallback: string) => {
    const data = err?.response?.data;
    const fieldErrors = data?.errors && typeof data.errors === "object" ? Object.values(data.errors).flat() : [];
    return (data?.errors?.message as string) || (fieldErrors.find((e) => typeof e === "string") as string) || data?.message || fallback;
};

/**
 * During forgot password: the account's number is verified on another account, so it adds its
 * own WhatsApp number (code on WhatsApp). Saved and verified on the account, then the password.
 */
/** onDone gets the new number ("+919876543210"): the password step continues with it. */
export default function NewNumberStep({ accountEmail, resetToken, onDone }: { accountEmail: string; resetToken: string; onDone: (newPhone: string) => void }) {
    const [countryIso, setCountryIso] = useState("IN");
    const [number, setNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const country = COUNTRIES.find((c) => c.iso === countryIso) || COUNTRIES[0];

    useEffect(() => {
        if (timer <= 0) return;
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [timer]);

    const base = { account_email: accountEmail, reset_token: resetToken, phone: number, country_code: country.code };

    const send = async () => {
        if (!/^\d{6,15}$/.test(number)) {
            setError("Enter your WhatsApp number without the country code.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const { data } = await api.post("/auth/forgot-password/new-number/send-otp", base);
            setSentTo(data?.data?.sent_to || `${country.code} ${number}`);
            setOtp("");
            setTimer(60);
        } catch (err) {
            setError(apiMessage(err, "Could not send the code. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    const verify = async (code = otp) => {
        if (code.length < 6) {
            setError("Enter the 6-digit code from WhatsApp.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const { data } = await api.post("/auth/forgot-password/new-number/verify", { ...base, otp: code, country_iso: country.iso, country_name: country.name });
            onDone(`+${data?.data?.verified_phone ?? `${country.code.replace(/\D/g, "")}${number}`}`);
        } catch (err) {
            setOtp("");
            setError(apiMessage(err, "Invalid or expired code."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); sentTo ? verify() : send(); }}>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                Add your own WhatsApp number. It must not be used by another account; it becomes your sign-in number.
            </div>
            {!sentTo ? (
                <div className="space-y-1.5">
                    <label htmlFor="nn-number" className="text-sm font-medium text-muted-foreground">Your WhatsApp Number <span className="text-destructive">*</span></label>
                    <div className="flex gap-2">
                        <select aria-label="Country code" value={countryIso} onChange={(e) => { setCountryIso(e.target.value); setError(null); }} disabled={busy} className={cn(fieldClass, "w-[6.5rem] shrink-0 px-2")}>
                            {COUNTRIES.map((c) => (
                                <option key={`${c.iso}-${c.code}`} value={c.iso}>{c.flag} {c.code}</option>
                            ))}
                        </select>
                        <input id="nn-number" type="tel" inputMode="numeric" maxLength={15} value={number}
                            onChange={(e) => { setNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                            disabled={busy} placeholder="98765 43210" className={cn(fieldClass, "min-w-0 flex-1", error && "border-destructive")} />
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                        Code sent on WhatsApp to <span className="font-semibold text-foreground">{sentTo}</span>{" "}
                        <button type="button" onClick={() => { setSentTo(null); setError(null); }} className="font-medium text-primary hover:underline" disabled={busy}>Change</button>
                    </p>
                    <OtpBoxes value={otp} onChange={(v) => { setOtp(v); setError(null); }} disabled={busy} invalid={!!error} autoFocus onComplete={(v) => verify(v)} />
                </div>
            )}
            {error && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={busy || (!!sentTo && otp.length < 6)}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {sentTo ? (busy ? "Verifying…" : "Verify and continue") : (busy ? "Sending…" : "Send code on WhatsApp")}
            </Button>
            {sentTo && (
                <p className="text-center text-sm text-muted-foreground">
                    <button type="button" onClick={send} disabled={busy || timer > 0} className={cn("font-medium", timer > 0 ? "text-muted-foreground" : "text-primary hover:underline")}>
                        {timer > 0 ? `Resend in ${timer}s` : "Resend code"}
                    </button>
                </p>
            )}
        </form>
    );
}
