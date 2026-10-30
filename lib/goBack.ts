"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * In-portal "Back": goes to the previous portal page, or to `fallback` (Home) when this tab
 * opened the portal straight on this page (external link, new tab, bookmark), so Back never
 * leaves the portal.
 *
 * The portal pages visited in this tab are kept in sessionStorage by `usePortalHistory`.
 */
const KEY = "portal-history";

const readStack = (): string[] => {
    try {
        const value = JSON.parse(sessionStorage.getItem(KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

const writeStack = (stack: string[]) => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-50)));
    } catch {
        // storage blocked: Back falls back to Home
    }
};

export function goBackInPortal(router: { back: () => void; push: (href: string) => void }, fallback = "/") {
    if (typeof window !== "undefined" && readStack().length > 1) router.back();
    else router.push(fallback);
}

/** Records the portal pages visited in this tab. Mounted once in the root layout. */
export function usePortalHistory() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;
        const stack = readStack();
        if (stack[stack.length - 1] === pathname) return;
        // Going back to the previous page: drop the page we left.
        if (stack[stack.length - 2] === pathname) stack.pop();
        else stack.push(pathname);
        writeStack(stack);
    }, [pathname]);
}

export function PortalHistoryTracker() {
    usePortalHistory();
    return null;
}
