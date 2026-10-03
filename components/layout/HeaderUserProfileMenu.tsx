"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui";
import type { User } from "@/types/user-context";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useActiveProfile } from "@/context/activeProfileContext";
import ProfileSwitcherList, { ProfileAvatar } from "./ProfileSwitcherList";
import Link from "next/link";

interface HeaderUserProfileMenuProps {
    user: User | null | undefined;
    initializing: boolean;
    name: string;
    onLogout: () => Promise<void>;
}

export function HeaderUserProfileMenu({
    user,
    initializing,
    name,
    onLogout,
}: HeaderUserProfileMenuProps) {

    const { activeProfile, profiles } = useActiveProfile();
    const shownName = activeProfile?.name || name;
    const activeIndex = Math.max(0, profiles.findIndex((profile) => profile.patient_id === activeProfile?.patient_id));

    return (
        <div className="flex items-center gap-3 justify-end">
            {initializing ? (
                <div className="hidden animate-pulse flex-col items-end gap-1.5 md:flex" aria-label="Loading account">
                    <span className="h-3.5 w-24 rounded bg-gray-200" />
                    <span className="h-2.5 w-32 rounded bg-gray-200" />
                </div>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-2.5 rounded-xl border border-[#E7E8EB] bg-white py-1.5 pl-1.5 pr-3 text-left transition-colors hover:border-primary/40"
                        >
                            <ProfileAvatar name={shownName} index={activeIndex} className="h-9 w-9 text-xs" />
                            <span className="hidden min-w-0 md:block">
                                <span className="flex items-center gap-1.5">
                                    <span className="max-w-40 truncate text-sm font-semibold text-foreground">{shownName}</span>
                                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                        {activeProfile && !activeProfile.is_self ? activeProfile.relationship_label : "Primary"}
                                    </span>
                                </span>
                                <span className="block text-xs text-muted-foreground">Switch Profile</span>
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-80 p-2">
                        <ProfileSwitcherList />

                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/profile">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Profile Settings</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={onLogout}
                            disabled={initializing}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
