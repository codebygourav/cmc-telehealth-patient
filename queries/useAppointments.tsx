import { fetchAppointments } from "@/api/appointments";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export const useAppointments = (
    filter: "upcoming" | "past",
    page: number = 1
) => {
    return useQuery({
        queryKey: ["appointments", filter, page],
        queryFn: () => fetchAppointments(filter, page),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
};
