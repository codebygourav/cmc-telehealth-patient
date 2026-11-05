"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { clearPricingTest, setPricingTest } from "@/lib/pricingTest";

/**
 * Pricing test links:
 *   /pricing-test/<secret>?mode=international | domestic | off   (Admin → International Payments)
 *   /find-doctors_<key>  → here with mode=international&next=/find-doctors   (API .env key)
 * Saves the choice in this browser, then asks the API whether it accepts it.
 */
export default function PricingTestPage() {
    const { secret } = useParams<{ secret: string }>();
    const router = useRouter();
    const [state, setState] = useState<{ mode: string; valid: boolean } | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("mode") || "international";
        const next = params.get("next");

        if (requested !== "international" && requested !== "domestic") {
            clearPricingTest();
            setState({ mode: "off", valid: true });
            return;
        }

        setPricingTest(String(secret), requested);
        api.get("/pricing-test/check")
            .then((res) => {
                const active = Boolean(res?.data?.data?.active);
                if (!active) clearPricingTest();
                setState({ mode: requested, valid: active });
                // Only internal paths, so the link can't send people to another site.
                if (active && next && next.startsWith("/") && !next.startsWith("//")) router.replace(next);
            })
            .catch(() => {
                clearPricingTest();
                setState({ mode: requested, valid: false });
            });
    }, [secret, router]);

    if (!state) return <p className="text-center text-muted-foreground py-20">Checking link…</p>;

    if (!state.valid) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 px-4">
                <p className="font-semibold text-lg">This link is not active</p>
                <p className="text-muted-foreground max-w-md">Prices are shown as for any other patient.</p>
                <Button asChild><Link href="/find-doctors">Find doctors</Link></Button>
            </div>
        );
    }

    const label =
        state.mode === "international" ? "International patient ($ USD)" :
        state.mode === "domestic" ? "Indian patient (₹ INR)" : "Normal pricing (test mode off)";

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 px-4">
            <p className="font-semibold text-lg">Pricing test: {label}</p>
            <p className="text-muted-foreground max-w-md">
                Saved in this browser. Browse doctors and book a video consultation to check the fee and payment.
            </p>
            <div className="flex gap-3">
                <Button asChild><Link href="/find-doctors">Find doctors</Link></Button>
                {state.mode !== "off" && (
                    <Button variant="outline" onClick={() => { clearPricingTest(); setState({ mode: "off", valid: true }); }}>
                        Stop testing
                    </Button>
                )}
            </div>
        </div>
    );
}
