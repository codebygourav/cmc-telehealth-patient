// Where to send the patient after login / registration (e.g. back to the doctor they wanted to book).

const STORAGE_KEY = "@post_auth_redirect";

// Only same-site paths ("/find-doctors/123"), never "//evil.com" or full URLs.
export const isSafeRedirect = (path: string | null | undefined): path is string =>
    !!path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/auth/");

export const loginUrlWithRedirect = (path: string, mode: "login" | "register" = "login") =>
    `/auth/${mode}?redirect=${encodeURIComponent(path)}`;

export const rememberPostAuthRedirect = (path: string | null | undefined) => {
    if (typeof window === "undefined" || !isSafeRedirect(path)) return;
    try {
        sessionStorage.setItem(STORAGE_KEY, path);
    } catch {
        // storage unavailable: login will fall back to the dashboard
    }
};

// Redirect from ?redirect= (current URL) or the remembered one; cleared once used.
export const consumePostAuthRedirect = (): string => {
    if (typeof window === "undefined") return "/";

    const fromUrl = new URLSearchParams(window.location.search).get("redirect");
    let remembered: string | null = null;
    try {
        remembered = sessionStorage.getItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        remembered = null;
    }

    if (isSafeRedirect(fromUrl)) return fromUrl;
    if (isSafeRedirect(remembered)) return remembered;

    return "/";
};
