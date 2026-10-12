"use client";

import { ContactForm, ContactFormDrawer, ContactInquiries, useInquiries } from "@/components/contact/ContactPanel";
import HeroSection from "@/components/hero-section";
import SupportContactFooter from "@/components/pages/doctor-profile/SupportContactFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/userContext";
import { Plus } from "lucide-react";
import { useState } from "react";

const cardClass = "rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.08)] ring-1 ring-[#EEF0F2] sm:p-6";

/**
 * Contact us.
 *  - Visitor: the form.
 *  - Logged-in patient: their inquiries with the support team's replies, and the form for a new
 *    inquiry (desktop: beside the list; phones / tablets: a "New inquiry" button opens it in a drawer).
 */
const ContactUsPage = () => {
    const { user, initializing } = useAuth();
    const { data: inquiries } = useInquiries();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const count = inquiries?.length ?? 0;

    return (
        <>
            <HeroSection title="Contact Us" description="Have a question about booking, payment or your appointment? Send us a message and our team will get back to you." />

            <div className="container-max-width w-full mx-auto mt-6">
                {user ? (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                        <section aria-labelledby="my-inquiries-title" className="lg:col-span-7">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 id="my-inquiries-title" className="text-lg font-semibold text-black">
                                    My inquiries{count > 0 && <span className="ml-1.5 text-sm font-medium text-[#8A8A8A]">({count})</span>}
                                </h2>
                                {/* Phones / tablets: the form opens in a drawer. Desktop shows it beside the list. */}
                                <Button type="button" onClick={() => setDrawerOpen(true)} className="h-9 gap-1.5 px-3 text-sm font-semibold lg:hidden">
                                    <Plus className="h-4 w-4" />
                                    New inquiry
                                </Button>
                            </div>
                            <ContactInquiries />
                        </section>

                        <aside aria-labelledby="new-inquiry-title" className="hidden lg:col-span-5 lg:block lg:sticky lg:top-28">
                            <div className={cardClass}>
                                <h2 id="new-inquiry-title" className="text-lg font-semibold text-black">New inquiry</h2>
                                <p className="mt-0.5 mb-4 text-sm text-[#4D4D4D]">Our reply will show in your inquiries and is emailed to you.</p>
                                <ContactForm />
                            </div>
                        </aside>
                    </div>
                ) : (
                    !initializing && (
                        <div className={`mx-auto max-w-2xl ${cardClass}`}>
                            <h2 className="text-lg font-semibold text-black">Send us a message</h2>
                            <p className="mt-0.5 mb-4 text-sm text-[#4D4D4D]">We will reply to your email address.</p>
                            <ContactForm />
                        </div>
                    )
                )}
            </div>

            <ContactFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} showInquiriesLink={false} />

            {/* Phone, email and address from Admin → Settings → Support. */}
            <SupportContactFooter showInPerson showVideo />
        </>
    );
};

export default ContactUsPage;
