// useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications, fetchUnreadCount } from "@/api/notifications";
import { useAuth } from "@/context/userContext";

export const useNotifications = (page: number = 1) => {
    return useQuery({
        queryKey: ["notifications", page],
        queryFn: () => fetchNotifications(page),
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
};

export const useUnreadCount = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ["unread-count"],
        queryFn: fetchUnreadCount,
        // Guests have no notifications.
        enabled: !!token,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
};
