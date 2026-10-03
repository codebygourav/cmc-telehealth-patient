"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    changeMemberPassword,
    familyApiError,
    familyFieldErrors,
    memberLoginEmailVerified,
    sendMemberLoginOtp,
    sendMemberPasswordOtp,
    verifyMemberLoginOtp,
    type FamilyProfile,
} from "@/api/family";
import { FormField, familyInputClass, type FamilyMemberErrors, type FamilyMemberFormValue } from "./FamilyMemberForm";

const RESEND_SECONDS = 60;
const isEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

const PasswordInput = ({ id, value, onChange, invalid, placeholder = "At least 8 characters" }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; placeholder?: string }) => {
    const [shown, setShown] = useState(false);
    return (
        <div className="relative">
            <input id={id} type={shown ? "text" : "password"} autoComplete="new-password" className={cn(familyInputClass, "pr-10", invalid && "border-destructive")}
                value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={64} />
            <button type="button" onClick={() => setShown((v) => !v)} aria-label={shown ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]">
                {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
};

// Resend countdown after a code was sent.
const useCooldown = () => {
    const [left, setLeft] = useState(0);
    useEffect(() => {
        if (left <= 0) return;
        const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [left]);
    return [left, () => setLeft(RESEND_SECONDS)] as const;
};

interface MemberLoginSectionProps {
    value: FamilyMemberFormValue;
    onChange: (value: FamilyMemberFormValue) => void;
    errors?: FamilyMemberErrors;
    idPrefix: string;
    profile?: FamilyProfile | null;
    onEmailTaken?: (email: string) => void;
}

/**
 * The family member's own login.
 * - No login yet: email -> code sent to it -> verified -> password (saved with the member).
 * - Has a login: change their password with a code sent to their email.
 */
export default function MemberLoginSection({ value, onChange, errors = {}, idPrefix, profile, onEmailTaken }: MemberLoginSectionProps) {
    if (profile?.has_login) return <ChangeMemberPassword profile={profile} idPrefix={idPrefix} />;
    return <NewMemberLogin value={value} onChange={onChange} errors={errors} idPrefix={idPrefix} onEmailTaken={profile ? undefined : onEmailTaken} />;
}

function NewMemberLogin({ value, onChange, errors = {}, idPrefix, onEmailTaken }: Omit<MemberLoginSectionProps, "profile">) {
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState<"send" | "verify" | null>(null);
    const [localErrors, setLocalErrors] = useState<{ email?: string; otp?: string }>({});
    const [cooldown, startCooldown] = useCooldown();
    const email = value.login_email.trim();

    // After a reload the draft may say "verified": make sure the server still agrees.
    useEffect(() => {
        if (!value.login_email_verified || !email) return;
        memberLoginEmailVerified(email)
            .then((ok) => {
                if (!ok) {
                    onChange({ ...value, login_email_verified: false, login_code_sent: false, login_password: "" });
                    setLocalErrors({ email: "The verification expired. Please send a new code." });
                }
            })
            .catch(() => undefined);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const sendCode = async () => {
        if (!isEmail(email)) {
            setLocalErrors({ email: "Please enter a valid email." });
            return;
        }
        try {
            setBusy("send");
            setLocalErrors({});
            await sendMemberLoginOtp(email);
            onChange({ ...value, login_code_sent: true, login_email_verified: false });
            setCode("");
            startCooldown();
            toast.success(`Code sent to ${email}`);
        } catch (err) {
            const fields = familyFieldErrors(err);
            const message = fields.email || familyApiError(err);
            // Already has an account: that person is on the platform, so offer to link them instead.
            if (onEmailTaken && /already has an account/i.test(message)) {
                setLocalErrors({ email: "This email already has an account. You can link that profile below." });
                onEmailTaken(email);
            } else {
                setLocalErrors({ email: message });
            }
        } finally {
            setBusy(null);
        }
    };

    const verifyCode = async () => {
        if (!/^\d{4,8}$/.test(code.trim())) {
            setLocalErrors({ otp: "Please enter the code from the email." });
            return;
        }
        try {
            setBusy("verify");
            setLocalErrors({});
            await verifyMemberLoginOtp(email, code.trim());
            onChange({ ...value, login_email_verified: true });
            toast.success("Email verified");
        } catch (err) {
            const fields = familyFieldErrors(err);
            setLocalErrors({ otp: fields.otp || familyApiError(err) });
        } finally {
            setBusy(null);
        }
    };

    const changeEmail = () => {
        onChange({ ...value, login_code_sent: false, login_email_verified: false, login_password: "" });
        setCode("");
        setLocalErrors({});
    };

    const emailError = localErrors.email || errors.login_email;
    const actionClass = "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="@container space-y-3 rounded-md border border-[#E7E8EB] bg-[#F9FAFB] p-3 sm:p-4">
            <SectionTitle title="Their login (optional)"
                text="Verify their email with a code, then set a password. They can sign in with it; you keep managing the profile. Leave empty for a child without email." />

            <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                <FormField label="Email" error={emailError} htmlFor={`${idPrefix}-login-email`}>
                    <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                            <input id={`${idPrefix}-login-email`} type="email" autoComplete="off" disabled={value.login_email_verified}
                                className={cn(familyInputClass, value.login_email_verified && "pr-9", emailError && "border-destructive")}
                                value={value.login_email} placeholder="name@example.com" maxLength={255}
                                onChange={(e) => onChange({ ...value, login_email: e.target.value, login_code_sent: false, login_email_verified: false })} />
                            {value.login_email_verified && <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />}
                        </div>
                        {value.login_email_verified ? (
                            <button type="button" onClick={changeEmail} className={cn(actionClass, "border border-[#E7E8EB] bg-white text-[#1F1E1E] hover:border-primary hover:text-primary")}>
                                Change
                            </button>
                        ) : (
                            <button type="button" onClick={sendCode} disabled={!email || busy !== null || cooldown > 0}
                                className={cn(actionClass, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                                {busy === "send" && <Loader2 className="h-4 w-4 animate-spin" />}
                                {cooldown > 0 ? `${cooldown}s` : value.login_code_sent ? "Resend" : "Send code"}
                            </button>
                        )}
                    </div>
                    {value.login_email_verified && <p className="mt-1 text-xs font-medium text-primary">Email verified</p>}
                </FormField>

                {value.login_code_sent && !value.login_email_verified && (
                    <FormField label="Verification code" error={localErrors.otp} htmlFor={`${idPrefix}-login-otp`} hint={`sent to ${email}`}>
                        <div className="flex gap-2">
                            <input id={`${idPrefix}-login-otp`} inputMode="numeric" autoComplete="one-time-code"
                                className={cn(familyInputClass, "min-w-0 flex-1 tracking-[0.3em]", localErrors.otp && "border-destructive")}
                                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="6 digit code" />
                            <button type="button" onClick={verifyCode} disabled={busy !== null || !code}
                                className={cn(actionClass, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                                {busy === "verify" && <Loader2 className="h-4 w-4 animate-spin" />} Verify
                            </button>
                        </div>
                    </FormField>
                )}

                {value.login_email_verified && (
                    <FormField label="Password" required error={errors.login_password} htmlFor={`${idPrefix}-login-password`}>
                        <PasswordInput id={`${idPrefix}-login-password`} value={value.login_password} invalid={!!errors.login_password}
                            onChange={(password) => onChange({ ...value, login_password: password })} />
                        <p className="mt-1 text-xs text-muted-foreground">Their sign-in details are also emailed to them.</p>
                    </FormField>
                )}
            </div>
        </div>
    );
}

const SectionTitle = ({ title, text, icon = "mail" }: { title: string; text: string; icon?: "mail" | "key" }) => (
    <div className="flex items-start gap-2">
        {icon === "mail" ? <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1F1E1E]">{title}</p>
            <p className="text-xs text-muted-foreground">{text}</p>
        </div>
    </div>
);

function ChangeMemberPassword({ profile, idPrefix }: { profile: FamilyProfile; idPrefix: string }) {
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState<"send" | "save" | null>(null);
    const [codeSent, setCodeSent] = useState(false);
    const [errors, setErrors] = useState<{ otp?: string; password?: string }>({});
    const [cooldown, startCooldown] = useCooldown();

    const sendCode = async () => {
        try {
            setBusy("send");
            setErrors({});
            await sendMemberPasswordOtp(profile.patient_id);
            setCodeSent(true);
            startCooldown();
            toast.success(`Code sent to ${profile.login_email}`);
        } catch (err) {
            toast.error(familyApiError(err));
        } finally {
            setBusy(null);
        }
    };

    const save = async () => {
        const found: typeof errors = {};
        if (!/^\d{4,8}$/.test(code.trim())) found.otp = "Please enter the code from the email.";
        if (password.length < 8) found.password = "Password must be at least 8 characters.";
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setBusy("save");
            await changeMemberPassword(profile.patient_id, code.trim(), password);
            toast.success(`${profile.first_name}'s password was updated`);
            setCodeSent(false);
            setCode("");
            setPassword("");
        } catch (err) {
            const fields = familyFieldErrors(err);
            setErrors({ otp: fields.otp, password: fields.password });
            if (!fields.otp && !fields.password) toast.error(familyApiError(err));
        } finally {
            setBusy(null);
        }
    };

    const actionClass = "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="@container space-y-3 rounded-md border border-[#E7E8EB] bg-[#F9FAFB] p-3 sm:p-4">
            <SectionTitle icon="key" title="Their login"
                text="They sign in with this email. To reset their password, we send a code to this email." />

            <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                <FormField label="Email" htmlFor={`${idPrefix}-pw-email`}>
                    <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                            <input id={`${idPrefix}-pw-email`} disabled className={cn(familyInputClass, "pr-9")} value={profile.login_email || ""} readOnly />
                            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        </div>
                        <button type="button" onClick={sendCode} disabled={busy !== null || cooldown > 0}
                            className={cn(actionClass, codeSent ? "border border-[#E7E8EB] bg-white text-[#1F1E1E] hover:border-primary hover:text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                            {busy === "send" && <Loader2 className="h-4 w-4 animate-spin" />}
                            {cooldown > 0 ? `${cooldown}s` : codeSent ? "Resend" : "Reset password"}
                        </button>
                    </div>
                </FormField>

                {codeSent && (
                    <FormField label="Verification code" required error={errors.otp} htmlFor={`${idPrefix}-pw-otp`} hint={`sent to ${profile.login_email}`}>
                        <input id={`${idPrefix}-pw-otp`} inputMode="numeric" autoComplete="one-time-code" className={cn(familyInputClass, "tracking-[0.3em]", errors.otp && "border-destructive")}
                            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="6 digit code" />
                    </FormField>
                )}

                {codeSent && (
                    <FormField label="New password" required error={errors.password} htmlFor={`${idPrefix}-pw-new`}>
                        <div className="flex gap-2">
                            <div className="min-w-0 flex-1">
                                <PasswordInput id={`${idPrefix}-pw-new`} value={password} onChange={setPassword} invalid={!!errors.password} />
                            </div>
                            <button type="button" onClick={save} disabled={busy !== null}
                                className={cn(actionClass, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                                {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />} Update
                            </button>
                        </div>
                    </FormField>
                )}
            </div>
        </div>
    );
}
