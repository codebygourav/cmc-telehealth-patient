"use client";

import Link from "next/link";
import { Check, Settings2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { profileInitials, profileSubtitle, useActiveProfile } from "@/context/activeProfileContext";

const AVATAR_COLORS = ["bg-primary", "bg-emerald-700", "bg-sky-800", "bg-amber-700", "bg-rose-800", "bg-indigo-800"];

export const ProfileAvatar = ({ name, index = 0, className }: { name: string; index?: number; className?: string }) => (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", AVATAR_COLORS[index % AVATAR_COLORS.length], className)}>
        {profileInitials(name)}
    </span>
);

/**
 * "Switch Family Profile" list: the account holder and the family members they manage.
 * Used in the header dropdown (desktop) and the mobile menu.
 */
export default function ProfileSwitcherList({ onDone }: { onDone?: () => void }) {
    const { profiles, activeProfile, switchTo, loading } = useActiveProfile();

    return (
        <div className="w-full">
            <div className="flex items-start justify-between gap-3 px-3 pb-2 pt-1">
                <div>
                    <p className="text-sm font-semibold text-[#1F1E1E]">Switch Family Profile</p>
                    <p className="text-xs text-muted-foreground">View appointments &amp; history</p>
                </div>
                {profiles.length > 0 && (
                    <span className="rounded-full bg-[#F5F6F8] px-2 py-0.5 text-[11px] font-semibold text-[#4D4D4D]">
                        {profiles.length} Saved
                    </span>
                )}
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto px-1.5">
                {loading && <div className="h-14 animate-pulse rounded-lg bg-gray-100" />}
                {profiles.map((profile, index) => {
                    const active = activeProfile?.patient_id === profile.patient_id;
                    return (
                        <button
                            key={profile.patient_id}
                            type="button"
                            onClick={() => {
                                switchTo(profile.patient_id);
                                onDone?.();
                            }}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors",
                                active ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-[#F5F6F8]",
                            )}
                        >
                            <ProfileAvatar name={profile.name} index={index} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[#1F1E1E]">{profile.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{profileSubtitle(profile)}</span>
                            </span>
                            {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 space-y-0.5 border-t border-[#E7E8EB] px-1.5 pt-2">
                <Link
                    href="/family-members?add=1"
                    onClick={onDone}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                    <UserPlus className="h-4 w-4" /> Add Family Member
                </Link>
                <Link
                    href="/family-members"
                    onClick={onDone}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#1F1E1E] hover:bg-[#F5F6F8]"
                >
                    <Settings2 className="h-4 w-4 text-muted-foreground" /> Manage Family Profiles
                </Link>
            </div>
        </div>
    );
}
