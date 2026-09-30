let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

// On a page refresh the first API calls can run before UserProvider restores the token
// (child effects run first). Fall back to the saved login so those calls are not sent
// without a token (which returned 401 and logged the patient out).
export const getAuthToken = () => {
    if (authToken || typeof window === "undefined") {
        return authToken;
    }

    try {
        const stored = localStorage.getItem("@token");
        const cookie = document.cookie
            .split("; ")
            .find((value) => value.startsWith("patient_token="));
        const cookieToken = cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;

        return stored && cookieToken && stored === cookieToken ? stored : null;
    } catch {
        return null;
    }
};
