import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
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
import { FileBrowser } from "./file-browser";
import { importFile, uploadFiles } from "@directus/sdk";
import { Image } from "expo-image";

interface ImageInputProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
}

export const ImageInput = ({
  label,
  error,
  helper,
  value,
  onChange,
  disabled,
}: ImageInputProps) => {
  const { styles, theme } = useStyles(imageStyles);
  const { styles: formStyle } = useStyles(formStyles);
  const [imageUrl, setImageUrl] = useState("");
  const { directus } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const data = new FormData();

        if (Platform.OS === "web") {
          // For web: Convert base64 to blob and create a File object
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          const file = new File(
            [blob],
            result.assets[0].uri.split("/").pop() || "image.jpg",
            { type: result.assets[0].mimeType || "image/jpeg" }
          );
          data.append("file", file);
        } else {
          // For native: Use the React Native structure
          data.append("file", {
            uri: result.assets[0].uri,
            type: result.assets[0].mimeType || "image/jpeg",
            name: result.assets[0].uri.split("/").pop() || "image.jpg",
          } as any);
        }

        const file = await directus?.request(uploadFiles(data));
        if (file) {
          onChange(file?.id);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const handleUrlSubmit = async () => {
    try {
      const file = await directus?.request(importFile(imageUrl));
      if (file) {
        onChange(file.id);
      }
      setImageUrl("");
    } catch (error) {
      console.error("Error importing image from URL:", error);
    }
  };
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
            <Horizontal spacing="md">
              <Button variant="soft" rounded onPress={pickImage}>
                <Upload />
              </Button>

              <Modal>
                <Modal.Trigger>
                  <Button rounded variant="soft">
                    <Link />
                  </Button>
                </Modal.Trigger>
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
              <Modal>
                <Modal.Trigger>
                  <Button rounded variant="soft">
                    <Gallery />
                  </Button>
                </Modal.Trigger>
                <Modal.Content variant="bottomSheet" title="Import from URL">
                  {({ close }) => (
                    <FileBrowser
                      onSelect={(v) => {
                        onChange(v);
                        close();
                      }}
                    />
                  )}
                </Modal.Content>
              </Modal>

              {value && (
                <Button variant="soft" rounded onPress={() => onChange?.("")}>
                  <X />
                </Button>
              )}
            </Horizontal>
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
