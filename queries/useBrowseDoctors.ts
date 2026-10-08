import { useQuery } from "@tanstack/react-query";
import { getBrowseDoctors } from "@/api/browseDoctors";
import type { BrowseDoctorsResponse } from "@/types/browse-doctors";

export const browseDoctorsKeys = {
  all: ["browse-doctors"] as const,
};

// Public: guests and authenticated users can browse doctors instantly. initialData (from the
// server-rendered page) is shown at once and refreshed in the background.
export const useBrowseDoctors = (initialData?: BrowseDoctorsResponse) => {
  return useQuery({
    queryKey: browseDoctorsKeys.all,
    queryFn: getBrowseDoctors,
    initialData,
    // Treat server data as stale so it is refreshed right away (a logged-in user may see more).
    initialDataUpdatedAt: initialData ? 0 : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
