"use client";

/**
 * Floating "Contact us" button, bottom-right on every page (visitors and logged-in patients).
 *  - Desktop: opens the Contact us page (inquiries, replies and the form).
 *  - Phones / tablets: opens just the form in a drawer on the same screen, with a link to that page.
 * Hidden on the contact page itself and during a video consultation.
 */

import { ContactFormDrawer } from "@/components/contact/ContactPanel";
import { ArrowUp, MessageCircleQuestion } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const HIDDEN_ON = ["/contact-us", "/start-consultation"];

const ContactFab = () => {
    const pathname = usePathname() || "";
    const router = useRouter();
    const [open, setOpen] = useState(false);
    // Phones / tablets: near the bottom of the page this button turns into "Back to top"
    // (one floating button, never two stacked).
    const [nearBottom, setNearBottom] = useState(false);

    useEffect(() => {
        const update = () => {
            const isMobile = !window.matchMedia("(min-width: 1024px)").matches;
            const scrollable = document.documentElement.scrollHeight > window.innerHeight * 1.5;
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
            setNearBottom(isMobile && scrollable && atBottom);
        };
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, [pathname]);

    if (HIDDEN_ON.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        return null;
    }

    // Pages with the bottom navigation (everything except sign-in / registration): sit above it.
    const aboveBottomNav = !pathname.startsWith("/auth") && pathname !== "/unauthorized";

    const onClick = () => {
        // Same breakpoint as the desktop menu.
        if (window.matchMedia("(min-width: 1024px)").matches) {
            router.push("/contact-us");
        } else {
            setOpen(true);
        }
    };

    const position = aboveBottomNav ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-5" : "bottom-5";

    return (
        <>
            {nearBottom ? (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    aria-label="Back to top"
                    data-contact-fab
                    title="Back to top"
                    className={`fixed right-4 z-40 flex h-12 w-12 cursor-pointer ${position} items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-90 duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary print:hidden`}
                >
                    <ArrowUp className="h-6 w-6" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onClick}
                    aria-label="Contact us"
                    data-contact-fab
                    title="Contact us"
                    className={`group fixed right-4 z-40 flex h-12 sm:h-14 cursor-pointer ${position} items-center gap-2 rounded-full bg-primary px-4 text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary print:hidden`}
                >
                    <MessageCircleQuestion className="h-6 w-6 shrink-0" />
                    <span className="hidden text-sm font-semibold sm:inline">Contact us</span>
                </button>
            )}

            <ContactFormDrawer open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default ContactFab;
