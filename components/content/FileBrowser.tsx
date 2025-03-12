import { DirectusFile, readFiles } from "@directus/sdk";
import { useEffect, useState } from "react";
import { Grid } from "../display/grid";
import { Pressable, View, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { RadioButton } from "../interfaces/radio-button";
import { PortalOutlet } from "../layout/Portal";
import { Button } from "../display/button";
import { Check, Trash, X } from "../icons";
import { Image } from "expo-image";
import { useFiles } from "@/state/queries/directus/core";
import { formatFileSize } from "@/helpers/formatFileSize";
import { Link, router } from "expo-router";
import { useDocumentsFilters } from "@/hooks/useDocumentsFilters";
import { Pagination } from "./filters/pagination";
import { removeFiles } from "@/state/actions/deleteFiles";
import { SearchFilter } from "./filters/search-filter-modal";

export const FileBrowser = () => {
  const [selectedFiles, setSelectedFiles] = useState<DirectusFile[]>([]);
  const { directus, token } = useAuth();
  const { styles } = useStyles(stylesheet);

  const { mutate, isPending } = removeFiles();

  const filterContext = useDocumentsFilters();
  const { page, limit, search, setSearch } = filterContext;

  const { data: files } = useFiles({
    page,
    limit,
    search,
  });

  const handleSelect = (file: DirectusFile) => {
    const isSelected = selectedFiles.some((f) => f.id === file.id);
    const newSelection = isSelected
      ? selectedFiles.filter((f) => f.id !== file.id)
      : [...selectedFiles, file];
    setSelectedFiles(newSelection);
  };

  const isSelected = (file: DirectusFile) =>
    selectedFiles.some((f) => f.id === file.id);

  return (
    <>
      <Grid cols={{ xs: 3, sm: 4, md: 5, lg: 6 }} spacing="lg">
        {files?.items?.map((file) => {
          const selected = isSelected(file);
          return (
            <Pressable
              key={file.filename_disk}
              onPress={() => router.push(`/files/${file.id}`)}
            >
              <View style={styles.fileContainer}>
                <View style={styles.imageWrapper}>
                  <Image
                    style={[styles.image, selected && styles.selected]}
                    source={{
                      uri: `${directus?.url.origin}/assets/${file.id}`,
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }}
                  />
                  <Pressable
                    onPress={() => handleSelect(file)}
                    style={styles.radioWrapper}
                  >
                    <RadioButton
                      checked={selected}
                      onPress={() => handleSelect(file)}
                    />
                  </Pressable>
                </View>
                <View style={styles.metadata}>
                  <Text style={styles.filename} numberOfLines={1}>
                    {file.title || file.filename_disk || file.filename_download}
                  </Text>
                  <Text style={styles.fileInfo}>
                    {!!file.filesize && formatFileSize(Number(file.filesize))} •{" "}
                    {file.type}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </Grid>

      <View style={{ height: 80 }} />

      <PortalOutlet name="floating-toolbar" path="/files">
        <Pagination {...filterContext} total={files?.total || 0} />
        <SearchFilter {...filterContext} />
        {selectedFiles.length > 0 && (
          <>
            <Button
              rounded
              variant="soft"
              colorScheme="error"
              floating
              loading={isPending}
              onPress={() =>
                mutate(
                  selectedFiles.map((f) => f.id),
                  {
                    onSuccess: () => {
                      setSelectedFiles([]);
                    },
                  }
                )
              }
            >
              <Trash />
            </Button>
            <Button
              variant="soft"
              floating
              rounded
              onPress={() => setSelectedFiles([])}
            >
              <X />
            </Button>
          </>
        )}
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
    top: theme.spacing.xs,
    left: theme.spacing.xs,
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
