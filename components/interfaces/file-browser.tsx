import { DirectusFile, readFiles } from "@directus/sdk";
import { useEffect, useState } from "react";
import { Grid } from "../display/grid";
import { Pressable, View, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { RadioButton } from "../interfaces/radio-button";
import { PortalOutlet } from "../layout/Portal";
import { Button } from "../display/button";
import { Check } from "../icons";
import { Image } from "expo-image";
interface FileBrowserProps {
  onSelect?: (files: string | string[]) => void;
  multiple?: boolean;
}

export const FileBrowser = ({
  onSelect,
  multiple = false,
}: FileBrowserProps) => {
  const [selectedFiles, setSelectedFiles] = useState<DirectusFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DirectusFile | null>(null);
  const [files, setFiles] = useState<DirectusFile[]>([]);
  const { directus, user } = useAuth();
  const { styles } = useStyles(stylesheet);

  useEffect(() => {
    const getFiles = async () => {
      if (!directus || !user?.role) return;
      const files = await directus.request(
        readFiles({
          limit: 1000,
        })
      );
      setFiles(files as DirectusFile[]);
    };

    getFiles();
  }, []);

  const handleSelect = (file: DirectusFile) => {
    if (multiple) {
      const isSelected = selectedFiles.some((f) => f.id === file.id);
      const newSelection = isSelected
        ? selectedFiles.filter((f) => f.id !== file.id)
        : [...selectedFiles, file];
      setSelectedFiles(newSelection);
    } else {
      const newSelection = selectedFile?.id === file.id ? null : file;
      setSelectedFile(newSelection);
    }
  };

  const isSelected = (file: DirectusFile) =>
    multiple
      ? selectedFiles.some((f) => f.id === file.id)
      : selectedFile?.id === file.id;

  return (
    <>
      <Grid cols={{ xs: 2, sm: 3, md: 4, lg: 5 }} spacing="lg">
        {files.map((file) => {
          const selected = isSelected(file);
          return (
            <Pressable
              onPress={() => handleSelect(file)}
              key={file.filename_disk}
              style={styles.fileContainer}
            >
              <View style={styles.imageWrapper}>
                <Image
                  style={[styles.image, selected && styles.selected]}
                  source={{ uri: `${directus?.url.origin}/assets/${file.id}` }}
                />
                <View style={styles.radioWrapper}>
                  <RadioButton
                    checked={selected}
                    onPress={() => handleSelect(file)}
                  />
                </View>
              </View>
              <View style={styles.metadata}>
                <Text style={styles.filename} numberOfLines={1}>
                  {file.filename_download}
                </Text>
                <Text style={styles.fileInfo}>
                  {!!file.filesize && formatFileSize(Number(file.filesize))} •{" "}
                  {file.type}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Grid>
      <PortalOutlet name="modal-header">
        <Button
          rounded
          disabled={multiple ? selectedFiles.length === 0 : !selectedFile}
          onPress={() => {
            console.log({ selectedFile });
            onSelect &&
              onSelect(
                multiple
                  ? selectedFiles.map((f) => f.id)
                  : selectedFile?.id || ""
              );
          }}
        >
          <Check />
        </Button>
      </PortalOutlet>
    </>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const stylesheet = createStyleSheet((theme) => ({
  fileContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "4/4",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: theme.borderRadius.md,
  },
  selected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  radioWrapper: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: theme.borderRadius.full,
    padding: 2,
  },
  metadata: {
    paddingVertical: theme.spacing.sm,
  },
  filename: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "500",
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: theme.typography.helper.fontSize,
    fontFamily: theme.typography.helper.fontFamily,
    color: theme.colors.textTertiary,
  },
}));
