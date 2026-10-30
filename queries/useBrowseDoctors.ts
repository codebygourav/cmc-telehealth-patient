import { useQuery } from "@tanstack/react-query";
import { getBrowseDoctors } from "@/api/browseDoctors";
import type { BrowseDoctorsResponse } from "@/types/browse-doctors";
import { useAuth } from "@/context/userContext";

export const browseDoctorsKeys = {
  all: ["browse-doctors"] as const,
};

// Public: guests and logged-in patients can browse doctors. The server-rendered list (guest
// prices) is shown at once as a placeholder; the browser then loads the list for whoever is
// looking, so a logged-in patient always ends up with their own prices.
export const useBrowseDoctors = (initialData?: BrowseDoctorsResponse, enabled: boolean = true) => {
  const { token, initializing } = useAuth();
  const countryParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("country_iso") ||
        new URLSearchParams(window.location.search).get("country") ||
        localStorage.getItem("test_country_iso")
      : null;

  return useQuery<BrowseDoctorsResponse>({
    // Fees depend on who is looking (guest: both prices; patient: their own), so the list is
    // kept separately for guests and logged-in patients, and re-fetched when country changes.
    queryKey: [...browseDoctorsKeys.all, token ? "auth" : "guest", countryParam || "auto"],
    queryFn: getBrowseDoctors,
    // Wait until the saved login is restored, so the first request already carries the token.
    enabled: enabled && !initializing,
    placeholderData: (previous) => previous ?? initialData,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
