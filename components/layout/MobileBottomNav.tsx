"use client";

/**
 * Bottom navigation for phones and tablets (below the desktop menu's breakpoint): the main
 * sections as icons, with "More" opening the full menu (profile, family, notifications, log out).
 */

import { cn } from "@/lib/utils";
import { CalendarCheck, FileText, LayoutDashboard, LogIn, Menu, MessageCircleQuestion, Stethoscope, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface MobileBottomNavProps {
    isGuest: boolean;
    isActivePath: (href: string) => boolean;
    // Opens the full menu sheet.
    onMore: () => void;
    moreOpen: boolean;
    // Unread notifications: shown as a dot on "More" (notifications live in that menu).
    unreadCount?: number;
}

type Tab = { href: string; label: string; icon: LucideIcon };

const PATIENT_TABS: Tab[] = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/find-doctors", label: "Doctors", icon: Stethoscope },
    { href: "/appointments", label: "Appointments", icon: CalendarCheck },
    { href: "/medical-records", label: "Reports", icon: FileText },
];

const GUEST_TABS: Tab[] = [
    { href: "/find-doctors", label: "Doctors", icon: Stethoscope },
    { href: "/contact-us", label: "Contact", icon: MessageCircleQuestion },
    { href: "/auth/login", label: "Sign In", icon: LogIn },
];

const itemClass = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 text-[11px] font-semibold leading-none transition-colors";

export function MobileBottomNav({ isGuest, isActivePath, onMore, moreOpen, unreadCount = 0 }: MobileBottomNavProps) {
    const tabs = isGuest ? GUEST_TABS : PATIENT_TABS;
    // "More" is the current place when the open page is not one of the tabs (profile, medicines…).
    const onATab = tabs.some((tab) => isActivePath(tab.href));

    // Rendered at the end of <body>: the header blurs what is behind it, and a blurred parent
    // would pin this "fixed" bar to the header instead of the bottom of the screen.
    const inBrowser = useSyncExternalStore(() => () => {}, () => true, () => false);
    if (!inBrowser) return null;

    return createPortal(
        <nav
            aria-label="Main"
            data-bottom-nav
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur supports-backdrop-filter:bg-background/85 pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
        >
            <ul className="mx-auto flex max-w-xl items-stretch">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const active = isActivePath(href);
                    return (
                        <li key={href} className="flex flex-1">
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={cn(itemClass, active ? "text-primary" : "text-[#6B6B6B] hover:text-primary")}
                            >
                                {/* Active marker */}
                                <span aria-hidden className={cn("absolute top-0 h-0.5 w-8 rounded-full", active ? "bg-primary" : "bg-transparent")} />
                                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-primary/10")}>
                                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                                </span>
                                <span className="max-w-full truncate">{label}</span>
                            </Link>
                        </li>
                    );
                })}

                <li className="flex flex-1">
                    <button
                        type="button"
                        onClick={onMore}
                        aria-haspopup="dialog"
                        aria-expanded={moreOpen}
                        className={cn(itemClass, "cursor-pointer", moreOpen || (!isGuest && !onATab) ? "text-primary" : "text-[#6B6B6B] hover:text-primary")}
                    >
                        <span aria-hidden className={cn("absolute top-0 h-0.5 w-8 rounded-full", !isGuest && !onATab ? "bg-primary" : "bg-transparent")} />
                        <span className={cn("relative flex h-7 w-12 items-center justify-center rounded-full", !isGuest && !onATab && "bg-primary/10")}>
                            <Menu className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute right-2 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background">
                                    <span className="sr-only">{unreadCount} unread notifications</span>
                                </span>
                            )}
                        </span>
                        <span>More</span>
                    </button>
                </li>
            </ul>
        </nav>,
        document.body
    );
}
