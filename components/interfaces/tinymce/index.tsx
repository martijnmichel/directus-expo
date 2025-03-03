import React, { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import {
  View,
  Pressable,
  TextInput,
  Modal as RNModal,
  SafeAreaView,
  Keyboard,
  ViewProps,
  Text,
  TextInputProps,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  createStyleSheet,
  UnistylesRuntime,
  useStyles,
} from "react-native-unistyles";
import { Modal } from "../../display/modal";
import { Input } from "../input";
import { Button } from "@/components/display/button";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { ImageInput } from "../image-input";
import { useAuth } from "@/contexts/AuthContext";
import { H1 } from "@/components/display/typography";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { Check, X } from "@/components/icons";
import { KeyboardAwareLayout } from "@/components/layout/Layout";

import { formStyles } from "../style";

interface InputProps {
  label?: string;
  error?: string;
  prepend?: ReactNode;
  append?: ReactNode;
  helper?: string;
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
  item: ReadFieldOutput<CoreSchema>;
  onChange?: (value: string) => void;
}

export const TinyMCEEditor = ({
  value = "",
  onChange,
  label,
  error,
  helper,
  style,
  iconColor,
  iconSize,
  prepend,
  append,
  item,
  disabled,
}: InputProps & TextInputProps) => {
  const { styles } = useStyles(editorStyles);
  const { styles: fStyles, theme } = useStyles(formStyles);
  const webViewRef = useRef<WebView>(null);
  const themeName = UnistylesRuntime.themeName;
  const { directus } = useAuth();
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(0);
  const handleContentChange = (newContent: string) => {
    onChange?.(newContent);
  };

  console.log(item);

  const handleImageChange = (image: string) => {
    console.log("image", image);

    Keyboard.dismiss();
    setFilePickerOpen(false);

    webViewRef.current?.injectJavaScript(
      `window.tinymce.activeEditor.insertContent('<img src="${
        directus!.url
      }/assets/${image}" alt="Inserted Image" />')`
    );
  };

  const escapeContent = (str: string) => {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/`/g, "\\`");
  };

  const Editor = useMemo(() => {
    const TINYMCE_HTML = `
<!DOCTYPE html>
<html style="margin: 0; background-color: ${theme.colors.background};">
<head>
  <script src="https://file.martijnvde.nl/js/tinymce/js/tinymce/tinymce.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; background-color: ${theme.colors.background}}
    .mce-content-body { font-family: -apple-system, sans-serif; width: 100%; overlfow-x: hidden }
    img { width: 100%; height: auto; }
    table { width: 100%; }
    td { border: 1px solid #ccc; padding: 8px; }
    .tox-statusbar { display: none; }
    .tox-tinymce { height: 100vh !important; border: none !important; border-radius: 0 !important; }
  </style>
</head>
<body style="height: 100vh; background-color: ${theme.colors.background};">
  <textarea id="${item.field}-${item.collection}"></textarea>
  <script>
    tinymce.init({
      selector: '#${item.field}-${item.collection}',
      menubar: false,
      nowrap: true,
      skin: '${themeName === "dark" ? "oxide-dark" : "oxide"}',
      content_css: '${themeName}',
      content_style: 'img { max-width: 100%; height: auto; }',
      toolbar: '${
        item.meta.options
          ? item.meta.options.toolbar.join(" ")
          : "bold italic underline h1 h2 h3 ol ul removeformat blockquote link image media hr"
      } customFullscreen',
      toolbar_sticky: true,
      toolbar_location: 'bottom',
      statusbar: false,
      add_license_key: 'gpl',
      plugins: ['lists', 'link', 'image', 'table'],
      setup: function(editor) {
        editor.on('change keyup blur', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            name: 'contentChange',
            content: editor.getContent(),
            field: '${item.field}',
            collection: '${item.collection}'
          }));
        });
        editor.on('init', function() {
          const content = '${escapeContent(value)}';
          tinymce.activeEditor.setContent(content);
        });

        /**
         * editor.on('focus', function() {
           window.ReactNativeWebView.postMessage(JSON.stringify({ name: 'openFullscreen', content: tinymce.activeEditor.getContent(), field: '${
             item.field
           }', collection: '${item.collection}' }));
              
        });*/

        editor.ui.registry.addButton('customFullscreen', {
            icon: 'fullscreen',
            onAction: () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ name: 'openFullscreen', content: tinymce.activeEditor.getContent(), field: '${
                item.field
              }', collection: '${item.collection}' }));
             
            }
        });
       

        
        editor.ui.registry.addButton('customImage', {
            icon: 'image',
            onAction: () => window.ReactNativeWebView.postMessage(JSON.stringify({ name: 'openImagePicker', field: '${
              item.field
            }', collection: '${item.collection}' }))
        });
      }
    });
  </script>
</body>
</html>
`;
    return (
      <KeyboardAwareLayout>
        <WebView
          key={editorOpen ? "fullscreen" : "normal"}
          originWhitelist={["*"]}
          ref={webViewRef}
          pullToRefreshEnabled={false}
          source={{ html: TINYMCE_HTML }}
          onMessage={(event) => {
            const data = JSON.parse(event.nativeEvent.data);
            if (
              item.field === data.field &&
              item.collection === data.collection
            ) {
              switch (data.name) {
                case "contentChange":
                  console.log("contentChange", data.content);
                  handleContentChange(data.content);
                  break;

                case "openImagePicker":
                  console.log("openImagePicker");
                  Keyboard.dismiss();
                  setFilePickerOpen(true);
                  break;
                case "openFullscreen":
                  console.log("openFullscreen");
                  setEditorOpen(true);

                  break;
              }
            }
          }}
          style={styles.editor}
        />
      </KeyboardAwareLayout>
    );
  }, [editorOpen]);

  // Default to error color if there's an error, otherwise use the theme's text color
  const defaultIconColor = error
    ? theme.colors.error
    : theme.colors.textSecondary;

  const finalIconColor = iconColor || defaultIconColor;

  const clonedPrepend = prepend
    ? React.cloneElement(prepend as React.ReactElement, {
        color: finalIconColor,
        size: iconSize,
      })
    : null;

  const clonedAppend = append
    ? React.cloneElement(append as React.ReactElement, {
        color: finalIconColor,
        size: iconSize,
      })
    : null;

  const ImageModal = (
    <Modal
      open={filePickerOpen}
      onClose={() => {
        setFilePickerOpen(false);
      }}
    >
      <Modal.Content>
        <ImageInput
          onChange={(image) => {
            console.log("close file picker");
            handleImageChange(image as string);
          }}
        />
      </Modal.Content>
    </Modal>
  );

  return (
    <Vertical spacing={theme.spacing.xs}>
      {label && <Text style={fStyles.label}>{label}</Text>}

      <View style={[styles.preview, disabled && styles.previewDisabled]}>
        {Editor}
      </View>
      {(error || helper) && (
        <Text style={[fStyles.helperText, error && fStyles.errorText]}>
          {error || helper}
        </Text>
      )}

      <RNModal
        visible={editorOpen}
        onRequestClose={() => setEditorOpen(false)}
        transparent={true}
        animationType="fade"
        style={styles.fullscreenEditor}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {Editor}
          <Horizontal
            style={{
              justifyContent: "flex-end",
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background,
            }}
          >
            <Button
              rounded
              variant="soft"
              onPress={() => {
                setEditorOpen(false);
              }}
            >
              <X />
            </Button>
            <Button rounded onPress={() => setEditorOpen(false)}>
              <Check />
            </Button>
          </Horizontal>
        </SafeAreaView>
        {editorOpen && ImageModal}
      </RNModal>

      {!editorOpen && ImageModal}
    </Vertical>
  );
};

const editorStyles = createStyleSheet((theme) => ({
  preview: {
    height: 500,
    overflow: "hidden",
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  previewDisabled: {
    opacity: 0.5,
  },
  webview: {
    backgroundColor: "transparent",
  },
  editorContainer: {
    height: "100%",
    marginTop: theme.spacing.md,
    backgroundColor: "red",
    display: "flex",
    flexDirection: "column",
  },
  editor: {
    flex: 1,
    height: "100%",
  },
  fullscreenEditor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
