import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "./providers";
import ContactFab from "@/components/ContactFab";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import { TooltipProvider } from "@/components/ui/tooltip";

const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-headings',
})

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-sans',
})

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export const metadata: Metadata = {
    title: "Deploymeta Telehealth - Patients",
    description: "A Progressive Web App for Patients in Deploymeta Telehealth",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: "/icons/icon-192x192.png",
        apple: "/icons/icon-192x192.png",
    },
    // iPhone / iPad: opens full screen with this name when added to the Home Screen.
    appleWebApp: {
        capable: true,
        title: "CMC Telehealth",
        statusBarStyle: "default",
    },
};

// Browser / app bar colour (brand green), also used by the installed app.
export const viewport: Viewport = {
    themeColor: "#073827",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={cn("antialiased", fontMono.variable, "font-sans", manrope.variable, cormorant.variable)}
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col" suppressHydrationWarning>
                <Providers>
                    <TooltipProvider>
                        {children}
                        {/* Floating "Contact us" button on every page. */}
                        <ContactFab />
                        {/* Offers to install the portal as an app. */}
                        <InstallAppPrompt appName="CMC Telehealth" />
                    </TooltipProvider>
                </Providers>
            </body>
        </html>
    );
}