"use client";

import {
    Badge,
    Button,
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/header";
import { Bell, LogOut, Menu, User as UserIcon, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/assets/icon/logo-green.png";
import { useSettings } from "@/context/settingsContext";
import MobileMenuProfileCard from "./MobileMenuProfileCard";
import { useUnreadCount } from "@/queries/useNotifications";
import type { Dispatch, ReactNode, SetStateAction } from "react";

interface HeaderNavLinksProps {
    items: NavItem[];
    pathname: string;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
    isActivePath: (href: string) => boolean;
    onLogout: () => Promise<void>;
    // Guest (not logged in): no notifications / logout, show Sign In & Register instead.
    isGuest?: boolean;
}

export function HeaderNavLinks({
    items,
    pathname,
    mobileMenuOpen,
    setMobileMenuOpen,
    isActivePath,
    onLogout,
    isGuest = false,
}: HeaderNavLinksProps) {
    const { settings } = useSettings();
    const { data: unread } = useUnreadCount();
    const unreadCount = Number(unread) || 0;

    return (

        <>
            <nav className="items-center justify-center flex-1 hidden lg:flex">
                <div className="flex items-center gap-2 p-1 global-radius">
                    {items.map((item) => {
                        const isActive = isActivePath(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "inline-flex items-center gap-2 global-radius px-4 py-2 text-sm font-bold transition-all duration-200 ",
                                    isActive
                                        ? "border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/85"
                                        : "border border-primary bg-white text-primary hover:bg-primary hover:text-primary-foreground",
                                )}
                            >
                                {item.icon}
                                <span className="text-span-14 whitespace-nowrap">{item.title}</span>
                                {item.badge ? (
                                    <Badge
                                        variant={isActive ? "secondary" : "default"}
                                        className={cn(
                                            "ml-1 rounded-full px-2 py-0 text-[10px]",
                                            isActive && "bg-primary-foreground/15 text-primary-foreground",
                                        )}
                                    >
                                        {Number(item.badge) > 99 ? "99+" : item.badge}
                                    </Badge>
                                ) : null}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shadow-sm h-11 w-11 global-radius border-border/70 bg-background"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="right" className="flex h-full max-h-dvh w-[340px] max-w-[92vw] flex-col gap-0 border-l border-border/60 px-0 sm:w-[380px]">
                        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b border-border/40 px-5 pt-5 pb-4 text-left">
                            <SheetTitle className="flex items-center">
                                <Image src={settings.logoUrl || logo} alt={settings.appName || "CMC Telehealth"} width={150} height={36}
                                    className="h-9 w-auto object-contain" priority unoptimized />
                            </SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
                            {!isGuest && <MobileMenuProfileCard onDone={() => setMobileMenuOpen(false)} />}

                            <MenuSection title={isGuest ? undefined : "Medical services"}>
                                {items.map((item) => (
                                    <MenuLink key={item.href} href={item.href} icon={item.icon} label={item.title} active={isActivePath(item.href)}
                                        badge={item.badge} onClick={() => setMobileMenuOpen(false)} />
                                ))}
                            </MenuSection>

                            {!isGuest && (
                                <MenuSection title="Account">
                                    <MenuLink href="/notifications" icon={<Bell className="h-4 w-4" />} label="Notifications" active={pathname === "/notifications"}
                                        count={unreadCount} onClick={() => setMobileMenuOpen(false)} />
                                    <MenuLink href="/profile" icon={<UserIcon className="h-4 w-4" />} label="My Profile" active={pathname === "/profile"}
                                        onClick={() => setMobileMenuOpen(false)} />
                                    <MenuLink href="/family-members" icon={<Users className="h-4 w-4" />} label="Family Profiles" active={pathname === "/family-members"}
                                        onClick={() => setMobileMenuOpen(false)} />
                                </MenuSection>
                            )}
                        </div>

                        <div className="shrink-0 border-t border-border/40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            {isGuest ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                                        className="flex h-12 items-center justify-center rounded-xl border border-border/80 bg-background text-sm font-semibold text-foreground hover:bg-muted">Sign In</Link>
                                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                                        className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">Register</Link>
                                </div>
                            ) : (
                                <button type="button" onClick={async () => { setMobileMenuOpen(false); await onLogout(); }}
                                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-base font-semibold text-red-600 transition-colors hover:bg-red-100">
                                    <LogOut className="h-5 w-5" /> Log Out
                                </button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}

const MenuSection = ({ title, children }: { title?: string; children: ReactNode }) => (
    <div>
        {title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>}
        <div className="space-y-2">{children}</div>
    </div>
);

const MenuLink = ({ href, icon, label, active, onClick, badge, count }: {
    href: string; icon: ReactNode; label: string; active: boolean; onClick: () => void; badge?: string | number; count?: number;
}) => (
    <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined}
        className={cn("flex items-center gap-3.5 rounded-lg border px-3.5 py-3 text-[15px] font-medium transition-colors",
            active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-primary/35 bg-white text-[#1F1E1E] hover:border-primary hover:bg-primary/5")}>
        <span className={cn("shrink-0 [&_svg]:h-5 [&_svg]:w-5", active ? "text-primary-foreground" : "text-muted-foreground")}>{icon}</span>
        <span className="flex-1">{label}</span>
        {count ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-50 px-1.5 text-xs font-bold text-red-600">{count > 99 ? "99+" : count}</span>
        ) : badge ? (
            <span className="text-xs font-semibold opacity-80">{badge}</span>
        ) : active ? (
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
        ) : null}
    </Link>
);
