"use client";

import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputField from "../../custom/inputfield";
import { useRegister, SendEmailResponse } from "@/mutations/auth/useAuthMutations";
import { toast } from "sonner";
import Link from "next/link";
import AccountExistsNotice from "../AccountExistsNotice";
import { COUNTRIES } from "@/constants/countries";
import { toInternational, useAuthOptions } from "@/lib/loginId";

// "email" holds the mobile number or the email (whichever method is chosen).
const registerSchema = z.object({
  method: z.enum(["phone", "email"]),
  country_iso: z.string(),
  email: z.string().trim().min(1, "This field is required"),
}).superRefine((data, ctx) => {
  if (data.method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    ctx.addIssue({ code: "custom", path: ["email"], message: "Invalid email address" });
  }
  if (data.method === "phone" && !/^\d{6,15}$/.test(data.email.replace(/[\s-]/g, ""))) {
    ctx.addIssue({ code: "custom", path: ["email"], message: "Enter your mobile number (digits only, without the country code)" });
  }
});

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterStepProps {
  onSuccess: (email: string, isVerified?: boolean) => void;
}

const RegisterStep: React.FC<RegisterStepProps> = ({ onSuccess }) => {
  const { mutate: register, isPending } = useRegister();
  const options = useAuthOptions();
  const emailAllowed = options.signup_methods.includes("email");
  const [verifiedLink, setVerifiedLink] = useState<{ email: string; message: string } | null>(null);
  const [existingAccount, setExistingAccount] = useState<{ email: string; message: string } | null>(null);

  const methods = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { method: "phone", country_iso: "IN", email: "" },
  });
  const method = methods.watch("method");
  const countryIso = methods.watch("country_iso");

  const switchMethod = (next: "phone" | "email") => {
    methods.reset({ ...methods.getValues(), method: next, email: "" });
    setExistingAccount(null);
    setVerifiedLink(null);
  };

  const onSubmit = (form: RegisterValues) => {
    setExistingAccount(null);
    setVerifiedLink(null);
    const country = COUNTRIES.find((c) => c.iso === form.country_iso) || COUNTRIES[0];
    // The mobile number goes with its country code; the API sends the code on WhatsApp.
    const data = {
      email: form.method === "phone" ? toInternational(country.code, form.email) : form.email.trim().toLowerCase(),
    };
    register({ login: data.email, ...data }, {
      onSuccess: (response: SendEmailResponse) => {
        const res: any = response;
        const message = res?.message?.toLowerCase() || "";
        const status = res?.errors?.status || res?.data?.status || res?.status || "";
        const code = res?.code || "";

        const isVerified =
          message.includes("verified") ||
          status === "verified" ||
          code === "ALREADY_VERIFIED";

        if ((res?.code || "") === "ALREADY_REGISTERED") {
          setExistingAccount({ email: data.email, message: res?.errors?.message || res?.message || "" });
          return;
        }

        if (response.success) {
          toast.success(response.message || "Verification code sent!");
          onSuccess(data.email, isVerified);
        } else if (isVerified) {
          if (typeof window !== "undefined") {
            localStorage.setItem('reg_email', data.email);
          }
          setVerifiedLink({
            email: data.email,
            message: response.errors?.message || response.message || "Email is already verified. Please complete your profile."
          });
          methods.setError("email", {
            message: response.errors?.message || response.message || "Email is already verified."
          });
        } else {
          const errorMsg = response.errors?.message || response.message || "Failed to send OTP.";
          methods.setError("email", { message: errorMsg });
          toast.error(errorMsg);
        }
      },
      onError: (err: any) => {
        const responseData = err?.response?.data || {};
        const message = (responseData?.message || "").toLowerCase();
        const status = responseData?.errors?.status || responseData?.data?.status || responseData?.status || "";
        const code = responseData?.code || "";

        if (code === "ALREADY_REGISTERED") {
          setExistingAccount({ email: data.email, message: responseData?.errors?.message || "" });
          return;
        }

        const isVerified =
          message.includes("verified") ||
          status === "verified" ||
          code === "ALREADY_VERIFIED";

        if (isVerified) {
          if (typeof window !== "undefined") {
            localStorage.setItem('reg_email', data.email);
          }
          setVerifiedLink({
            email: data.email,
            message: responseData?.errors?.message || responseData?.message || "Email is already verified. Please complete your profile."
          });
          methods.setError("email", {
            message: responseData?.errors?.message || responseData?.message || "Email is already verified."
          });
        } else {
          const errorMsg = responseData?.errors?.message || responseData?.message || err?.message || "An unexpected error occurred.";
          methods.setError("email", { message: errorMsg });
          toast.error(errorMsg);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
          {method === "phone" ? (
            <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3">
              <div className="flex flex-col space-y-2">
                <label htmlFor="register-country" className="text-sm font-medium text-muted-foreground font-source-sans">Country</label>
                <select
                  id="register-country"
                  {...methods.register("country_iso")}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-input bg-accent/30 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={`${c.iso}-${c.code}`} value={c.iso}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
              <InputField
                name="email"
                label="WhatsApp Number"
                placeholder={countryIso === "IN" ? "98765 43210" : "Number without country code"}
                required
                disabled={isPending}
                type="tel"
                maxLength={18}
              />
            </div>
          ) : (
            <InputField
              name="email"
              label="Email Address"
              placeholder="example@mail.com"
              required
              disabled={isPending}
              type="email"
            />
          )}

          {emailAllowed && (
            <button
              type="button"
              onClick={() => switchMethod(method === "phone" ? "email" : "phone")}
              disabled={isPending}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {method === "phone" ? "Sign up with email instead" : "Sign up with WhatsApp number instead"}
            </button>
          )}

          {existingAccount && <AccountExistsNotice email={existingAccount.email} message={existingAccount.message || undefined} />}

          {verifiedLink && (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-foreground font-source-sans">
                {verifiedLink.message}
              </p>
              <Link
                href="/auth/complete-profile"
                className="text-sm font-semibold text-primary hover:underline hover:text-primary/80 transition-colors w-fit"
              >
                Complete Your Profile Now →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2.5 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-source-sans"
          >
            {isPending ? "Sending OTP..." : "Get OTP"}
          </button>
        </form>
      </FormProvider>
    </div>
  );
};

export default RegisterStep;
