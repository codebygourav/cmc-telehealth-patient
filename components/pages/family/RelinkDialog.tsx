"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SheetDialog from "@/components/custom/SheetDialog";
import { familyApiError, relinkProfile, sendRelinkOtp, type FamilyProfile } from "@/api/family";

const maskEmail = (email?: string | null) => {
    if (!email || !email.includes("@")) return null;
    const [name, domain] = email.split("@");
    return `${name.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(6, name.length - 1)))}@${domain}`;
};

interface RelinkDialogProps {
    profile: FamilyProfile | null;
    onClose: () => void;
    /** Linked again: refresh the list (their details can be edited from now on). */
    onLinked: (profile: FamilyProfile) => void;
}

/** Link an unlinked profile again: a code goes to the member's own email, they share it, you enter it. */
export default function RelinkDialog({ profile, onClose, onLinked }: RelinkDialogProps) {
    const [sentMessage, setSentMessage] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        setSentMessage(null);
        setOtp("");
        setError(null);
    }, [profile?.patient_id]);

    if (!profile) return null;
    const email = profile.login_email || profile.email;
    const masked = maskEmail(email);

    const send = async () => {
        try {
            setSending(true);
            setError(null);
            setSentMessage(await sendRelinkOtp(profile.patient_id));
        } catch (err) {
            setError(familyApiError(err));
        } finally {
            setSending(false);
        }
    };

    const verify = async () => {
        if (!/^\d{4,8}$/.test(otp.trim())) {
            setError("Please enter the code from the email.");
            return;
        }
        try {
            setLinking(true);
            setError(null);
            await relinkProfile(profile.patient_id, otp.trim());
            toast.success(`${profile.name} is linked to your family again. You can now edit their details.`);
            onLinked(profile);
        } catch (err) {
            setError(familyApiError(err));
        } finally {
            setLinking(false);
        }
    };

    return (
        <SheetDialog
            open={!!profile}
            onOpenChange={(open) => !open && onClose()}
            title={`Link ${profile.name} again`}
            description="To protect their records, they confirm the link with a code sent to their own email."
            footer={
                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <Button variant="outline" className="h-10" onClick={onClose} disabled={sending || linking}>Cancel</Button>
                    {sentMessage ? (
                        <Button className="btn-primary-cta h-10" onClick={verify} disabled={linking || !otp.trim()}>
                            {linking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Linking...</> : <><Link className="mr-1.5 h-4 w-4" /> Verify &amp; link</>}
                        </Button>
                    ) : (
                        <Button className="btn-primary-cta h-10" onClick={send} disabled={sending || !masked}>
                            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Mail className="mr-1.5 h-4 w-4" /> Send code</>}
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                {/* The profile being linked (read only until it is linked again) */}
                <div className="rounded-lg border border-[#E7E8EB] bg-[#F9FAFB] p-3 text-sm">
                    <p className="font-semibold text-[#1F1E1E]">
                        {profile.name}
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{profile.relationship_label}</span>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                        {[profile.phone, profile.unit_id ? `Unit ID ${profile.unit_id}` : null].filter(Boolean).join(" · ") || "—"}
                    </p>
                </div>

                <ol className="space-y-2 text-sm text-[#4D4D4D]">
                    <li className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
                        We send a code to {masked ? <strong className="text-[#1F1E1E]">{masked}</strong> : "their email"}.</li>
                    <li className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">2</span>
                        Ask {profile.first_name || profile.name} for the code and enter it below.</li>
                    <li className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">3</span>
                        After linking you can book for them and edit their details again.</li>
                </ol>

                {!masked && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        This profile has no email to send a code to. Please ask the clinic to link it.
                    </p>
                )}

                {sentMessage && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-sm text-primary"><ShieldCheck className="h-4 w-4" /> {sentMessage}</p>
                        <label htmlFor="relink-otp" className="block text-sm font-semibold text-[#1F1E1E]">Verification code</label>
                        <input
                            id="relink-otp"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            value={otp}
                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(null); }}
                            placeholder="Enter the code"
                            className="h-11 w-full rounded-md border border-[#E7E8EB] px-3 text-base tracking-[0.3em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        <button type="button" onClick={send} disabled={sending} className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                            {sending ? "Sending..." : "Send a new code"}
                        </button>
                    </div>
                )}

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            </div>
        </SheetDialog>
    );
}
