import { BadgeCheck, CreditCard, MailCheck, Video } from "lucide-react";

// What happens after "Confirm & Book" (shown while the booking is unpaid).
// In-person visits are confirmed straight away; video consultations are confirmed by the doctor,
// who also sets the call time.
export default function NextStepsCard({ isVideo = false }: { isVideo?: boolean }) {
    const steps = isVideo
        ? [
            { icon: CreditCard, title: "Pay to reserve your slot", text: "Complete the payment to book this video consultation." },
            { icon: BadgeCheck, title: "Doctor confirms the time", text: "The doctor confirms and sets the call time. You get an email." },
            { icon: Video, title: "Join the call", text: "The join link appears in My Appointments 1 hour before." },
        ]
        : [
            { icon: CreditCard, title: "Pay to reserve your slot", text: "Complete the payment to hold this time for you." },
            { icon: MailCheck, title: "Confirmed by email", text: "Your appointment is confirmed straight away." },
            { icon: BadgeCheck, title: "Visit the clinic", text: "Please reach the clinic at least 45 minutes early." },
        ];

    return (
        <section className="rounded-lg border border-[#E7E8EB] bg-white p-5 shadow-[0px_2px_4px_0px_#0000001A]">
            <h3 className="mb-4 text-base font-semibold text-[#1F1E1E]">What happens next</h3>
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {steps.map(({ icon: Icon, title, text }, index) => (
                    <li key={title} className="flex gap-3">
                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                            <Icon className="h-4 w-4" />
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary ring-1 ring-primary">
                                {index + 1}
                            </span>
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#1F1E1E]">{title}</p>
                            <p className="text-xs text-[#4D4D4D]">{text}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
