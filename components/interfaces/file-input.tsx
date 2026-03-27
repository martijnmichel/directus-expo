import React, { ReactNode, useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Horizontal, Vertical } from "../layout/Stack";
import { Button } from "../display/button";
import { Input } from "./input";
import {
  X,
  Link,
  Gallery,
  Upload,
} from "../icons";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "../display/modal";
import { Image } from "expo-image";
import { FileSelect } from "./file-select";
import { addImportFiles, addUploadFiles } from "@/state/actions/addFile";
import { useFile } from "@/state/queries/directus/core";
import { isImageType } from "@/helpers/document/isImageType";
import { DirectusFile } from "@directus/sdk";
import { DirectusIcon } from "../display/directus-icon";
import { Text } from "../display/typography";
import OutsidePressHandler from "react-native-outside-press";
import { useTranslation } from "react-i18next";
import { FloatingToolbarHost } from "../display/floating-toolbar";
import { InterfaceProps } from ".";
import * as DocumentPicker from "expo-document-picker";
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
  const { mutateAsync: upload } = addUploadFiles();
  const { mutateAsync: importFile } = addImportFiles();

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = await upload({
          canceled: false,
          assets: [
            {
              uri: result.assets[0].uri,
              mimeType: result.assets[0].mimeType ?? "application/octet-stream",
              fileName: result.assets[0].name,
            },
          ],
        } as any);
        if (file?.id) {
          onChange?.(String(file.id));
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleUrlSubmit = async () => {
    try {
      const file = await importFile(imageUrl);
      if (file) {
        onChange?.(String(file.id));
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
    ? React.cloneElement(prepend as React.ReactElement<any>, {
        color: finalIconColor,
        size: 20,
      })
    : null;

  const clonedAppend = append
    ? React.cloneElement(append as React.ReactElement<any>, {
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
            {!!value ? (
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

          {!!value && (
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
                      pickFile();
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
          <Modal.Content variant="bottomSheet" title="Select from library">
            {({ close }) => (
              <>
                <ScrollView>
                  <FileSelect
                    type={["images", "files"]}
                    onSelect={(v) => {
                      const selected = Array.isArray(v) ? v[0] : v;
                      if (!selected) return;
                      close();
                      requestAnimationFrame(() => {
                        onChange?.(String(selected));
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
