"use client";

/**
 * Contact details at the bottom of a doctor's profile, from Admin → Settings → Support:
 * one block per consultation mode the doctor offers (both when the doctor has no OPD open).
 */

import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Hospital, Mail, MapPin, Phone, Video } from "lucide-react";

interface SupportContact {
    phone?: string;
    email?: string;
    address?: string;
}

interface SupportContactResponse {
    video: SupportContact;
    in_person: SupportContact;
}

interface SupportContactFooterProps {
    showInPerson: boolean;
    showVideo: boolean;
}

const hasContact = (contact?: SupportContact) => !!contact && (!!contact.phone || !!contact.email || !!contact.address);

const ContactBlock = ({ title, icon: Icon, contact }: { title: string; icon: typeof Video; contact: SupportContact }) => (
    <div className="flex-1 min-w-0 rounded-lg border border-[#E7E8EB] bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-black">
            <Icon size={16} color="var(--primary)" />
            {title}
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-[#4D4D4D]">
            {contact.phone && (
                <li className="flex items-start gap-2">
                    <Phone size={14} className="mt-0.5 shrink-0" />
                    <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="font-medium text-black hover:text-primary hover:underline">
                        {contact.phone}
                    </a>
                </li>
            )}
            {contact.email && (
                <li className="flex items-start gap-2">
                    <Mail size={14} className="mt-0.5 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="break-all font-medium text-black hover:text-primary hover:underline">
                        {contact.email}
                    </a>
                </li>
            )}
            {contact.address && (
                <li className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span className="whitespace-pre-line">{contact.address}</span>
                </li>
            )}
        </ul>
    </div>
);

const SupportContactFooter = ({ showInPerson, showVideo }: SupportContactFooterProps) => {
    const { data } = useQuery({
        queryKey: ["support-contact"],
        queryFn: async () => (await api.get<{ data: SupportContactResponse }>("/support-contact")).data.data,
        staleTime: 30 * 60 * 1000,
    });

    // A doctor without any OPD open: show every contact, so the patient can still reach the hospital.
    const all = !showInPerson && !showVideo;
    const blocks = [
        (showInPerson || all) && hasContact(data?.in_person) && { key: "in-person", title: "In-person consultation", icon: Hospital, contact: data!.in_person },
        (showVideo || all) && hasContact(data?.video) && { key: "video", title: "Video consultation", icon: Video, contact: data!.video },
    ].filter(Boolean) as { key: string; title: string; icon: typeof Video; contact: SupportContact }[];

    if (blocks.length === 0) return null;

    return (
        <section id="contact" aria-labelledby="doctor-contact-title" className="container-max-width w-full mx-auto mt-8 scroll-mt-28 rounded-lg border border-[#E7E8EB] bg-light-gray p-4 sm:p-5">
            <h2 id="doctor-contact-title" className="text-base font-semibold text-black">Need help? Contact us</h2>
            <p className="mt-1 text-sm text-[#4D4D4D]">For questions about booking or your appointment, reach the hospital desk.</p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
                {blocks.map((block) => (
                    <ContactBlock key={block.key} title={block.title} icon={block.icon} contact={block.contact} />
                ))}
            </div>
        </section>
    );
};

export default SupportContactFooter;
