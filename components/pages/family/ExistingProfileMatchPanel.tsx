"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Link2, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    familyApiError,
    familyFieldErrors,
    linkExistingProfile,
    sendLinkExistingOtp,
    type ExistingProfileMatch,
    type FamilyProfile,
} from "@/api/family";
import { familyInputClass } from "./FamilyMemberForm";

const REASONS: Record<string, string> = {
    unit_id: "the same Unit ID",
    email: "the same email",
    phone_name: "the same name and phone number",
};

interface ExistingProfileMatchPanelProps {
    match: ExistingProfileMatch;
    relationship: string;
    relationshipLabel?: string | null;
    idPrefix: string;
    // Linked (or already in the family): show / select that profile.
    onLinked: (profile: FamilyProfile | null, patientId: string | undefined) => void;
    // "Not them": create a new profile with the typed details.
    onCreateNew: () => void;
    onCancel: () => void;
}

/**
 * The person being added is already a patient here. Link that profile to the family instead of a
 * duplicate. With their own login, a code sent to their email confirms they agree.
 */
export default function ExistingProfileMatchPanel({ match, relationship, relationshipLabel, idPrefix, onLinked, onCreateNew, onCancel }: ExistingProfileMatchPanelProps) {
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState<"send" | "link" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const details = [
        match.gender ? match.gender[0].toUpperCase() + match.gender.slice(1) : null,
        match.age != null ? `${match.age}y` : null,
        match.phone_masked ? `Phone ${match.phone_masked}` : null,
        match.unit_id_masked ? `Unit ID ${match.unit_id_masked}` : null,
    ].filter(Boolean).join(" · ");

    const sendCode = async () => {
        if (!match.match_token) return;
        try {
            setBusy("send");
            setError(null);
            await sendLinkExistingOtp(match.match_token);
            setCodeSent(true);
            setCooldown(60);
            toast.success(`Code sent to ${match.email_masked}`);
        } catch (err) {
            setError(familyApiError(err));
        } finally {
            setBusy(null);
        }
    };

    const canLink = match.method === "otp";

    const link = async () => {
        if (!match.match_token || !canLink) return;
        if (!/^\d{4,8}$/.test(code.trim())) {
            setError("Please enter the code from their email.");
            return;
        }
        try {
            setBusy("link");
            setError(null);
            const profile = await linkExistingProfile({
                match_token: match.match_token,
                relationship,
                relationship_label: relationshipLabel || null,
                otp: code.trim(),
            });
            toast.success(`${profile.name} was added to your family profiles`);
            onLinked(profile, profile.patient_id);
        } catch (err) {
            const fields = familyFieldErrors(err);
            setError(fields.otp || fields.match_token || familyApiError(err));
        } finally {
            setBusy(null);
        }
    };

    const buttonClass = "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

    if (match.already_linked) {
        return (
            <div role="status" className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="flex items-start gap-2 text-sm text-[#1F1E1E]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><span className="font-semibold">{match.name}</span> is already in your family profiles.</span>
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onCancel} className={cn(buttonClass, "border border-[#E7E8EB] bg-white hover:border-primary hover:text-primary")}>Back to form</button>
                    <button type="button" onClick={() => onLinked(null, match.patient_id)} className={cn(buttonClass, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                        Use this profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div role="alert" className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-2.5">
                <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="min-w-0 text-sm">
                    <p className="font-semibold text-[#1F1E1E]">This person is already registered</p>
                    <p className="text-[#4D4D4D]">
                        A patient with {REASONS[match.reason ?? ""] ?? "these details"} already has a profile. Link it to your family to manage it, instead of creating a duplicate.
                    </p>
                </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-white px-3 py-2.5 text-sm">
                <p className="font-semibold text-[#1F1E1E]">{match.name}</p>
                {details && <p className="text-xs text-muted-foreground">{details}</p>}
                {match.has_login && <p className="mt-0.5 text-xs text-muted-foreground">Has their own login · {match.email_masked}</p>}
            </div>

            {canLink ? (
                <div className="space-y-2">
                    <p className="text-xs text-[#4D4D4D]">
                        To protect their records we send a code to <span className="font-medium">{match.email_masked}</span>. Ask them for the code to confirm the link.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {codeSent && (
                            <input id={`${idPrefix}-link-otp`} inputMode="numeric" autoComplete="one-time-code" aria-label="Verification code"
                                className={cn(familyInputClass, "h-10 min-w-0 flex-1 tracking-[0.3em]", error && "border-destructive")}
                                value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(null); }} placeholder="6 digit code" />
                        )}
                        <button type="button" onClick={sendCode} disabled={busy !== null || cooldown > 0}
                            className={cn(buttonClass, codeSent ? "border border-[#E7E8EB] bg-white hover:border-primary hover:text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                            {busy === "send" && <Loader2 className="h-4 w-4 animate-spin" />}
                            {cooldown > 0 ? `Resend in ${cooldown}s` : codeSent ? "Resend code" : "Send code to link"}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-xs text-[#4D4D4D]">
                    This profile has no email to verify with, so it cannot be linked here. Please ask the clinic to link it, or create a new profile if this is a different person.
                </p>
            )}

            {error && <p className="text-xs font-medium text-destructive">{error}</p>}

            <div className="space-y-2 border-t border-amber-200 pt-3">
                <div className={cn("grid grid-cols-1 gap-2", canLink && "min-[420px]:grid-cols-2")}>
                    <button type="button" onClick={onCancel} disabled={busy !== null} className={cn(buttonClass, "whitespace-nowrap border border-[#E7E8EB] bg-white hover:border-primary hover:text-primary")}>
                        Back to form
                    </button>
                    {canLink && (
                        <button type="button" onClick={link} disabled={busy !== null || !codeSent}
                            className={cn(buttonClass, "whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90")}>
                            {busy === "link" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            Verify & link
                        </button>
                    )}
                </div>
                <button type="button" onClick={onCreateNew} disabled={busy !== null}
                    className="block w-full text-center text-sm font-medium text-[#4D4D4D] underline-offset-2 hover:text-primary hover:underline">
                    Not them? Create a new profile
                </button>
            </div>
        </div>
    );
}
