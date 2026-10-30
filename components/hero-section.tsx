"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { goBackInPortal } from "@/lib/goBack";

interface HeroSectionProps {
    title: string;
    description: string;
    onBack?: () => void;
    showBackButton?: boolean;
    /** Where Back goes when there is no browser history (opened from a link / new tab). */
    backHref?: string;
    /** Optional action or text link to render on the right of the header title row */
    rightAction?: React.ReactNode;
}

const HeroSection = ({ title, description, onBack, showBackButton = false, backHref = "/", rightAction }: HeroSectionProps) => {
    const router = useRouter();
    const goBack = () => {
        if (onBack) return onBack();
        goBackInPortal(router, backHref);
    };

    if (!showBackButton) {
        return (
            <div className="-mx-5 -mt-5 sm:mt-0 sm:mx-auto w-[calc(100%+2.5rem)] sm:w-full container-max-width px-5 py-5 sm:py-6 md:py-10 md:px-10 bg-secondary-menu-color rounded-none sm:rounded-md border-b sm:border border-[#E7E8EB] g-border-light mb-5">
                {rightAction ? (
                    <div className="mx-auto">
                        <div className="flex items-center justify-between gap-3">
                            <h1 className="text-xl font-bold text-black sm:text-2xl md:text-3xl lg:text-4xl">{title}</h1>
                            <div className="shrink-0">{rightAction}</div>
                        </div>
                        {description && (
                            <p className="mt-1.5 text-xs text-gray-500 sm:text-sm md:text-base leading-relaxed md:mt-2.5">{description}</p>
                        )}
                    </div>
                ) : (
                    <div className="max-w-[600px] mx-auto flex flex-col items-center justify-center">
                        <h1 className="text-2xl font-bold text-center text-black md:text-4xl">{title}</h1>
                        <p className="mt-2 text-base text-center text-gray-500 md:text-lg text-gray md:mt-4">{description}</p>
                    </div>
                )}
            </div>
        );
    }

    // With Back: phones get a "‹ Back" link above a left-aligned title; from md the title is
    // centred and a round back button sits vertically centred on the left.
    return (
        <div className="relative -mx-5 -mt-5 sm:mt-0 sm:mx-auto w-[calc(100%+2.5rem)] sm:w-full container-max-width mb-5 rounded-none sm:rounded-md bg-secondary-menu-color px-5 py-4 border-b sm:border border-[#E7E8EB] g-border-light md:px-24 md:py-10">
            <button type="button" onClick={goBack}
                className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 md:hidden">
                <ChevronLeft className="size-4" />
                <span>Back</span>
            </button>
            <button type="button" onClick={goBack} aria-label="Go back"
                className="hidden md:flex absolute left-6 top-1/2 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E7E8EB] bg-white text-primary shadow-sm transition-colors hover:bg-primary hover:text-white">
                <ChevronLeft className="size-5" />
            </button>
            <div className="min-w-0 md:mx-auto md:max-w-[600px] md:text-center">
                <h1 className="text-xl font-bold leading-tight text-black md:text-4xl">{title}</h1>
                <p className="mt-0.5 text-sm text-gray-500 md:mt-3 md:text-lg">{description}</p>
            </div>
        </div>
    );
};

export default HeroSection;
