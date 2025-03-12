import React, { ReactNode, useState } from "react";
import {
  View,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
  TextInput,
  TouchableWithoutFeedback,
  LayoutRectangle,
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
import { Text } from "../display/typography";
import { PortalOutlet } from "../layout/Portal";
import OutsidePressHandler from "react-native-outside-press";
import { useTranslation } from "react-i18next";
import { FloatingToolbarHost } from "../display/floating-toolbar";
import { InterfaceProps } from ".";

type FileInputProps = InterfaceProps<{
  value?: string | null;
  onChange?: (value: string | null) => void;
  sources?: ("device" | "url" | "library")[];
}>;

export const FileInput = ({
  label,
  error,
  helper,
  value,
  prepend,
  append,
  onChange,
  disabled,
  required,
  sources = ["device", "url", "library"],
}: FileInputProps) => {
  const { styles, theme } = useStyles(formStyles);
  const { styles: dropdownStyles } = useStyles(stylesheet);
  const [imageUrl, setImageUrl] = useState("");
  const { directus } = useAuth();

  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { mutateAsync: upload, isPending: isUploading } = addUploadFiles();
  const { mutateAsync: importFile, isPending: isImporting } = addImportFiles();
  const [inputLayout, setInputLayout] = useState<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

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
    const { directus, token } = useAuth();
    const file = data as unknown as DirectusFile;
    if (!file) return null;
    else if (isImageType(file?.type ?? "")) {
      return (
        <Horizontal style={{ alignItems: "center", width: "100%" }}>
          <Image
            source={{
              uri: `${directus?.url.origin}/assets/${file.id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }}
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
      {label && (
        <Text style={styles.label}>
          {label} {required && "*"}
        </Text>
      )}
      <OutsidePressHandler onOutsidePress={() => setIsOpen(false)}>
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
            onPress={() => setIsOpen(!isOpen)}
          >
            {value ? (
              <File id={value} />
            ) : (
              <Horizontal>
                <DirectusIcon
                  name="attach_file"
                  color={theme.colors.textSecondary}
                />
                <Text>{t("components.fileInput.selectFile")}</Text>
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
            <View
              style={[
                dropdownStyles.dropdownContainer,
                {
                  zIndex: 1000,
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                },
              ]}
            >
              <Vertical spacing="md">
                {sources.includes("device") && (
                  <Pressable
                    style={dropdownStyles.dropdownItem}
                    onPress={() => {
                      pickImage();
                      setIsOpen(false);
                    }}
                  >
                    <Upload color={theme.colors.textSecondary} />
                    <Text>{t("components.shared.uploadFromDevice")}</Text>
                  </Pressable>
                )}
                {sources.includes("url") && (
                  <Pressable
                    style={dropdownStyles.dropdownItem}
                    onPress={() => {
                      setImportOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    <Link color={theme.colors.textSecondary} />
                    <Text>{t("components.shared.importFromUrl")}</Text>
                  </Pressable>
                )}
                {sources.includes("library") && (
                  <Pressable
                    style={dropdownStyles.dropdownItem}
                    onPress={() => {
                      setLibraryOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    <Gallery color={theme.colors.textSecondary} />
                    <Text>{t("components.shared.selectFromLibrary")}</Text>
                  </Pressable>
                )}
              </Vertical>
            </View>
          </>
        )}
      </OutsidePressHandler>

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
              <>
                <ScrollView>
                  <FileSelect
                    onSelect={(v) => {
                      close();
                      requestAnimationFrame(() => {
                        onChange?.(v as string);
                      });
                    }}
                  />
                  <View style={{ height: 80 }} />
                </ScrollView>
                <FloatingToolbarHost />
              </>
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
