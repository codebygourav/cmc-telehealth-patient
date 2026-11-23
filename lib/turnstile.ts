// Invisible Cloudflare Turnstile for sign-in, sign-up and OTP requests (see lib/axios.tsx).
// Off when NEXT_PUBLIC_TURNSTILE_SITE_KEY is empty. Nothing is shown unless Cloudflare needs the
// visitor to confirm (managed mode); in invisible mode nothing is ever shown.

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

/** Requests that must carry a captcha token (the API checks it). */
const PROTECTED = [
  "/auth/login",
  "/auth/register",
  "/auth/resend-otp",
  "/auth/forgot-password/send-otp",
  "/auth/forgot-password/lookup",
  "/auth/forgot-password/email-code/send",
  "/auth/forgot-password/new-number/send-otp",
];

export const needsTurnstile = (url = "", method = "get") =>
  Boolean(SITE_KEY) && method.toLowerCase() === "post" && PROTECTED.some((path) => url.split("?")[0].endsWith(path));

let scriptPromise: Promise<void> | null = null;
let container: HTMLDivElement | null = null;
let widgetId: string | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { scriptPromise = null; reject(new Error("Turnstile could not load")); };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/** A fresh one-time token, or null (not configured / could not load: the API decides). */
export async function getTurnstileToken(): Promise<string | null> {
  if (!SITE_KEY || typeof window === "undefined") return null;
  try {
    await loadScript();
  } catch {
    return null;
  }
  const turnstile = window.turnstile;
  if (!turnstile) return null;

  if (!container) {
    container = document.createElement("div");
    // Bottom-right, above everything: only visible if Cloudflare asks the visitor to confirm.
    container.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;";
    document.body.appendChild(container);
  }
  if (widgetId) {
    turnstile.remove(widgetId); // tokens work once: a new widget per request
    widgetId = null;
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = (token: string | null) => {
      if (done) return;
      done = true;
      resolve(token);
    };
    widgetId = turnstile.render(container as HTMLDivElement, {
      sitekey: SITE_KEY,
      appearance: "interaction-only",
      callback: (token: string) => finish(token),
      "error-callback": () => finish(null),
      "timeout-callback": () => finish(null),
    });
    setTimeout(() => finish(null), 20000);
  });
}
