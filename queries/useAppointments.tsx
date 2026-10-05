import { fetchAppointments } from "@/api/appointments";
import { useQuery } from "@tanstack/react-query";
import { useActiveProfile } from "@/context/activeProfileContext";

export const useAppointments = (
    filter: "today" | "upcoming" | "past" | "pending_payment",
    page: number = 1
) => {
    // The viewed profile is part of the key, so one profile's list never shows under another.
    const { activeProfile } = useActiveProfile();
    const profileKey = activeProfile?.patient_id ?? "self";

    return useQuery({
        queryKey: ["appointments", profileKey, filter, page],
        queryFn: () => fetchAppointments(filter, page),
        // Keep the old page only while paging the same tab; a new tab shows the loader instead of
        // the previous tab's appointments.
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[1] === profileKey && previousQuery?.queryKey[2] === filter ? previous : undefined,
        staleTime: 60 * 1000,
        retry: 0,
        // Today's list follows the call state (joinable / rejoin after the doctor reopens it).
        refetchInterval: filter === "today" ? 30 * 1000 : false,
        refetchOnWindowFocus: filter === "today",
        refetchOnReconnect: false,
    });
};
