import { useAuth } from "@/contexts/AuthContext";
import { Image, ImageProps } from "expo-image";

export const Thumbnail = ({
  id,
  ...rest
}: { id: string } & Omit<ImageProps, "source">) => {
  const { directus, token } = useAuth();

  return (
    <Image
      source={{
        uri: `${directus?.url}assets/${id}?width=20&height=20&fit=cover&format=png`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }}
      style={{ width: 20, height: 20 }}
      {...rest}
    />
  );
};
