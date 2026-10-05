"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Hospital, Video, X } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/context/userContext";

interface CallAlert {
    appointment_id: string;
    patient_name: string;
    is_own: boolean;
    relationship: string | null;
    doctor_name: string;
    consultation_type: "video" | "in-person";
    minutes_to_start: number;
    doctor_in_call: boolean;
    completed?: boolean;
    can_join: boolean;
    is_rejoin: boolean;
    join_url: string | null;
}

const DISMISS_KEY = "@call_alerts_dismissed";

const readDismissed = (): string[] => {
    try {
        return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]");
    } catch {
        return [];
    }
};

/**
 * Top bar for the signed-in account: its own visits and every managed family profile's visits,
 * from 10 minutes before the start, and while the doctor is waiting in a video call.
 */
export default function CallAlertBar() {
    const { user } = useAuth();
    const router = useRouter();
    const [dismissed, setDismissed] = useState<string[]>([]);
    useEffect(() => setDismissed(readDismissed()), []);

    const { data } = useQuery({
        queryKey: ["call-alerts", user?.id],
        queryFn: async (): Promise<CallAlert[]> => (await api.get("/patient/call-alerts")).data?.data ?? [],
        enabled: Boolean(user?.id),
        refetchInterval: 30 * 1000,
        refetchOnWindowFocus: true,
        staleTime: 20 * 1000,
    });

    // A dismissal is per appointment and situation: "doctor joined" shows again after "starts soon".
    const keyOf = (a: CallAlert) => `${a.appointment_id}:${a.doctor_in_call ? "doctor" : a.minutes_to_start > 0 ? "soon" : "open"}`;
    const alerts = (data ?? []).filter((a) => !dismissed.includes(keyOf(a)));
    if (!alerts.length) return null;

    const dismiss = (a: CallAlert) => {
        const next = [...dismissed, keyOf(a)];
        setDismissed(next);
        try {
            sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
        } catch {
            // storage blocked: only hidden until the next page load
        }
    };

    // Two or more visits: one summary bar that opens today's list (Join / Rejoin stay on each card).
    if (alerts.length > 1) {
        const anyWaiting = alerts.some((a) => a.consultation_type === "video" && a.doctor_in_call);
        const names = Array.from(new Set(alerts.map((a) => (a.is_own ? "you" : a.patient_name))));
        const dismissAll = () => {
            const next = [...dismissed, ...alerts.map(keyOf)];
            setDismissed(next);
            try {
                sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
            } catch {
                // storage blocked: hidden until the next page load
            }
        };
        return (
            <div role="region" aria-label="Appointment alerts"
                className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm text-white sm:px-5 ${anyWaiting ? "bg-amber-500" : "bg-primary"}`}>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                    <Video className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                        {alerts.length} appointments today for {names.join(", ")}
                        {anyWaiting ? " — a doctor is waiting in a video call." : " are starting soon or in progress."}
                    </span>
                </span>
                <button type="button" onClick={() => router.push("/appointments?tab=today")}
                    className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-white/90">
                    View today&apos;s appointments
                </button>
                <button type="button" onClick={dismissAll} aria-label="Dismiss alerts"
                    className="shrink-0 rounded-md p-1 text-white/80 hover:bg-white/15 hover:text-white">
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-px" role="region" aria-label="Appointment alerts">
            {alerts.map((a) => {
                // e.g. "Your" / "tt (Father)'s"; the doctor name already carries "Dr." (never added twice).
                const who = a.is_own ? "Your" : `${a.patient_name}${a.relationship ? ` (${a.relationship})` : ""}'s`;
                const forWhom = a.is_own ? "you" : a.patient_name;
                const video = a.consultation_type === "video";
                let text: string;
                if (!video) {
                    text = `${who} in-person appointment with ${a.doctor_name} ${a.minutes_to_start > 0 ? `starts in ${a.minutes_to_start} min` : "is now"}.`;
                } else if (a.completed && a.doctor_in_call) {
                    text = `${a.doctor_name} rejoined the completed consultation and is waiting for ${forWhom}.`;
                } else if (a.doctor_in_call) {
                    text = `${a.doctor_name} is in the video call and waiting for ${forWhom}.`;
                } else if (a.minutes_to_start > 0) {
                    text = `${who} video call with ${a.doctor_name} starts in ${a.minutes_to_start} min.`;
                } else if (a.is_rejoin) {
                    text = `${who} video call with ${a.doctor_name} is still open. You can rejoin and wait for the doctor.`;
                } else {
                    text = `${who} video call with ${a.doctor_name} has started.`;
                }
                const urgent = video && a.doctor_in_call;

                return (
                    <div key={a.appointment_id}
                        className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm sm:px-5 ${urgent ? "bg-amber-500 text-white" : "bg-primary text-white"}`}>
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                            {video ? <Video className="h-4 w-4 shrink-0" /> : <Hospital className="h-4 w-4 shrink-0" />}
                            <span className="min-w-0">{text}</span>
                        </span>
                        {video && a.can_join && a.join_url && (
                            <button type="button"
                                onClick={() => window.open(`/start-consultation?room_url=${encodeURIComponent(a.join_url!)}&appointment_id=${a.appointment_id}`, "_blank")}
                                className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-white/90">
                                {a.is_rejoin ? "Rejoin call" : "Join call"}
                            </button>
                        )}
                        <button type="button" onClick={() => dismiss(a)} aria-label="Dismiss alert"
                            className="shrink-0 rounded-md p-1 text-white/80 hover:bg-white/15 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
