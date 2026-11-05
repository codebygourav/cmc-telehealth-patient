"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { clearPricingTest, getPricingTest } from "@/lib/pricingTest";

/** Shown while a pricing test / international preview link is active (checked with the API). */
export default function PricingTestBanner() {
    const [mode, setMode] = useState<string | null>(null);

    useEffect(() => {
        const read = () => {
            const test = getPricingTest();
            if (!test) return setMode(null);
            api.get("/pricing-test/check")
                .then((res) => {
                    if (res?.data?.data?.active) setMode(test.mode);
                    else { clearPricingTest(); setMode(null); } // switched off or key changed
                })
                .catch(() => setMode(null));
        };
        read();
        window.addEventListener("pricing-test-change", read);
        return () => window.removeEventListener("pricing-test-change", read);
    }, []);

    if (!mode) return null;

    return (
        <div className="w-full bg-amber-100 text-amber-900 text-sm text-center py-1.5 px-3">
            Pricing test: viewing as {mode === "international" ? "an international patient ($ USD)" : "an Indian patient (₹ INR)"}.{" "}
            <button className="underline font-medium" onClick={clearPricingTest}>Stop testing</button>
        </div>
    );
}
