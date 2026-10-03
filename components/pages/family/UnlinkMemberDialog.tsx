"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { familyApiError, familyFieldErrors, unlinkFamilyProfile, type FamilyProfile } from "@/api/family";

interface UnlinkMemberDialogProps {
    target: FamilyProfile | null;
    onClose: () => void;
    onUnlinked: (profile: FamilyProfile) => void | Promise<void>;
}

/**
 * The primary account stops managing a family profile. Without a login, the member gets one
 * with their own email (sign-in details are emailed); with a login, they just keep it.
 */
export default function UnlinkMemberDialog({ target, onClose, onUnlinked }: UnlinkMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const hasLogin = Boolean(target?.has_login);

    useEffect(() => {
        setEmail("");
        setPhone(target?.phone || "");
        setErrors({});
    }, [target?.patient_id]); // eslint-disable-line react-hooks/exhaustive-deps

    const confirm = async () => {
        if (!target) return;
        const found: Record<string, string> = {};
        if (!hasLogin && !/^\S+@\S+\.\S+$/.test(email.trim())) found.email = "Please enter the family member's own email.";
        if (!hasLogin && !/^\d{10}$/.test(phone)) found.phone = "Please enter a 10 digit phone number.";
        setErrors(found);
        if (Object.keys(found).length) return;

        try {
            setBusy(true);
            await unlinkFamilyProfile(target.patient_id, hasLogin ? {} : { email: email.trim(), phone });
            toast.success(hasLogin
                ? `${target.name} now manages their own profile.`
                : `${target.name} now has their own account. Their sign-in details were emailed to them.`);
            await onUnlinked(target);
        } catch (err) {
            setErrors(familyFieldErrors(err));
            toast.error(familyApiError(err));
        } finally {
            setBusy(false);
        }
    };

    const inputClass = (invalid?: string) =>
        `h-11 w-full rounded-md border px-3 text-sm outline-none focus:border-primary ${invalid ? "border-destructive" : "border-[#E7E8EB]"}`;

    return (
        <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] rounded-xl p-5 sm:max-w-md">
                <DialogTitle className="text-lg font-semibold">Unlink {target?.name}?</DialogTitle>
                <div className="space-y-2 text-sm text-[#4D4D4D]">
                    <p>
                        {hasLogin
                            ? `${target?.name} will manage their own profile with their login (${target?.login_email}). After unlinking:`
                            : `${target?.name} will get their own account and manage their own profile. After unlinking:`}
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>You can no longer book for them or see their appointments and reports.</li>
                        <li>They keep all their appointments and medical history.</li>
                        {!hasLogin && <li>Their sign-in details are emailed to the address below.</li>}
                    </ul>
                </div>
                {!hasLogin && (
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="unlink-email" className="mb-1 block text-sm font-semibold">Their email <span className="text-destructive">*</span></label>
                            <input id="unlink-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                                className={inputClass(errors.email)} placeholder="name@example.com" />
                            {errors.email && <p className="mt-1 text-xs font-medium text-destructive">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="unlink-phone" className="mb-1 block text-sm font-semibold">Their phone <span className="text-destructive">*</span></label>
                            <input id="unlink-phone" inputMode="numeric" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setErrors({}); }}
                                className={inputClass(errors.phone)} placeholder="10 digit mobile number" />
                            {errors.phone && <p className="mt-1 text-xs font-medium text-destructive">{errors.phone}</p>}
                        </div>
                    </div>
                )}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirm} disabled={busy}>
                        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlinking...</> : hasLogin ? "Unlink" : "Unlink & Send Login"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
