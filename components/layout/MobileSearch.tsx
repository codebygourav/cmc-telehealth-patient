"use client";

/**
 * Search for phones and tablets: the search icon in the header opens a panel where the patient
 * can find a doctor (by name or department) or jump to a section of the portal.
 */

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/userContext";
import { useBrowseDoctors } from "@/queries/useBrowseDoctors";
import type { Doctor } from "@/types/browse-doctors";
import { ArrowRight, CalendarCheck, FileText, LayoutDashboard, MessageCircleQuestion, Pill, Search, Stethoscope, User, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Section = { href: string; label: string; keywords: string; icon: LucideIcon; needsLogin: boolean };

const SECTIONS: Section[] = [
    { href: "/", label: "Dashboard", keywords: "home dashboard", icon: LayoutDashboard, needsLogin: true },
    { href: "/find-doctors", label: "Find Doctors", keywords: "doctors specialists book appointment", icon: Stethoscope, needsLogin: false },
    { href: "/appointments", label: "My Appointments", keywords: "appointments bookings visits", icon: CalendarCheck, needsLogin: true },
    { href: "/medical-records", label: "Medical Reports", keywords: "reports records prescriptions lab", icon: FileText, needsLogin: true },
    { href: "/my-medicines", label: "My Medicine", keywords: "medicine medicines pills", icon: Pill, needsLogin: true },
    { href: "/profile", label: "My Profile", keywords: "profile account password", icon: User, needsLogin: true },
    { href: "/family-members", label: "Family Profiles", keywords: "family members", icon: Users, needsLogin: true },
    { href: "/contact-us", label: "Contact Us", keywords: "contact help support message", icon: MessageCircleQuestion, needsLogin: false },
];

const departmentOf = (doctor: Doctor): string => {
    const speciality = Array.isArray(doctor.speciality) ? doctor.speciality[0] : doctor.speciality;
    return typeof speciality === "string" ? speciality : speciality?.name ?? "";
};

const rowClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-black hover:bg-[#F3F4F6] focus-visible:bg-[#F3F4F6] outline-none";

export function MobileSearch() {
    const router = useRouter();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    // Loaded when the panel is first opened (and shared with the Find Doctors page).
    const { data } = useBrowseDoctors(undefined, open);

    const q = query.trim().toLowerCase();
    const sections = SECTIONS.filter((s) => (user || !s.needsLogin) && (q === "" || `${s.label} ${s.keywords}`.toLowerCase().includes(q)));
    const doctors = q === ""
        ? []
        : (data?.data ?? []).filter((d) => `${d.name} ${departmentOf(d)}`.toLowerCase().includes(q)).slice(0, 6);

    const go = (href: string) => {
        setOpen(false);
        setQuery("");
        router.push(href);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Search"
                aria-haspopup="dialog"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background text-[#1F1E1E] hover:bg-muted lg:hidden"
            >
                <Search className="h-5 w-5" />
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="top" showCloseButton={false} className="flex max-h-[85dvh] flex-col gap-0 rounded-b-2xl p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Search</SheetTitle>
                        <SheetDescription>Find a doctor or a section of the portal.</SheetDescription>
                    </SheetHeader>

                    <form
                        role="search"
                        className="flex items-center gap-2 border-b border-[#E7E8EB] px-4 py-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (q) go(`/find-doctors?search=${encodeURIComponent(query.trim())}`);
                        }}
                    >
                        <Search className="h-5 w-5 shrink-0 text-[#8A8A8A]" />
                        <input
                            type="search"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search doctors, departments, pages…"
                            aria-label="Search doctors, departments and pages"
                            className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A8A8A]"
                        />
                        <button type="button" onClick={() => setOpen(false)} className="shrink-0 cursor-pointer rounded-md px-2 py-1.5 text-sm font-semibold text-primary">
                            Cancel
                        </button>
                    </form>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
                        {doctors.length > 0 && (
                            <>
                                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">Doctors</p>
                                {doctors.map((doctor) => (
                                    <button key={doctor.id} type="button" className={rowClass} onClick={() => go(`/find-doctors/${doctor.id}`)}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={doctor.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[#E7E8EB]" referrerPolicy="no-referrer" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-semibold">{doctor.name}</span>
                                            {departmentOf(doctor) && <span className="block truncate text-xs text-[#6B6B6B]">{departmentOf(doctor)}</span>}
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}

                        {q !== "" && (
                            <button type="button" className={rowClass} onClick={() => go(`/find-doctors?search=${encodeURIComponent(query.trim())}`)}>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Search className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1 truncate">
                                    Search all doctors for <strong>&ldquo;{query.trim()}&rdquo;</strong>
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
                            </button>
                        )}

                        {sections.length > 0 && (
                            <>
                                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">{q === "" ? "Go to" : "Pages"}</p>
                                {sections.map(({ href, label, icon: Icon }) => (
                                    <button key={href} type="button" className={rowClass} onClick={() => go(href)}>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#4D4D4D]">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="flex-1 font-medium">{label}</span>
                                    </button>
                                ))}
                            </>
                        )}

                        {q !== "" && doctors.length === 0 && sections.length === 0 && (
                            <p className="px-3 py-4 text-sm text-[#6B6B6B]">No doctor or page matches. Try the doctor search above.</p>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
