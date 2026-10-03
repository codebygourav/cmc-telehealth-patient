"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/context/userContext";
import { useActiveProfile, familyProfilesKey } from "@/context/activeProfileContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldErrors {
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
    otp?: string;
}

export default function ChangePasswordForm() {
    const { user } = useAuth();
    const { managedBy, switchTo } = useActiveProfile();
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<"standard" | "otp">("standard");

    // Standard mode fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // OTP mode steps state
    const [codeSent, setCodeSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [isManagedOtp, setIsManagedOtp] = useState(false);
    const [holderNameOtp, setHolderNameOtp] = useState<string | null>(null);

    // Unlink checkbox state

    const [cooldown, setCooldown] = useState(0);

    // Show/hide passwords
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [errors, setErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const userEmail = user?.email || "";
    const isManaged = managedBy.length > 0 || isManagedOtp;
    // The server always unlinks a managed member who changes their own password.
    const unlinkFromFamily = isManaged;
    const managerName = managedBy[0]?.holder_name || holderNameOtp || "the primary account";

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const resetFields = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setCodeSent(false);
        setOtpVerified(false);
        setResetToken("");
        setIsManagedOtp(false);
        setHolderNameOtp(null);
        setErrors({});
    };

    const handleSendOtp = async () => {
        if (!userEmail) {
            toast.error("No account email found.");
            return;
        }

        try {
            setSendingOtp(true);
            setErrors({});
            await api.post("/auth/forgot-password/send-otp", { email: userEmail });
            setCodeSent(true);
            setCooldown(60);
            toast.success(`Verification code sent to ${userEmail}`);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.errors?.message || "Failed to send verification code.";
            toast.error(msg);
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || !/^\d{4,8}$/.test(otpCode.trim())) {
            setErrors({ otp: "Please enter the verification code sent to your email." });
            return;
        }

        try {
            setVerifyingOtp(true);
            setErrors({});
            const res = await api.post("/auth/forgot-password/verify-otp", {
                email: userEmail,
                otp: otpCode.trim(),
            });

            const token = res.data?.data?.reset_token;
            if (!token) {
                toast.error("Invalid response from verification API.");
                return;
            }

            setResetToken(token);
            setOtpVerified(true);
            if (res.data?.data?.is_managed) {
                setIsManagedOtp(true);
                setHolderNameOtp(res.data?.data?.holder_name || null);
            }
            toast.success("Code verified! Enter your new password below.");
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.errors?.message || "Invalid or expired verification code.";
            setErrors({ otp: msg });
            toast.error(msg);
        } finally {
            setVerifyingOtp(false);
        }
    };

    const validateStandard = (): FieldErrors => {
        const next: FieldErrors = {};
        if (!currentPassword) next.current_password = "Please enter your current password.";
        if (!newPassword) {
            next.new_password = "Please enter a new password.";
        } else if (newPassword.length < 8) {
            next.new_password = "Password must be at least 8 characters.";
        }
        if (!confirmPassword) {
            next.new_password_confirmation = "Please confirm your new password.";
        } else if (newPassword !== confirmPassword) {
            next.new_password_confirmation = "Passwords do not match.";
        }
        return next;
    };

    const validateOtpPassword = (): FieldErrors => {
        const next: FieldErrors = {};
        if (!newPassword) {
            next.new_password = "Please enter a new password.";
        } else if (newPassword.length < 8) {
            next.new_password = "Password must be at least 8 characters.";
        }
        if (!confirmPassword) {
            next.new_password_confirmation = "Please confirm your new password.";
        } else if (newPassword !== confirmPassword) {
            next.new_password_confirmation = "Passwords do not match.";
        }
        return next;
    };

    const handleSubmitStandard = async (e: React.FormEvent) => {
        e.preventDefault();
        const found = validateStandard();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        try {
            setLoading(true);
            const res = await api.post("/auth/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
                unlink_from_family: unlinkFromFamily,
            });

            toast.success(res.data?.message || "Password updated successfully!");
            if (unlinkFromFamily) {
                switchTo(null);
                await queryClient.invalidateQueries({ queryKey: familyProfilesKey(user?.id) });
            }
            resetFields();
        } catch (err: any) {
            const apiErrors = err?.response?.data?.errors;
            const message = err?.response?.data?.message || "Could not update password. Please try again.";

            if (apiErrors && typeof apiErrors === "object") {
                const nextErrors: FieldErrors = {};
                if (apiErrors.current_password) nextErrors.current_password = Array.isArray(apiErrors.current_password) ? apiErrors.current_password[0] : apiErrors.current_password;
                if (apiErrors.new_password) nextErrors.new_password = Array.isArray(apiErrors.new_password) ? apiErrors.new_password[0] : apiErrors.new_password;
                if (apiErrors.new_password_confirmation) nextErrors.new_password_confirmation = Array.isArray(apiErrors.new_password_confirmation) ? apiErrors.new_password_confirmation[0] : apiErrors.new_password_confirmation;
                setErrors(nextErrors);
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const found = validateOtpPassword();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        try {
            setLoading(true);
            const resetRes = await api.post("/auth/forgot-password/reset", {
                email: userEmail,
                reset_token: resetToken,
                password: newPassword,
                password_confirmation: confirmPassword,
                unlink_from_family: unlinkFromFamily,
            });

            toast.success(resetRes.data?.message || "Password reset successfully!");
            if (unlinkFromFamily) {
                switchTo(null);
                await queryClient.invalidateQueries({ queryKey: familyProfilesKey(user?.id) });
            }
            setMode("standard");
            resetFields();
        } catch (err: any) {
            const apiErrors = err?.response?.data?.errors;
            const message = err?.response?.data?.message || "Could not reset password. Please check the details and try again.";

            if (apiErrors && typeof apiErrors === "object") {
                const nextErrors: FieldErrors = {};
                if (apiErrors.password) nextErrors.new_password = Array.isArray(apiErrors.password) ? apiErrors.password[0] : apiErrors.password;
                if (apiErrors.password_confirmation) nextErrors.new_password_confirmation = Array.isArray(apiErrors.password_confirmation) ? apiErrors.password_confirmation[0] : apiErrors.password_confirmation;
                setErrors(nextErrors);
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (error?: string) =>
        cn("h-11 global-radius-10 border-slate-200 pr-10 focus-visible:border-primary", error && "border-destructive");

    return (
        <div className="space-y-6">
            {/* Mode Switcher Banner */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#E7E8EB] bg-[#F9FAFB] p-3.5">
                <div className="text-xs text-muted-foreground">
                    {mode === "standard" ? (
                        <span>Know your current password? Fill in the details below.</span>
                    ) : (
                        <span>Forgot your current password? We send a code to your registered email.</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setMode(mode === "standard" ? "otp" : "standard");
                        resetFields();
                    }}
                    className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
                >
                    {mode === "standard" ? "Forgot Current Password?" : "Use Current Password Instead"}
                </button>
            </div>

            {mode === "standard" ? (
                <form className="space-y-5" onSubmit={handleSubmitStandard} noValidate>
                    <div className="space-y-1.5">
                        <Label htmlFor="current_password" className="text-sm font-semibold text-[#1F1E1E]">
                            Current Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="current_password"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    setErrors((prev) => ({ ...prev, current_password: undefined }));
                                }}
                                className={inputClass(errors.current_password)}
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((v) => !v)}
                                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]"
                                aria-label={showCurrent ? "Hide password" : "Show password"}
                            >
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.current_password && <p className="text-xs font-medium text-destructive">{errors.current_password}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="new_password" className="text-sm font-semibold text-[#1F1E1E]">
                                New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setErrors((prev) => ({ ...prev, new_password: undefined }));
                                    }}
                                    className={inputClass(errors.new_password)}
                                    placeholder="At least 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]"
                                    aria-label={showNew ? "Hide password" : "Show password"}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.new_password && <p className="text-xs font-medium text-destructive">{errors.new_password}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirm_password" className="text-sm font-semibold text-[#1F1E1E]">
                                Confirm New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setErrors((prev) => ({ ...prev, new_password_confirmation: undefined }));
                                    }}
                                    className={inputClass(errors.new_password_confirmation)}
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.new_password_confirmation && (
                                <p className="text-xs font-medium text-destructive">{errors.new_password_confirmation}</p>
                            )}
                        </div>
                    </div>

                    {/* Managed by a primary account: changing your own password always ends that link */}

                    {isManaged && (


                        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-[#1F1E1E]">


                            <span className="font-semibold">Your profile will be unlinked from {managerName}</span>


                            <p className="mt-0.5 text-muted-foreground">


                                Changing your own password means you manage your profile yourself. {managerName} can link it again only with a code sent to your email.


                            </p>


                        </div>


                    )}

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                        <Button type="submit" className="btn-primary-cta w-full sm:w-auto sm:min-w-40" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-5">
                    {/* Row 1: Email Address + Send Code button */}
                    <div className="space-y-1.5">
                        <Label htmlFor="user_email" className="text-sm font-semibold text-[#1F1E1E]">Registered Email Address</Label>
                        <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Input
                                    id="user_email"
                                    type="email"
                                    value={userEmail}
                                    disabled
                                    readOnly
                                    className="h-11 global-radius-10 border-slate-200 bg-[#F5F6F8] pr-9 text-[#4D4D4D]"
                                />
                                <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                            </div>
                            <Button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp || cooldown > 0}
                                className="h-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {sendingOtp && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                                {cooldown > 0 ? `${cooldown}s` : codeSent ? "Resend Code" : "Send Code"}
                            </Button>
                        </div>
                    </div>

                    {/* Row 2: Verification Code + Verify Code button */}
                    {codeSent && !otpVerified && (
                        <div className="space-y-1.5">
                            <Label htmlFor="otp_code" className="text-sm font-semibold text-[#1F1E1E]">
                                Verification Code <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1">
                                    <Input
                                        id="otp_code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        value={otpCode}
                                        onChange={(e) => {
                                            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8));
                                            setErrors((prev) => ({ ...prev, otp: undefined }));
                                        }}
                                        className={cn("h-11 global-radius-10 border-slate-200 tracking-[0.3em]", errors.otp && "border-destructive")}
                                        placeholder="Enter 6-digit code"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={verifyingOtp || !otpCode}
                                    className="h-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {verifyingOtp && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Verify Code
                                </Button>
                            </div>
                            {errors.otp && <p className="text-xs font-medium text-destructive">{errors.otp}</p>}
                        </div>
                    )}

                    {/* Row 3: ONLY AFTER OTP is verified -> Password Fields & Unlink Checkbox */}
                    {otpVerified && (
                        <form onSubmit={handleSubmitOtp} className="space-y-5 border-t border-[#E7E8EB] pt-4">
                            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" /> Code verified successfully! Now set your new password.
                            </p>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new_password_otp" className="text-sm font-semibold text-[#1F1E1E]">
                                        New Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password_otp"
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setErrors((prev) => ({ ...prev, new_password: undefined }));
                                            }}
                                            className={inputClass(errors.new_password)}
                                            placeholder="At least 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]"
                                            aria-label={showNew ? "Hide password" : "Show password"}
                                        >
                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.new_password && <p className="text-xs font-medium text-destructive">{errors.new_password}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_password_otp" className="text-sm font-semibold text-[#1F1E1E]">
                                        Confirm New Password <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_password_otp"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setErrors((prev) => ({ ...prev, new_password_confirmation: undefined }));
                                            }}
                                            className={inputClass(errors.new_password_confirmation)}
                                            placeholder="Re-enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-[#1F1E1E]"
                                            aria-label={showConfirm ? "Hide password" : "Show password"}
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.new_password_confirmation && (
                                        <p className="text-xs font-medium text-destructive">{errors.new_password_confirmation}</p>
                                    )}
                                </div>
                            </div>

                            {/* Managed by a primary account: changing your own password always ends that link */}

                            {isManaged && (


                                <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-[#1F1E1E]">


                                    <span className="font-semibold">Your profile will be unlinked from {managerName}</span>


                                    <p className="mt-0.5 text-muted-foreground">


                                        Changing your own password means you manage your profile yourself. {managerName} can link it again only with a code sent to your email.


                                    </p>


                                </div>


                            )}

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                                <Button type="submit" className="btn-primary-cta w-full sm:w-auto sm:min-w-40" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                                        </>
                                    ) : (
                                        "Verify & Reset Password"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
