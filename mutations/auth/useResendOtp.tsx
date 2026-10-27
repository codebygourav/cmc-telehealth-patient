import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export interface ResendOtpPayload {
  email: string;
  /** WhatsApp number on several accounts: the email that picks the account. */
  account_email?: string;
  context: "forgot_password" | "registration" | string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
}

export function useResendOtp() {
  return useMutation<ResendOtpResponse, any, ResendOtpPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/auth/resend-otp", { login: payload.email, ...payload });
      return data;
    },
  });
}
