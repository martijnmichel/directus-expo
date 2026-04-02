import { DirectusFile, readFiles } from "@directus/sdk";
import { useMemo, useState } from "react";
import { Grid } from "../display/grid";
import { Pressable, View, Text, Platform } from "react-native";
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
import { InterfaceProps } from ".";
import { Stack } from "expo-router";
import { Horizontal } from "../layout/Stack";

type FileSelectProps = InterfaceProps<{
  onSelect?: (files: string | string[]) => void;
  multiple?: boolean;
  mimeTypes?: string[];
  extensions?: string[];
}>;

export const FileSelect = ({
  onSelect,
  multiple = false,
  mimeTypes = ["*/*"],
  extensions,
}: FileSelectProps) => {
  const [selectedFiles, setSelectedFiles] = useState<DirectusFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DirectusFile | null>(null);
  const { directus, token } = useAuth();
  const { styles } = useStyles(stylesheet);

  const filterContext = useDocumentsFilters();
  const { page, limit, search, setSearch } = filterContext;

  const { data: files } = useFiles({
    page,
    limit,
    search,
  });

  const acceptedExtensions = useMemo(
    () =>
      (extensions ?? [])
        .map((ext) => String(ext).trim().replace(/^\./, "").toLowerCase())
        .filter(Boolean),
    [extensions],
  );

  const filteredFiles = useMemo(() => {
    const acceptedMimePatterns = (mimeTypes ?? [])
      .map((m) => String(m).trim().toLowerCase())
      .filter(Boolean);
    return (files?.items ?? []).filter((file) => {
      const mime = String(file.type ?? "").toLowerCase();
      if (acceptedMimePatterns.length > 0) {
        const matchesMime = acceptedMimePatterns.some((pattern) => {
          if (pattern === "*" || pattern === "*/*") return true;
          if (pattern.endsWith("/*")) {
            const prefix = pattern.slice(0, -1); // keep trailing '/'
            return mime.startsWith(prefix);
          }
          return mime === pattern;
        });
        if (!matchesMime) return false;
      }
      if (acceptedExtensions.length === 0) return true;
      const filename = String(
        file.filename_download ?? file.filename_disk ?? "",
      ).toLowerCase();
      const ext = filename.includes(".")
        ? (filename.split(".").pop() ?? "")
        : "";
      return acceptedExtensions.includes(ext);
    });
  }, [files?.items, mimeTypes, acceptedExtensions]);

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
      {Platform.OS === "web" && (
        <Horizontal style={{ justifyContent: "flex-end", paddingBottom: 10, paddingTop: 10 }}>
          <Button
            rounded
            size="sm"
            disabled={multiple ? selectedFiles.length === 0 : !selectedFile}
            onPress={handleSubmit}
          >
            <Check />
          </Button>
        </Horizontal>
      )}
      <Grid cols={{ xs: 3, sm: 4, md: 5, lg: 6 }} spacing="md">
        {filteredFiles.map((file) => {
          const selected = isSelected(file);
          const isImage = String(file.type ?? "")
            .toLowerCase()
            .startsWith("image/");
          return (
            <Pressable
              onPress={() => handleSelect(file)}
              key={file.filename_disk}
              style={styles.fileContainer}
            >
              <View style={styles.imageWrapper}>
                {isImage ? (
                  <Image
                    style={[styles.image, selected && styles.selected]}
                    source={{
                      uri: `${directus?.url.origin}/assets/${file.id}`,
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }}
                  />
                ) : (
                  <View
                    style={[styles.filePreview, selected && styles.selected]}
                  >
                    <Text style={styles.filePreviewText}>
                      {(String(file.type ?? "file").split("/")[1] || "FILE")
                        .slice(0, 4)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
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

      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              rounded
              size="sm"
              disabled={multiple ? selectedFiles.length === 0 : !selectedFile}
              onPress={handleSubmit}
            >
              <Check />
            </Button>
          ),
        }}
      />

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
  filePreview: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  filePreviewText: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    fontWeight: "600",
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
