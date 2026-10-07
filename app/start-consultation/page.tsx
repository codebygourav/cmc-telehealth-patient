"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useActiveProfile } from "@/context/activeProfileContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Pill, FileUser, Loader2 } from "lucide-react";
import { PrescribeMedicineDialog } from "@/components/ui/PrescribeMedicineDialog";


const ConsultationContent = () => {

    const searchParams = useSearchParams();
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    // Join under the visit's patient name (sent by the server). Whereby remembers the last typed
    // name in this browser, so a link without a name gets the viewed profile's name instead.
    const roomUrl = useMemo(() => {
        const raw = searchParams.get("room_url");
        if (!raw) return raw;
        try {
            const url = new URL(raw);
            if (!url.searchParams.get("displayName") && activeProfile?.name) {
                url.searchParams.set("displayName", activeProfile.name);
            }
            return url.toString();
        } catch {
            return raw;
        }
    }, [searchParams, activeProfile?.name]);
    const appointmentId = searchParams.get("appointment_id");

    const [joined, setJoined] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    const [prescribeModal, setPrescribeModal] = useState(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Whereby sends postMessage events from the iframe
            if (event.data?.type === "join") {
                setJoined(true);
            }
            if (event.data?.type === "leave") {
                setJoined(false);
                setChatOpen(false);
            }
            // Fires when chat or people panel opens/closes
            if (event.data?.type === "chat_toggle" || event.data?.type === "people_toggle") {
                setChatOpen(event.data?.open ?? false);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    if (!roomUrl) {
        return (
            <div className="flex h-dvh w-full items-center justify-center p-4 text-sm text-destructive">
                No Room URL provided.
            </div>
        );
    }

    return (
        // h-dvh: the visible screen height on phones (h-screen is taller than Safari's view and "sticks").
        <div className="relative h-dvh w-full overflow-hidden bg-[#063a28]">

            {/* Whereby iframe — full default Whereby UI */}
            <iframe
                src={roomUrl}
                allow="camera; microphone; fullscreen; speaker; display-capture"
                className="w-full h-full border-none"
            />

            {/* Custom buttons — shown only after joining */}
            {joined && (
                // Phones: top-left corner (Whereby's control bar spans the whole bottom).
                // Desktop: bottom-left, next to Whereby's centred controls.
                <div className="absolute left-3 top-3 z-50 flex gap-2 sm:left-5 sm:top-auto sm:bottom-3">
                    <button type="button" onClick={() => setPrescribeModal(true)} title="Prescription"
                        className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white shadow-md backdrop-blur hover:bg-black/75 sm:rounded-md sm:px-3.5 sm:py-2.5 sm:text-sm">
                        <Pill className="h-4 w-4" /> Prescription
                    </button>
                </div>
            )}

            <PrescribeMedicineDialog
                appointmentId={appointmentId}
                isOpen={prescribeModal}
                onClose={() => setPrescribeModal(false)}
            />
        </div>
    );
};

export default function StartConsultation() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <ConsultationContent />
        </Suspense>
    );
}