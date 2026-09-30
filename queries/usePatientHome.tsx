import { getPatientHome } from "@/api/home";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/userContext";

export const PATIENT_HOME_QUERY_KEY = ["patient", "home"] as const;

// Public (guests see the dashboard too). Waits for the saved login so a signed-in patient's token is sent.
export function usePatientHome() {
  const { token, initializing } = useAuth();

  return useQuery({
    queryKey: [...PATIENT_HOME_QUERY_KEY, token ? "auth" : "guest"],
    queryFn: getPatientHome,
    enabled: !initializing,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
