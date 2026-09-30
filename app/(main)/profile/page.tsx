"use client";

import { useAuth } from "@/context/userContext";
import PersonalInfoForm from "@/components/pages/profile/personal-info";
import HeroSection from "@/components/hero-section";

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div>
            <HeroSection
                title="Profile Settings"
                description="Update your name, Unit ID (C Number) and a short bio."
            />

            <div className="container-max-width mx-auto w-full">
                <section className="mx-auto max-w-3xl rounded-lg border border-[#E7E8EB] bg-white p-5 shadow-[0px_2px_4px_0px_#0000001A] sm:p-8">
                    <h2 className="mb-1 text-lg font-semibold text-[#1F1E1E]">Basic Information</h2>
                    <p className="mb-6 text-sm text-muted-foreground">These details appear on your appointments and bookings.</p>
                    {user ? (
                        <PersonalInfoForm user={user} />
                    ) : (
                        <div className="h-40 animate-pulse rounded-md bg-gray-100" aria-busy="true" />
                    )}
                </section>
            </div>
        </div>
    );
}
