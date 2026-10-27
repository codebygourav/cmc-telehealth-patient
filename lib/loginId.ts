import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

/**
 * Sign-in with a mobile number (first choice, code on WhatsApp) or an email.
 * The API takes either in "login"; a 10-digit number without a country code is Indian.
 */

export interface AuthOptions {
  signup_methods: ("phone" | "email")[];
  default_method: "phone" | "email";
  mobile_verification_required: boolean;
  otp_length: number;
  otp_resend_seconds: number;
}

const DEFAULT_OPTIONS: AuthOptions = {
  signup_methods: ["phone"],
  default_method: "phone",
  mobile_verification_required: true,
  otp_length: 6,
  otp_resend_seconds: 60,
};

/** What Admin → Settings → Security allows (email sign-up on/off, etc.). */
export function useAuthOptions() {
  const { data } = useQuery({
    queryKey: ["auth-options"],
    queryFn: async () => (await api.get<{ data: AuthOptions }>("/auth/options")).data.data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data ?? DEFAULT_OPTIONS;
}

export const isEmailLogin = (value: string) => value.includes("@");

/** "+<country code><number>" from the country's dial code ("+91") and the number typed. */
export function toInternational(dialCode: string, number: string) {
  const digits = number.replace(/\D/g, "").replace(/^0+/, "");
  return `${dialCode.startsWith("+") ? dialCode : `+${dialCode}`}${digits}`;
}

/** A mobile number (8–15 digits, optional +) or an email. */
export function isValidLoginId(value: string) {
  const v = value.trim();
  if (isEmailLogin(v)) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return /^\+?[\d\s-]{8,18}$/.test(v) && v.replace(/\D/g, "").length >= 8;
}

export const LOGIN_ID_ERROR = "Enter your WhatsApp number or email address";

/** Where the code went, for the "we sent a code to…" line. */
export const codeChannelText = (value: string) =>
  isEmailLogin(value) ? "by email to" : "on WhatsApp to";
