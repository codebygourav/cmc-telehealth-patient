"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/userContext";
import { getFamilyProfiles, type FamilyManager, type FamilyProfile } from "@/api/family";
import { ACTIVE_PROFILE_EVENT, ACTIVE_PROFILE_STORAGE_KEY, getActiveProfileId, setActiveProfileId } from "@/lib/activeProfile";

interface ActiveProfileContextValue {
    profiles: FamilyProfile[];
    ownProfile: FamilyProfile | null;
    familyMembers: FamilyProfile[];
    activeProfile: FamilyProfile | null;
    // Viewing a family member (not the account holder's own profile).
    isFamilyView: boolean;
    relationships: Record<string, string>;
    maxProfiles: number;
    // Signed in as a family member: the primary account(s) managing this profile.
    managedBy: FamilyManager[];
    // The profile being viewed (or my own) and the family members added under it.
    viewedProfile: FamilyProfile | null;
    viewedFamily: FamilyProfile[];
    // Profiles that used to be in the viewed profile's family (can be linked again by code).
    unlinkedFamily: FamilyProfile[];
    loading: boolean;
    switchTo: (patientId: string | null) => void;
    refresh: () => Promise<unknown>;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | undefined>(undefined);

export const familyProfilesKey = (userId?: string) => ["family-profiles", userId] as const;

export function ActiveProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeId, setActiveId] = useState<string | null>(null);

    // Read the saved choice on the client (and follow changes from other tabs / logout).
    useEffect(() => {
        setActiveId(getActiveProfileId());
        const onChange = (event: Event) => setActiveId((event as CustomEvent<string | null>).detail ?? null);
        // Switched in ANOTHER tab: this tab would otherwise show one profile while loading the
        // other's data. Reload so it shows only the newly chosen profile, like a fresh login.
        const onStorage = (event: StorageEvent) => {
            if (event.key === ACTIVE_PROFILE_STORAGE_KEY && event.oldValue !== event.newValue) {
                window.location.reload();
            }
        };
        window.addEventListener(ACTIVE_PROFILE_EVENT, onChange);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(ACTIVE_PROFILE_EVENT, onChange);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    // A different login in this browser: drop the cache of the previous account and re-read the
    // profile choice (it is only kept for the login that made it).
    const previousUserId = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        const id = user?.id ?? null;
        if (previousUserId.current !== undefined && previousUserId.current !== id) {
            queryClient.clear();
            setActiveId(getActiveProfileId());
        }
        previousUserId.current = id;
    }, [user?.id, queryClient]);

    const { data, isPending, refetch } = useQuery({
        queryKey: familyProfilesKey(user?.id),
        queryFn: getFamilyProfiles,
        enabled: Boolean(user?.id),
        staleTime: 60_000,
    });

    // Unlinked profiles come in the same list (flag is_unlinked): they are only shown on the Family
    // page to link again, never in the switcher, booking or counts.
    const allProfiles = useMemo(() => data?.profiles ?? [], [data]);
    const profiles = useMemo(() => allProfiles.filter((profile) => !profile.is_unlinked), [allProfiles]);
    const ownProfile = profiles.find((profile) => profile.is_self) ?? null;
    const familyMembers = profiles.filter((profile) => !profile.is_self);
    const activeProfile = (activeId && profiles.find((profile) => profile.patient_id === activeId)) || ownProfile;
    const isFamilyView = Boolean(activeProfile && !activeProfile.is_self);

    const switchTo = useCallback((patientId: string | null) => {
        const next = patientId && patientId !== ownProfile?.patient_id ? patientId : null;
        setActiveProfileId(next);
        setActiveId(next);
        // Every patient screen refetches for the selected profile (the family list itself is kept).
        queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== "family-profiles" });
        // Reload like a fresh login so every screen shows only the switched profile's data.
        if (typeof window !== "undefined") window.location.assign("/");
    }, [ownProfile?.patient_id, queryClient]);

    // The saved profile was unlinked (or belongs to another login): go back to the own profile.
    useEffect(() => {
        if (data && activeId && !profiles.some((profile) => profile.patient_id === activeId)) {
            switchTo(null);
        }
    }, [data, activeId, profiles, switchTo]);

    // Signed out: forget the family view.
    useEffect(() => {
        if (!user && activeId) {
            setActiveProfileId(null);
            setActiveId(null);
        }
    }, [user, activeId]);

    const value: ActiveProfileContextValue = {
        profiles,
        ownProfile,
        familyMembers,
        activeProfile,
        isFamilyView,
        relationships: data?.relationships ?? {},
        maxProfiles: data?.max_profiles ?? 10,
        managedBy: data?.managed_by ?? [],
        viewedProfile: activeProfile ?? ownProfile,
        viewedFamily: profiles.filter((profile) => !profile.is_self && profile.added_under === (activeProfile ?? ownProfile)?.patient_id),
        unlinkedFamily: allProfiles.filter((profile) => profile.is_unlinked && profile.added_under === (activeProfile ?? ownProfile)?.patient_id),
        loading: Boolean(user?.id) && isPending,
        switchTo,
        refresh: refetch,
    };

    return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>;
}

export function useActiveProfile() {
    const context = useContext(ActiveProfileContext);
    if (!context) {
        throw new Error("useActiveProfile must be used inside ActiveProfileProvider");
    }
    return context;
}

// "AM" from "Aman Makkar"
export const profileInitials = (name?: string | null) =>
    (name || "?")
        .split(/\s+/)
        .filter((part) => part && part !== ".")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";

// "Spouse · Female, 32y"
export const profileSubtitle = (profile: FamilyProfile) =>
    [
        profile.relationship_label,
        [profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null, profile.age != null ? `${profile.age}y` : null]
            .filter(Boolean)
            .join(", "),
    ]
        .filter(Boolean)
        .join(" · ");
