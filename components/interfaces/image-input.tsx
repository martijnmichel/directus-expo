import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
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
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import EventBus from "@/utils/mitt";
import { FloatingToolbarHost } from "../display/floating-toolbar";

interface ImageInputProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  sources?: ("device" | "url" | "library")[];
}

export const ImageInput = ({
  label,
  error,
  helper,
  value,
  onChange,
  disabled,
  sources = ["device", "url", "library"],
}: ImageInputProps) => {
  const { styles, theme } = useStyles(imageStyles);
  const { styles: formStyle } = useStyles(formStyles);
  const [imageUrl, setImageUrl] = useState("");
  const { directus } = useAuth();

  const { mutateAsync: upload, isPending: isUploading } = addUploadFiles();
  const { mutateAsync: importFile, isPending: isImporting } = addImportFiles();

  const { t } = useTranslation();

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

  useEffect(() => {
    EventBus.on("file:pick", (file) => {
      onChange?.(file.data);
    });

    return () => {
      EventBus.off("file:pick", (file) => {
        onChange?.(file.data);
      });
    };
  }, []);
  return (
    <View style={formStyle.formControl}>
      {label && <Text style={formStyle.label}>{label}</Text>}

      <View style={styles.container}>
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: `${directus?.url}/assets/${value}` }}
            style={styles.image}
          />
        </View>

        {!disabled && (
          <Vertical spacing="md" style={styles.uploadContainer}>
            {isUploading || isImporting ? (
              <ActivityIndicator />
            ) : (
              <Horizontal spacing="md">
                {sources.includes("device") && (
                  <Button variant="soft" rounded onPress={pickImage}>
                    <Upload />
                  </Button>
                )}

                {sources.includes("url") && (
                  <Modal>
                    <Modal.Trigger>
                      <Button rounded variant="soft">
                        <Link />
                      </Button>
                    </Modal.Trigger>
                    <Modal.Content title={t("components.shared.importFromUrl")}>
                      {({ close }) => (
                        <Vertical>
                          <Input
                            placeholder={t("form.enterUrl")}
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
                  /**
                  * 
                  * TO BE DONE AND TESTED
                  * 
                  *  <Button
                    rounded
                    variant="soft"
                    onPress={() =>
                      router.push({
                        pathname: "/modals/files/pick",
                        params: { data: objectToBase64({ multiple: false }) },
                      })
                    }
                  >
                    <Gallery />
                  </Button>
                  */

                  <Modal>
                    <Modal.Trigger>
                      <Button rounded variant="soft">
                        <Gallery />
                      </Button>
                    </Modal.Trigger>
                    <Modal.Content
                      variant="bottomSheet"
                      title={t("components.shared.selectFromLibrary")}
                    >
                      {({ close }) => (
                        <>
                          <ScrollView>
                            <FileSelect
                              onSelect={(v) => {
                                close();
                                requestAnimationFrame(() => {
                                  onChange?.(v);
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

                {value && (
                  <Button variant="soft" rounded onPress={() => onChange?.("")}>
                    <X />
                  </Button>
                )}
              </Horizontal>
            )}
          </Vertical>
        )}
      </View>

      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const imageStyles = createStyleSheet((theme) => ({
  container: {
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
    position: "relative",
  },
  uploadContainer: {
    padding: theme.spacing.xl,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "transparent",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreview: {
    position: "relative",
    aspectRatio: 16 / 5,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  overlayVisible: {
    opacity: 1,
  },
  orText: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },
  urlInput: {
    width: "100%",
  },
}));
