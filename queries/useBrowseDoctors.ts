import { useQuery } from "@tanstack/react-query";
import { getBrowseDoctors } from "@/api/browseDoctors";

export const browseDoctorsKeys = {
  all: ["browse-doctors"] as const,
};

// Public: guests and authenticated users can browse doctors instantly.
export const useBrowseDoctors = () => {
  return useQuery({
    queryKey: browseDoctorsKeys.all,
    queryFn: getBrowseDoctors,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};