import { useAuth } from "@/contexts/AuthContext";
import {
  readAssetArrayBuffer,
  readAssetBlob,
  readAssetRaw,
} from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";
import { Image, ImageProps } from "expo-image";

export const DirectusImage = ({
  id,
  ...rest
}: { id: string } & Omit<ImageProps, "source">) => {
  const { directus } = useAuth();

  const { data } = useQuery({
    queryKey: ["directus-image", id],
    queryFn: () => directus?.request(readAssetBlob(id)),
  });

  console.log(data);

  return <Image source={`data:image/jpg;base64,${data?.text()}`} {...rest} />;
};
