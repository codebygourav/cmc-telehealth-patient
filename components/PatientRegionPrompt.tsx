"use client";

/**
 * Asks a logged-in patient for their country once, when it is not saved yet.
 * The country decides Indian (₹) or international (USD) pricing, so fees are shown correctly.
 */

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { COUNTRIES } from "@/constants/countries";
import { useAuth } from "@/context/userContext";
import api from "@/lib/axios";
import { getCountryIsoFromName, getUserCountry } from "@/lib/location";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PatientRegion {
    country_iso: string | null;
    country_code: string | null;
    current_location: string | null;
    needs_details: boolean;
    is_international: boolean;
}

const DISMISSED_KEY = "patient_region_prompt_dismissed";

const PatientRegionPrompt = () => {
    const { user, initializing } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    // "Later" hides the question until the next browser session.
    const [dismissedFor, setDismissedFor] = useState<string | null>(() => {
        try {
            return typeof window === "undefined" ? null : sessionStorage.getItem(DISMISSED_KEY);
        } catch {
            return null;
        }
    });
    const dismissed = !!userId && dismissedFor === String(userId);
    const [countryIso, setCountryIso] = useState("");
    const [saving, setSaving] = useState(false);

    const { data: region } = useQuery({
        queryKey: ["patient-region", userId],
        queryFn: async () => (await api.get<{ data: PatientRegion }>("/patient/region")).data.data,
        enabled: !initializing && !!userId,
        staleTime: 10 * 60 * 1000,
        retry: false,
    });

    const needsDetails = !!region?.needs_details;

    // Suggest the country the patient is browsing from; they confirm or change it.
    useEffect(() => {
        if (!needsDetails) return;
        let cancelled = false;

        getUserCountry("").then((name) => {
            if (cancelled) return;
            setCountryIso((current) => current || getCountryIsoFromName(name) || "");
        });

        return () => {
            cancelled = true;
        };
    }, [needsDetails]);

    if (!userId || !needsDetails || dismissed) return null;

    const later = () => {
        try {
            sessionStorage.setItem(DISMISSED_KEY, String(userId));
        } catch {
            // Private mode: the question simply shows again on the next page load.
        }
        setDismissedFor(String(userId));
    };

    const save = async () => {
        const country = COUNTRIES.find((c) => c.iso === countryIso);
        if (!country) {
            toast.error("Please select your country.");
            return;
        }

        setSaving(true);
        try {
            await api.post("/patient/region", {
                country_iso: country.iso,
                country_code: country.code,
                current_location: country.name,
            });
            toast.success("Country saved. Fees are now shown for your country.");
            // Doctor lists, profiles and slots carry prices: load them again for this patient.
            await queryClient.invalidateQueries();
        } catch {
            toast.error("Could not save your country. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && later()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Confirm your country
                    </DialogTitle>
                    <DialogDescription>
                        Consultation fees depend on the country you are consulting from. Please confirm it once so we show you the correct fee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-1.5">
                    <label htmlFor="patient-region-country" className="text-sm font-medium text-slate-700">
                        Country
                    </label>
                    <select
                        id="patient-region-country"
                        value={countryIso}
                        onChange={(e) => setCountryIso(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                    >
                        <option value="">Select country</option>
                        {COUNTRIES.map((country) => (
                            <option key={`${country.iso}-${country.code}`} value={country.iso}>
                                {country.flag} {country.name} ({country.code})
                            </option>
                        ))}
                    </select>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={later} disabled={saving}>
                        Later
                    </Button>
                    <Button type="button" onClick={save} disabled={saving || !countryIso}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PatientRegionPrompt;
