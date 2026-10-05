import { useQuery } from "@tanstack/react-query";
import { getBrowseDoctors } from "@/api/browseDoctors";
import { useAuth } from "@/context/userContext";

export const browseDoctorsKeys = {
  all: ["browse-doctors"] as const,
};

// Public: guests can browse doctors.
export const useBrowseDoctors = () => {
  const { token, initializing } = useAuth();

  return useQuery({
    queryKey: [...browseDoctorsKeys.all, token ? "auth" : "guest"],
    queryFn: getBrowseDoctors,
    enabled: !initializing,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};