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
import { Bell, LogOut, Menu, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/assets/icon/logo-green.png";
import { useSettings } from "@/context/settingsContext";
import ProfileSwitcherList from "./ProfileSwitcherList";
import type { Dispatch, SetStateAction } from "react";

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

                    <SheetContent side="right" className="w-[320px] sm:w-[360px] border-l border-border/60 px-0 flex flex-col h-full max-h-screen">
                        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40 text-left flex flex-row items-center justify-between shrink-0">
                            <SheetTitle className="text-base font-bold flex items-center">
                                <Image
                                    src={settings.logoUrl || logo}
                                    alt={settings.appName || "CMC Telehealth"}
                                    width={150}
                                    height={36}
                                    className="object-contain w-auto h-8"
                                    priority
                                    unoptimized
                                />
                            </SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-2.5">
                            {items.map((item) => {
                                const isActive = isActivePath(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-2xs",
                                            isActive
                                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                : "border-border/70 bg-background text-foreground/85 hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                                        )}
                                    >
                                        <span className={cn("shrink-0", isActive ? "text-primary-foreground" : "text-primary")}>
                                            {item.icon}
                                        </span>
                                        <span className="flex-1">{item.title}</span>
                                        {item.badge ? (
                                            <Badge
                                                variant={isActive ? "secondary" : "default"}
                                                className={cn(
                                                    "rounded-full px-2 py-0 text-[10px]",
                                                    isActive && "bg-primary-foreground/15 text-primary-foreground",
                                                )}
                                            >
                                                {Number(item.badge) > 99 ? "99+" : item.badge}
                                            </Badge>
                                        ) : null}
                                    </Link>
                                );
                            })}

                            {isGuest ? (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-center rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                                    >
                                        Register
                                    </Link>
                                </div>
                            ) : (
                            <>
                            <div className="mt-2 rounded-2xl border border-border/80 bg-muted/20 p-2 shadow-2xs">
                                <ProfileSwitcherList onDone={() => setMobileMenuOpen(false)} />
                            </div>

                            <Link
                                href="/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "mt-1 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-2xs",
                                    pathname === "/profile"
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "border-border/70 bg-background text-foreground/85 hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                                )}
                            >
                                <UserIcon className={cn("w-4 h-4 shrink-0", pathname === "/profile" ? "text-primary-foreground" : "text-primary")} />
                                <span className="flex-1">My Profile</span>
                            </Link>

                            <Link
                                href="/notifications"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-2xs",
                                    pathname === "/notifications"
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "border-border/70 bg-background text-foreground/85 hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                                )}
                            >
                                <Bell className={cn("w-4 h-4 shrink-0", pathname === "/notifications" ? "text-primary-foreground" : "text-primary")} />
                                <span className="flex-1">Notifications</span>
                            </Link>

                            <button
                                type="button"
                                onClick={async () => {
                                    setMobileMenuOpen(false);
                                    await onLogout();
                                }}
                                className="mt-1 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4 shrink-0 text-destructive" />
                                <span className="flex-1 text-left">Log out</span>
                            </button>
                            </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
