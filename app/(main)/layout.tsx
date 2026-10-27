import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import PatientRegionPrompt from "@/components/PatientRegionPrompt";
import PhoneVerificationGate from "@/components/auth/PhoneVerificationGate";
import { Toaster } from "sonner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            {/* Extra space at the bottom on phones / tablets, for the bottom navigation. */}
            <div className="flex-1 min-h-screen px-5 sm:px-5 pt-5 pb-24 lg:pb-5 mx-auto w-full">
                {children}
            </div>
            {/* Logged-in patients without a saved country are asked for it once (pricing). */}
            <PatientRegionPrompt />
            {/* Accounts without a verified mobile number confirm it first (WhatsApp code). */}
            <PhoneVerificationGate />
            <Toaster richColors position="top-right" />
            <Footer />
        </>
    );
}
