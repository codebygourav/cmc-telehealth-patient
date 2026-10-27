"use client";
import InputField from "@/components/custom/inputfield";
import { Button } from "@/components/ui/button";
import { useSendOtp } from "@/mutations/auth/useForgotPassword";
import { useAuth } from "@/context/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { isValidLoginId, LOGIN_ID_ERROR } from "@/lib/loginId";

// Mobile number (code on WhatsApp) or email.
const sendOtpSchema = z.object({
  email: z.string().trim().refine(isValidLoginId, LOGIN_ID_ERROR),
  // Asked only when the WhatsApp number is on more than one account.
  account_email: z.string().trim().refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email address").optional(),
});

type SendOtpFormData = z.infer<typeof sendOtpSchema>;

interface SendOtpFormProps {
  onSuccess: (login: string, sentTo?: string, accountEmail?: string) => void;
  /** Same-screen flow: "Back to sign in" without leaving the page. */
  onBack?: () => void;
  /** Number / email to start with (e.g. from "account already exists"). */
  initialValue?: string;
}

const SendOtpForm: React.FC<SendOtpFormProps> = ({ onSuccess, onBack, initialValue }) => {
  const { mutate, isPending } = useSendOtp();
  const { user } = useAuth();
  const [needEmail, setNeedEmail] = React.useState(false);

  const methods = useForm<SendOtpFormData>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: {
      email: user?.mobile_no || user?.email || "",
    },
  });

  // Prefill email if logged in or coming with ?email=...
  useEffect(() => {
    const prefill = initialValue || user?.mobile_no || user?.email;
    if (prefill) methods.setValue("email", prefill);
  }, [methods, user, initialValue]);

  const onSubmit = async (data: SendOtpFormData) => {
    const accountEmail = needEmail ? (data.account_email || "").trim() : "";
    if (needEmail && !accountEmail) {
      methods.setError("account_email", { message: "Enter the email of your account" });
      return;
    }
    mutate({ email: data.email, ...(accountEmail ? { account_email: accountEmail } : {}) }, {
      onSuccess: (res: any) => {
        toast.success(res?.message || "Verification code sent");
        onSuccess(data.email.trim(), res?.data?.sent_to, accountEmail || undefined);
      },
      onError: (error: any) => {
        const code = error?.response?.data?.code;
        const errorMsg = error?.response?.data?.errors?.message;
        // Number on several accounts: ask which account (by its email), keep the number.
        if (code === "ACCOUNT_EMAIL_REQUIRED") {
          setNeedEmail(true);
          methods.setError("account_email", { type: "server", message: errorMsg });
          return;
        }
        if (code === "ACCOUNT_EMAIL_MISMATCH") {
          methods.setError("account_email", { type: "server", message: errorMsg });
          return;
        }
        if (errorMsg) {
          methods.setError("email", { type: "server", message: errorMsg });
        } else {
          toast.error(
            error?.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
        }
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          name="email"
          label="WhatsApp Number or Email"
          placeholder="e.g. 98765 43210 or name@mail.com"
          required
        />
        {needEmail && (
          <InputField
            name="account_email"
            label="Email of your account"
            placeholder="name@mail.com"
            type="email"
            required
          />
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending..." : "Send OTP"}
        </Button>
        {onBack && (
          <Button type="button" variant="ghost" className="w-full" disabled={isPending} onClick={onBack}>
            Back to sign in
          </Button>
        )}
      </form>
    </FormProvider>
  );
};

export default SendOtpForm;
