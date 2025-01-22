import React, { ReactNode, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
  TextInput,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import * as ImagePicker from "expo-image-picker";
import { formStyles } from "./style";
import { Horizontal, Vertical } from "../layout/Stack";
import { Button } from "../display/button";
import { Input } from "./input";
import {
  Download,
  Search,
  Edit,
  X,
  Link,
  Gallery,
  Check,
  Upload,
} from "../icons";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "../display/modal";
import { Image } from "expo-image";
import { FileSelect } from "./file-select";
import { addImportFiles, addUploadFiles } from "@/state/actions/addFile";
import Animated, { SlideInDown, SlideInUp } from "react-native-reanimated";
import { useFile } from "@/state/queries/directus/core";
import { isImageType } from "@/helpers/document/isImageType";
import { DirectusFile } from "@directus/sdk";
import { DirectusIcon } from "../display/directus-icon";

interface ImageInputProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  prepend?: ReactNode;
  append?: ReactNode;
  disabled?: boolean;
  sources?: ("device" | "url" | "library")[];
}

export const FileInput = ({
  label,
  error,
  helper,
  value,
  prepend,
  append,
  onChange,
  disabled,
  sources = ["device", "url", "library"],
}: ImageInputProps) => {
  const { styles, theme } = useStyles(formStyles);
  const { styles: dropdownStyles } = useStyles(stylesheet);
  const [imageUrl, setImageUrl] = useState("");
  const { directus } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { mutateAsync: upload, isPending: isUploading } = addUploadFiles();
  const { mutateAsync: importFile, isPending: isImporting } = addImportFiles();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      const file = await upload(result);
      if (file) {
        onChange?.(file.id);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleUrlSubmit = async () => {
    try {
      const file = await importFile(imageUrl);
      if (file) {
        onChange?.(file.id);
      }
      setImageUrl("");
    } catch (error) {
      console.error("Error importing image from URL:", error);
    }
  };

  // Default to error color if there's an error, otherwise use the theme's text color
  const defaultIconColor = error
    ? theme.colors.error
    : theme.colors.textSecondary;

  const finalIconColor = defaultIconColor;

  const clonedPrepend = prepend
    ? React.cloneElement(prepend as React.ReactElement, {
        color: finalIconColor,
        size: 20,
      })
    : null;

  const clonedAppend = append
    ? React.cloneElement(append as React.ReactElement, {
        color: finalIconColor,
        size: 20,
      })
    : null;

  const File = ({ id }: { id: string }) => {
    const { data } = useFile(id);
    const { directus } = useAuth();
    const file = data as unknown as DirectusFile;
    if (!file) return null;
    else if (isImageType(file?.type ?? "")) {
      return (
        <Horizontal style={{ alignItems: "center", width: "100%" }}>
          <Image
            source={{ uri: `${directus?.url.origin}/assets/${file.id}` }}
            style={{ width: 28, height: 28, borderRadius: 4 }}
          />
          <Text style={{ flexShrink: 1 }} numberOfLines={1}>
            {file?.title || file.filename_disk}
          </Text>
        </Horizontal>
      );
    } else
      return (
        <Horizontal style={{ alignItems: "center", width: "100%" }}>
          <Text numberOfLines={1}>{file?.title || file.filename_disk}</Text>
        </Horizontal>
      );
  };

  return (
    <View style={[styles.formControl, { position: "relative", zIndex: 1 }]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {prepend && <View style={styles.prepend}>{clonedPrepend}</View>}
        <Pressable
          style={[
            styles.input,
            { display: "flex", flexDirection: "row", alignItems: "center" },
          ]}
          onBlur={() => setTimeout(() => setIsOpen(false), 100)}
          onFocus={() => setIsOpen(true)}
        >
          {value ? (
            <File id={value} />
          ) : (
            <Horizontal>
              <DirectusIcon name="attach_file" />
              <Text>Select a file</Text>
            </Horizontal>
          )}
        </Pressable>

        {value && (
          <Button variant="ghost" rounded onPress={() => onChange?.(null)}>
            <X />
          </Button>
        )}
        {append && <View style={styles.append}>{clonedAppend}</View>}
      </View>

      {!disabled && isOpen && (
        <>
          <View style={dropdownStyles.dropdownContainer}>
            <Vertical spacing="md">
              {sources.includes("device") && (
                <Text style={dropdownStyles.dropdownItem} onPress={pickImage}>
                  <Upload /> Upload from device
                </Text>
              )}
              {sources.includes("url") && (
                <Text
                  style={dropdownStyles.dropdownItem}
                  onPress={() => setImportOpen(true)}
                >
                  <Link /> Import from URL
                </Text>
              )}
              {sources.includes("library") && (
                <Text
                  style={dropdownStyles.dropdownItem}
                  onPress={() => setLibraryOpen(true)}
                >
                  <Gallery /> Select from library
                </Text>
              )}
            </Vertical>
          </View>
        </>
      )}

      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}

      {sources.includes("url") && (
        <Modal open={importOpen} onClose={() => setImportOpen(false)}>
          <Modal.Content title="Import from URL">
            {({ close }) => (
              <Vertical>
                <Input
                  placeholder="Enter URL"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  style={{ flex: 1 }}
                />
                <Button
                  disabled={!imageUrl}
                  onPress={() => {
                    close();
                    handleUrlSubmit();
                  }}
                >
                  Upload
                </Button>
              </Vertical>
            )}
          </Modal.Content>
        </Modal>
      )}
      {sources.includes("library") && (
        <Modal open={libraryOpen} onClose={() => setLibraryOpen(false)}>
          <Modal.Content variant="bottomSheet" title="Import from URL">
            {({ close }) => (
              <ScrollView>
                <FileSelect
                  onSelect={(v) => {
                    onChange?.(v as string);
                    close();
                  }}
                />
              </ScrollView>
            )}
          </Modal.Content>
        </Modal>
      )}
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  dropdownContainer: {
    padding: theme.spacing.sm,
    position: "absolute",
    zIndex: 1000,
    left: 0,
    right: 0,
    top: "100%",
    backgroundColor: theme.colors.backgroundAlt,
    display: "flex",
    flexDirection: "row",
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.textSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownItem: {
    padding: theme.spacing.xs,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
}));
