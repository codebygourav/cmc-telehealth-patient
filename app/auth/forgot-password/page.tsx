"use client";

import { openAuthScreen } from "@/components/auth/unified/AuthNav";
import { rememberPostAuthRedirect } from "@/lib/authRedirect";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Lives on the sign-in screen now: older links open that form there, with a clean address.
export default function Page() {
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        rememberPostAuthRedirect(params.get("redirect"));
        openAuthScreen("forgot", params.get("email"));
        router.replace("/auth/login");
    }, [router]);

    return null;
}
