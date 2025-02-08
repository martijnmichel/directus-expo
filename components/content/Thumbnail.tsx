import { useAuth } from "@/contexts/AuthContext";
import { Image, ImageProps } from "expo-image";

export const Thumbnail = ({
  id,
  ...rest
}: { id: string } & Omit<ImageProps, "source">) => {
  const { directus } = useAuth();

  return (
    <Image
      source={{ uri: `${directus?.url}/assets/${id}` }}
      style={{ width: 20, height: 20 }}
      {...rest}
    />
  );
};
