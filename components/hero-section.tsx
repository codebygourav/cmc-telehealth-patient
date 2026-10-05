"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
    title: string;
    description: string;
    onBack?: () => void;
    showBackButton?: boolean;
    /** Where Back goes when there is no browser history (opened from a link / new tab). */
    backHref?: string;
}

const HeroSection = ({ title, description, onBack, showBackButton = false, backHref = "/" }: HeroSectionProps) => {
    const router = useRouter();
    const goBack = () => {
        if (onBack) return onBack();
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(backHref);
    };

    if (!showBackButton) {
        return (
            <div className="container-max-width mx-auto w-full px-4 py-6 md:py-12 md:px-10 bg-secondary-menu-color rounded-xl g-border-light mb-5">
                <div className="max-w-[600px] mx-auto flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold text-center text-black md:text-4xl">{title}</h1>
                    <p className="mt-2 text-base text-center text-gray-500 md:text-lg text-gray md:mt-4">{description}</p>
                </div>
            </div>
        );
    }

    // With Back: phones get a compact row (button + left-aligned title); from md the title is
    // centred and the button sits vertically centred on the left.
    return (
        <div className="relative container-max-width mx-auto mb-5 flex w-full items-center gap-3 rounded-xl bg-secondary-menu-color px-3 py-4 g-border-light md:block md:px-24 md:py-10">
            <button type="button" onClick={goBack} aria-label="Go back"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E7E8EB] bg-white text-primary shadow-sm transition-colors hover:bg-primary hover:text-white md:absolute md:left-6 md:top-1/2 md:h-11 md:w-11 md:-translate-y-1/2">
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
