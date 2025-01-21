import {
  CoreSchema,
  createPolicy,
  createRole,
  DirectusPolicy,
  importFile,
  uploadFiles,
} from "@directus/sdk";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { ImagePickerResult } from "expo-image-picker";
import { Platform } from "react-native";
import { queryClient } from "@/utils/react-query";

export const addUploadFiles = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: async (result: ImagePickerResult) => {
      if (!result.canceled && result.assets[0]) {
        const data = new FormData();

        if (Platform.OS === "web") {
          // For web: Convert base64 to blob and create a File object
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          const file = new File(
            [blob],
            result.assets[0].uri.split("/").pop() || "image.jpg",
            { type: result.assets[0].mimeType || "image/jpeg" }
          );
          data.append("file", file);
        } else {
          // For native: Use the React Native structure
          data.append("file", {
            uri: result.assets[0].uri,
            type: result.assets[0].mimeType || "image/jpeg",
            name: result.assets[0].uri.split("/").pop() || "image.jpg",
          } as any);
        }

        const file = await directus?.request(uploadFiles(data));
        return file;
      } else return null;
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
};

export const addImportFiles = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: async (url: string) => {
      const file = await directus?.request(importFile(url));
      return file;
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
};
