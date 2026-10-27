import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

// Types for Send OTP
interface SendOtpPayload {
  email: string;
  /** WhatsApp number on several accounts: the email that picks the account. */
  account_email?: string;
}

interface SendOtpResponse {
  message: string;
}

// Types for Verify OTP
interface VerifyOtpPayload {
  email: string;
  otp: string;
  /** WhatsApp number on several accounts: the email that picks the account. */
  account_email?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    reset_token: string;
    is_managed?: boolean;
    holder_name?: string | null;
  };
}

// Types for Reset Password
interface ResetPasswordPayload {
  email: string;
  /** WhatsApp number on several accounts: the email that picks the account. */
  account_email?: string;
  reset_token: string;
  password: string;
  password_confirmation: string;
  unlink_from_family?: boolean;
}

interface ResetPasswordResponse {
  message: string;
}

/**
 * Hook for sending OTP to email for password reset
 */
export function useSendOtp() {
  return useMutation<SendOtpResponse, any, SendOtpPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/auth/forgot-password/send-otp", { login: payload.email, ...payload });
      return data;
    },
  });
}

/**
 * Hook for verifying the OTP sent to email
 */
export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, any, VerifyOtpPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/auth/forgot-password/verify-otp", { login: payload.email, ...payload });
      return data;
    },
  });
}

/**
 * Hook for resetting the password
 */
export function useResetPassword() {
  return useMutation<ResetPasswordResponse, any, ResetPasswordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/auth/forgot-password/reset", { login: payload.email, ...payload });
      return data;
    },
  });
}
