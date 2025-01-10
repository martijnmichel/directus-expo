import { DirectusFile, readFiles } from "@directus/sdk";
import { useEffect, useState } from "react";
import { Grid } from "../display/grid";
import { Image, Pressable, View, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { RadioButton } from "../form/radio-button";

interface FileBrowserProps {
  onSelect: (files: string | string[]) => void;
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
      onSelect(newSelection.map((f) => f.id));
    } else {
      const newSelection = selectedFile?.id === file.id ? null : file;
      setSelectedFile(newSelection);
      onSelect(newSelection?.id || "");
    }
  };

  const isSelected = (file: DirectusFile) =>
    multiple
      ? selectedFiles.some((f) => f.id === file.id)
      : selectedFile?.id === file.id;

  return (
    <Grid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
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
                width={500}
                height={500}
                style={[styles.image, selected && styles.selected]}
                source={{ uri: `${directus?.url}/assets/${file.id}` }}
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
                {formatFileSize(file.filesize)} • {file.type}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Grid>
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
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: theme.typography.helper.fontSize,
    color: theme.colors.textTertiary,
  },
}));
