'use client';

import HeroSection from '@/components/hero-section';

interface PrescriptionHeroSectionProps {
    onBack: () => void;
}

export const PrescriptionHeroSection = ({
    onBack,
}: PrescriptionHeroSectionProps) => {
    return (
        <HeroSection
            title="Prescription"
            description="Medicines and notes from your doctor for this visit."
            showBackButton
            onBack={onBack}
        />
    );
};
