"use client";

import { Users } from "lucide-react";
import { useActiveProfile } from "@/context/activeProfileContext";
import { useAuth } from "@/context/userContext";

// Shown while the app is viewing a family member's profile (not the account holder's own).
export default function FamilyViewBanner() {
    const { isFamilyView, activeProfile, ownProfile, switchTo } = useActiveProfile();
    const { user } = useAuth();

    if (!user || !isFamilyView || !activeProfile) return null;

    return (
        <div className="w-full bg-primary text-white">
            <div className="container-max-width mx-auto flex flex-wrap items-center justify-between gap-2 px-5 py-2 text-sm">
                <p className="flex min-w-0 items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="truncate">
                        Viewing: <strong>{activeProfile.name}</strong>
                        <span className="opacity-80"> ({activeProfile.relationship_label}) · managed by {ownProfile?.name || "you"}</span>
                    </span>
                </p>
                <button
                    type="button"
                    onClick={() => switchTo(null)}
                    className="shrink-0 rounded-md border border-white/40 px-2.5 py-1 text-xs font-semibold hover:bg-white/10"
                >
                    Switch back to my profile
                </button>
            </div>
        </div>
    );
}
