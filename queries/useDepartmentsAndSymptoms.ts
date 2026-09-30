import { useQuery } from "@tanstack/react-query";
import { getDepartmentsAndSymptoms } from "@/api/departments";
import { useAuth } from "@/context/userContext";

export const departmentKeys = {
  all: ["departments-and-symptoms"] as const,
};

export const useDepartmentsAndSymptoms = () => {
  const { initializing } = useAuth();

  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: getDepartmentsAndSymptoms,
    enabled: !initializing,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};