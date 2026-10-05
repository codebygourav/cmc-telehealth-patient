"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Settings2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { profileSubtitle, useActiveProfile } from "@/context/activeProfileContext";
import { ProfileAvatar } from "./ProfileSwitcherList";

/** Mobile menu: the viewed profile as a card that opens the family switcher. */
export default function MobileMenuProfileCard({ onDone }: { onDone?: () => void }) {
    const { profiles, activeProfile, switchTo, loading } = useActiveProfile();
    const [open, setOpen] = useState(false);
    const current = activeProfile ?? profiles[0];
    const currentIndex = Math.max(0, profiles.findIndex((p) => p.patient_id === current?.patient_id));

    if (loading && !current) return <div className="h-20 animate-pulse rounded-lg bg-gray-100" />;
    if (!current) return null;

    return (
        <div className="overflow-hidden rounded-lg border border-primary/35 bg-[#F8FAFB] shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
                className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left">
                <span className="relative">
                    <ProfileAvatar name={current.name} index={currentIndex} className="h-12 w-12 text-base" />
                    <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                        <span className="truncate text-base font-semibold text-[#1F1E1E]">{current.name}</span>
                        <span className="shrink-0 rounded-md bg-[#E9ECEF] px-1.5 py-0.5 text-[11px] font-semibold text-[#4D4D4D]">
                            {current.is_self ? "Self" : current.relationship_label}
                        </span>
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                        {current.is_self ? "Primary Account" : "Family profile"}
                        {profileSubtitle(current).replace(/^[^·]*·\s*/, "") ? ` • ${profileSubtitle(current).replace(/^[^·]*·\s*/, "")}` : ""}
                    </span>
                </span>
                {profiles.length > 1 && (
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-[#E7E8EB] bg-white px-1.5 text-xs font-semibold text-[#4D4D4D]">{profiles.length}</span>
                )}
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="border-t border-[#E7E8EB] px-2 pt-2.5 pb-1">
                    <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Switch family member</p>
                    <div className="max-h-64 space-y-1 overflow-y-auto">
                        {profiles.map((profile, index) => {
                            const active = current.patient_id === profile.patient_id;
                            return (
                                <button key={profile.patient_id} type="button"
                                    onClick={() => { if (!active) switchTo(profile.is_self ? null : profile.patient_id); onDone?.(); }}
                                    className={cn("flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors",
                                        active ? "border-emerald-200 bg-emerald-50" : "border-transparent hover:bg-white")}>
                                    <ProfileAvatar name={profile.name} index={index} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#1F1E1E]">{profile.name}</span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {profile.is_self ? "Primary Account" : profileSubtitle(profile).replace(", ", " • ")}
                                        </span>
                                    </span>
                                    {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 border-t border-[#E7E8EB]">
                        <Link href="/family-members?add=1" onClick={onDone}
                            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-primary hover:bg-white">
                            <UserPlus className="h-4 w-4" /> Add Member
                        </Link>
                        <Link href="/family-members" onClick={onDone}
                            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#1F1E1E] hover:bg-white">
                            <Settings2 className="h-4 w-4 text-muted-foreground" /> Manage
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
