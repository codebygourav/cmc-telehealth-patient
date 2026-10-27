"use client";

import { familyApiError, familyFieldErrors, sendMemberLoginPhoneOtp, verifyMemberLoginPhoneOtp, type FamilyProfile } from "@/api/family";
import { usePhoneStatus } from "@/components/auth/PhoneVerificationGate";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { familyInputClass, type FamilyMemberErrors, type FamilyMemberFormValue } from "./FamilyMemberForm";

/**
 * The family profile's WhatsApp number (booking alerts, codes):
 * - "Use my WhatsApp number": the primary account's number (a child, or anyone without WhatsApp);
 * - "A separate WhatsApp number": their own, confirmed with a code on WhatsApp.
 * Sets value.phone (number without country code) and value.login_phone_country.
 */
export default function FamilyWhatsAppField({ value, onChange, errors = {}, idPrefix, profile }: {
    value: FamilyMemberFormValue;
    onChange: (value: FamilyMemberFormValue) => void;
    errors?: FamilyMemberErrors;
    idPrefix: string;
    profile?: FamilyProfile | null;
}) {
    const { data: status } = usePhoneStatus();
    const holderNumber = (status?.verified_phone ? status.verified_phone.slice(-10) : status?.profile_phone || "").replace(/\D/g, "");
    const holderCountry = status?.country_code || "+91";
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState<"send" | "verify" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (timer <= 0) return;
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [timer]);

    // Editing a profile that has its own number: keep it (no new code needed unless it changes).
    useEffect(() => {
        if (!status || !profile?.phone) return;
        if (profile.phone !== holderNumber && value.login_phone_mode === "shared" && !value.login_phone_verified) {
            onChange({ ...value, login_phone_mode: "separate", login_phone_number: profile.phone, login_phone_verified: "existing", phone: profile.phone });
        }
    }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    // Shared: the profile uses the primary account's number.
    useEffect(() => {
        if (value.login_phone_mode === "shared" && holderNumber && value.phone !== holderNumber) {
            onChange({ ...value, phone: holderNumber, login_phone_country: holderCountry });
        }
    }, [value.login_phone_mode, holderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

    const choose = (mode: "shared" | "separate") => {
        setError(null);
        onChange({
            ...value,
            login_phone_mode: mode,
            ...(mode === "separate" ? { phone: "", login_phone_verified: "", login_phone_code_sent: false, login_phone_number: "" } : {}),
        });
    };

    const send = async () => {
        if (!/^\d{6,15}$/.test(value.login_phone_number)) {
            setError("Enter the WhatsApp number without the country code.");
            return;
        }
        try {
            setBusy("send");
            setError(null);
            await sendMemberLoginPhoneOtp(value.login_phone_number, value.login_phone_country);
            onChange({ ...value, login_phone_code_sent: true, login_phone_verified: "" });
            setCode("");
            setTimer(60);
        } catch (err) {
            setError(familyFieldErrors(err).login_phone || familyApiError(err));
        } finally {
            setBusy(null);
        }
    };

    const verify = async () => {
        if (!/^\d{4,8}$/.test(code.trim())) {
            setError("Enter the code from WhatsApp.");
            return;
        }
        try {
            setBusy("verify");
            setError(null);
            const verified = await verifyMemberLoginPhoneOtp(value.login_phone_number, value.login_phone_country, code.trim());
            onChange({ ...value, phone: value.login_phone_number, login_phone_verified: verified || `${value.login_phone_country}${value.login_phone_number}` });
            setCode("");
        } catch (err) {
            setError(familyFieldErrors(err).otp || familyApiError(err));
        } finally {
            setBusy(null);
        }
    };

    const shownError = error || errors.phone || errors.login_phone_number;
    const option = (mode: "shared" | "separate", title: string, text: string) => (
        <label className={cn("flex cursor-pointer items-start gap-2 rounded-md border bg-white p-3 text-sm transition-colors", value.login_phone_mode === mode ? "border-primary ring-1 ring-primary/20" : "border-[#E7E8EB] hover:border-primary/40")}>
            <input type="radio" name={`${idPrefix}-wa-mode`} className="mt-0.5 accent-[var(--primary)]" checked={value.login_phone_mode === mode} onChange={() => choose(mode)} />
            <span className="min-w-0">
                <span className="block font-semibold text-[#1F1E1E]">{title}</span>
                <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
        </label>
    );
    const button = "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="@container space-y-3 rounded-md border border-[#E7E8EB] bg-[#F9FAFB] p-3 sm:p-4">
            <div className="flex items-start gap-2">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1F1E1E]">WhatsApp number <span className="text-destructive">*</span></p>
                    <p className="text-xs text-muted-foreground">Booking alerts and codes for this person come to this WhatsApp number.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 @2xl:grid-cols-2">
                {option("shared", "Use my WhatsApp number", holderNumber ? `${holderCountry} ${holderNumber}. For a child or anyone without their own WhatsApp.` : "For a child or anyone without their own WhatsApp.")}
                {option("separate", "A separate WhatsApp number", "Their own number, confirmed with a code on WhatsApp.")}
            </div>

            {value.login_phone_mode === "separate" && (
                value.login_phone_verified ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/20 bg-white px-3 py-2.5">
                        <p className="flex items-center gap-2 text-sm font-medium text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                            {value.login_phone_verified === "existing" ? `${value.login_phone_country} ${value.login_phone_number}` : value.login_phone_verified}
                            <span className="font-normal text-muted-foreground">{value.login_phone_verified === "existing" ? "current number" : "verified"}</span>
                        </p>
                        <button type="button" onClick={() => onChange({ ...value, phone: "", login_phone_verified: "", login_phone_code_sent: false })}
                            className="text-sm font-medium text-primary hover:underline">Change</button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input aria-label="Country code" className={cn(familyInputClass, "w-20 shrink-0")} value={value.login_phone_country}
                                onChange={(e) => onChange({ ...value, login_phone_country: e.target.value.replace(/[^\d+]/g, "").slice(0, 5), login_phone_code_sent: false })} />
                            <input id={`${idPrefix}-wa-number`} inputMode="numeric" className={cn(familyInputClass, "min-w-0 flex-1", shownError && "border-destructive")}
                                placeholder="98765 43210" maxLength={15} value={value.login_phone_number}
                                onChange={(e) => onChange({ ...value, login_phone_number: e.target.value.replace(/\D/g, ""), login_phone_code_sent: false })} />
                            <button type="button" onClick={send} disabled={busy !== null || timer > 0}
                                className={cn(button, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                                {busy === "send" && <Loader2 className="h-4 w-4 animate-spin" />}
                                {timer > 0 ? `${timer}s` : value.login_phone_code_sent ? "Resend" : "Send code"}
                            </button>
                        </div>
                        {value.login_phone_code_sent && (
                            <div className="flex gap-2">
                                <input inputMode="numeric" autoComplete="one-time-code" className={cn(familyInputClass, "min-w-0 flex-1 tracking-[0.3em]")}
                                    placeholder="6 digit code from WhatsApp" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} />
                                <button type="button" onClick={verify} disabled={busy !== null}
                                    className={cn(button, "border border-primary bg-white text-primary hover:bg-primary/5")}>
                                    {busy === "verify" && <Loader2 className="h-4 w-4 animate-spin" />} Verify
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}
            {shownError && <p className="text-xs font-medium text-destructive">{shownError}</p>}
        </div>
    );
}
