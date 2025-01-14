import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useLocalStorage = (key: string) => {
  return useQuery({
    queryKey: ["local-storage", key],
    queryFn: async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error("Error reading theme from storage:", error);
        return null;
      }
    },
  });
};

export const mutateLocalStorage = (key: string) => {
  return useMutation({
    mutationFn: (value: any) =>
      AsyncStorage.setItem(key, JSON.stringify(value)),
  });
};
