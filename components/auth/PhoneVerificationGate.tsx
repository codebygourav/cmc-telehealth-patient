"use client";

/**
 * Every account confirms a mobile number once (WhatsApp code) before using the portal: older
 * accounts and email sign-ups. After this they sign in and reset their password with it.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/userContext";
import api from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Smartphone } from "lucide-react";
import { toast } from "sonner";
import MobileVerifyForm from "./MobileVerifyForm";

export interface PhoneStatus {
    phone_verified: boolean;
    verified_phone: string | null;
    requires_phone_verification: boolean;
    profile_phone: string | null;
    country_code: string | null;
}

export const phoneStatusKey = (userId?: string) => ["phone-status", userId];

export function usePhoneStatus() {
    const { user, initializing } = useAuth();
    return useQuery({
        queryKey: phoneStatusKey(user?.id),
        queryFn: async () => (await api.get<{ data: PhoneStatus }>("/auth/phone/status")).data.data,
        enabled: !initializing && !!user?.id,
        staleTime: 10 * 60 * 1000,
        retry: false,
    });
}

const PhoneVerificationGate = () => {
    const { user, updateUser, logout } = useAuth();
    const queryClient = useQueryClient();
    const { data: status } = usePhoneStatus();

    // Right after sign-in the flag from the sign-in answer is used until the status check returns.
    const required = status ? status.requires_phone_verification : !!user?.requires_phone_verification;
    if (!user?.id || !required) return null;

    return (
        <>
        {/* Covers the portal: nothing can be used until the number is verified. */}
        <div className="fixed inset-0 z-40 bg-background" aria-hidden="true" />
        <Dialog open>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6"
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="items-center text-center sm:text-center">
                    <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Smartphone className="h-6 w-6" />
                    </span>
                    <DialogTitle className="font-source-sans text-xl font-semibold">Verify your WhatsApp number</DialogTitle>
                    <DialogDescription className="font-source-sans text-sm leading-relaxed">
                        You will sign in with this number, and appointment updates come on WhatsApp. Confirm it once to continue.
                    </DialogDescription>
                </DialogHeader>

                <MobileVerifyForm
                    initialCountryCode={status?.country_code ?? "+91"}
                    initialNumber={status?.profile_phone ?? user.mobile_no}
                    submitLabel="Verify and continue"
                    onVerified={async (result, message) => {
                        await updateUser({ mobile_no: result.phone, phone_verified: true, requires_phone_verification: false });
                        queryClient.setQueryData(phoneStatusKey(user.id), {
                            ...status,
                            phone_verified: true,
                            verified_phone: result.verified_phone,
                            requires_phone_verification: false,
                            profile_phone: result.phone,
                            country_code: result.country_code,
                        });
                        // Country saved with the number: prices and the country question follow it.
                        await queryClient.invalidateQueries({ queryKey: ["patient-region"] });
                        toast.success(message || "WhatsApp number verified.");
                    }}
                />

                <button
                    type="button"
                    onClick={() => logout()}
                    className="mx-auto flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
                >
                    <LogOut className="h-4 w-4" /> Sign out
                </button>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default PhoneVerificationGate;
