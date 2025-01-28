import { DirectusFile, readFiles } from "@directus/sdk";
import { useEffect, useState } from "react";
import { Grid } from "../display/grid";
import { Pressable, View, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { RadioButton } from "./radio-button";
import { PortalOutlet } from "../layout/Portal";
import { Button } from "../display/button";
import { Check } from "../icons";
import { Image } from "expo-image";
import { useFiles } from "@/state/queries/directus/core";
import { formatFileSize } from "@/helpers/formatFileSize";
import { useDocumentsFilters } from "@/hooks/useDocumentsFilters";
import { Pagination } from "../content/filters/pagination";
import { SearchFilter } from "../content/filters/search-filter-modal";

interface FileSelectProps {
  onSelect?: (files: string | string[]) => void;
  multiple?: boolean;
  extensions?: string[];
}

export const FileSelect = ({ onSelect, multiple = false }: FileSelectProps) => {
  const [selectedFiles, setSelectedFiles] = useState<DirectusFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DirectusFile | null>(null);
  const { directus, user } = useAuth();
  const { styles } = useStyles(stylesheet);

  const filterContext = useDocumentsFilters();
  const { page, limit, search, setSearch } = filterContext;

  const { data: files } = useFiles({
    page,
    limit,
    search,
  });

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

  const handleSubmit = () => {
    if (!onSelect) return;

    if (multiple) {
      onSelect(selectedFiles.map((f) => f.id));
    } else if (selectedFile) {
      onSelect(selectedFile.id);
    }
  };

  return (
    <>
      <Grid cols={{ xs: 3, sm: 4, md: 5, lg: 6 }} spacing="md">
        {files?.items?.map((file) => {
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

      <PortalOutlet name="floating-toolbar">
        <Pagination {...filterContext} total={files?.total || 0} />
        <SearchFilter {...filterContext} />
      </PortalOutlet>

      <PortalOutlet name="modal-header">
        <Button
          rounded
          disabled={multiple ? selectedFiles.length === 0 : !selectedFile}
          onPress={handleSubmit}
        >
          <Check />
        </Button>
      </PortalOutlet>
    </>
  );
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
