"use client";

/** The account's sign-in mobile number, with "Change number" (new number confirmed by WhatsApp code). */

import MobileVerifyForm from "@/components/auth/MobileVerifyForm";
import { phoneStatusKey, usePhoneStatus } from "@/components/auth/PhoneVerificationGate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/userContext";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MobileNumberCard() {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const { data: status } = usePhoneStatus();
    const [open, setOpen] = useState(false);

    if (!status) return null;
    const shown = status.verified_phone ? `+${status.verified_phone}` : status.profile_phone || "—";

    return (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm text-slate-500">Sign-in mobile number</p>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                        <span className="break-all">{shown}</span>
                        {status.phone_verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <BadgeCheck className="h-3.5 w-3.5" /> Verified
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                {status.phone_verified ? "Change number" : "Verify number"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="font-source-sans text-xl font-semibold">{status.phone_verified ? "Change mobile number" : "Verify mobile number"}</DialogTitle>
                        <DialogDescription className="font-source-sans">
                            We send a code on WhatsApp to the new number. Once confirmed, you sign in with the new number.
                        </DialogDescription>
                    </DialogHeader>
                    {open && (
                        <MobileVerifyForm
                            initialCountryCode={status.country_code}
                            initialNumber={status.phone_verified ? null : status.profile_phone}
                            currentVerified={status.verified_phone}
                            submitLabel="Confirm new number"
                            onVerified={async (result, message) => {
                                await updateUser({ mobile_no: result.phone, phone_verified: true, requires_phone_verification: false });
                                queryClient.setQueryData(phoneStatusKey(user?.id), {
                                    ...status,
                                    phone_verified: true,
                                    verified_phone: result.verified_phone,
                                    requires_phone_verification: false,
                                    profile_phone: result.phone,
                                    country_code: result.country_code,
                                });
                                await queryClient.invalidateQueries();
                                toast.success(message || "Mobile number changed.");
                                setOpen(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
