"use client";

/**
 * Floating "Contact us" button, bottom-right on every page (visitors and logged-in patients).
 *  - Desktop: opens the Contact us page (inquiries, replies and the form).
 *  - Phones / tablets: opens just the form in a drawer on the same screen, with a link to that page.
 * Hidden on the contact page itself and during a video consultation.
 */

import { ContactFormDrawer } from "@/components/contact/ContactPanel";
import { MessageCircleQuestion } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const HIDDEN_ON = ["/contact-us", "/start-consultation"];

const ContactFab = () => {
    const pathname = usePathname() || "";
    const router = useRouter();
    const [open, setOpen] = useState(false);

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

    return (
        <>
            <button
                type="button"
                onClick={onClick}
                aria-label="Contact us"
                title="Contact us"
                className={`group fixed right-4 z-40 flex h-12 sm:h-14 cursor-pointer ${aboveBottomNav ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-5" : "bottom-5"} items-center gap-2 rounded-full bg-primary px-4 text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary print:hidden`}
            >
                <MessageCircleQuestion className="h-6 w-6 shrink-0" />
                <span className="hidden text-sm font-semibold sm:inline">Contact us</span>
            </button>

            <ContactFormDrawer open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default ContactFab;
