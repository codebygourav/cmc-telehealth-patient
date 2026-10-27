"use client";

import CompleteProfileStep from "@/components/auth/registration/CompleteProfileStep";
import RegisterStep from "@/components/auth/registration/RegisterStep";
import VerifyOtpStep from "@/components/auth/registration/VerifyOtpStep";
import { codeChannelText, isEmailLogin } from "@/lib/loginId";
import { useState } from "react";
import StepHeading from "./StepHeading";

type Step = "register" | "verify" | "complete";

/**
 * New account on the same screen: WhatsApp number (or email, when Admin allows it) → code →
 * profile. Completing the profile signs the patient in directly (no second login).
 */
export default function RegisterFlow() {
    const [step, setStep] = useState<Step>("register");
    const [login, setLogin] = useState("");

    if (step === "verify") {
        return (
            <div className="space-y-5">
                <StepHeading
                    title={isEmailLogin(login) ? "Verify your email" : "Verify your WhatsApp number"}
                    subtitle={<>We sent a 6-digit code {codeChannelText(login)} <span className="font-semibold text-foreground">{isEmailLogin(login) ? login : `+${login.replace(/\D/g, "")}`}</span>.</>}
                />
                <VerifyOtpStep email={login} onSuccess={() => setStep("complete")} onBack={() => setStep("register")} />
            </div>
        );
    }

    if (step === "complete") {
        return (
            <div className="space-y-5">
                <StepHeading title="Complete your profile" subtitle="Almost done. You will be signed in right after this." />
                <CompleteProfileStep email={login} />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <StepHeading title="Create new account" subtitle="Enter your WhatsApp number. We will send you a verification code on WhatsApp." />
            <RegisterStep
                onSuccess={(value, alreadyVerified) => {
                    setLogin(value);
                    setStep(alreadyVerified ? "complete" : "verify");
                }}
            />
        </div>
    );
}
