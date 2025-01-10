import { DirectusFile, readFiles, readRole } from "@directus/sdk";
import { useEffect, useState } from "react";
import { Grid } from "../display/grid";
import { Image, Pressable } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export const FileBrowser = ({
  onSelect,
}: {
  onSelect: (file: string) => void;
}) => {
  const [files, setFiles] = useState<DirectusFile[]>([]);
  const { directus, user } = useAuth();
  useEffect(() => {
    const getFiles = async () => {
      if (!directus) return;
      if (!user?.role) return;
      const role = await directus.request(readRole(user.role as string));
      console.log({ user, role });
      const re = await directus.request(
        readFiles({
          limit: 1000,
        })
      );
      console.log(re);
      setFiles(re as DirectusFile[]);
    };

    getFiles();
  }, []);

  return (
    <Grid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md" padding="sm">
      {files.map((file) => {
        return (
          <Pressable
            onPress={() => onSelect(file.filename_disk as string)}
            key={file.filename_disk}
          >
            <Image
              role="button"
              src={`${directus?.url}/assets/${file.filename_disk}`}
            />
          </Pressable>
        );
      })}
    </Grid>
  );
};
