import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Pressable,
  TextInput,
  Modal as RNModal,
  SafeAreaView,
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
import { Horizontal } from "@/components/layout/Stack";
import { Check, X } from "@/components/icons";
import { useSafeAreaFrame } from "react-native-safe-area-context";

interface TinyMCEEditorProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChangeText"> {
  value?: string;
  item: ReadFieldOutput<CoreSchema>;
  onChange?: (text: string) => void;
}

export const TinyMCEEditor = ({
  value = "",
  onChange,
  label,
  error,
  helper,
  style,
  item,
  disabled,
  ...props
}: TinyMCEEditorProps) => {
  const { styles } = useStyles(editorStyles);
  const webViewRef = useRef<WebView>(null);
  const themeName = UnistylesRuntime.themeName;
  const { theme } = useStyles();
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
    webViewRef.current?.injectJavaScript(`
        tinymce.activeEditor.insertContent('<img src="${
          directus!.url
        }/assets/${image}}" alt="Inserted Image" />');
        true;
      `);
    setFilePickerOpen(false);
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

  const TINYMCE_HTML = `
<!DOCTYPE html>
<html style="margin: 0; background-color: ${theme.colors.background};">
<head>
  <script src="https://app.ecbase.nl/js/tinymce/tinymce.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; background-color: ${theme.colors.background}}
    .mce-content-body { font-family: -apple-system, sans-serif; width: 100%; overlfow-x: hidden }
    img { width: 100%; height: auto; }
    table { width: 100%; }
    td { border: 1px solid #ccc; padding: 8px; }
    .tox-statusbar { display: none; }
  </style>
</head>
<body style="height: 500px;">
  <textarea id="editor"></textarea>
  <script>
    tinymce.init({
      selector: '#editor',
      menubar: false,
      nowrap: true,
      skin: '${themeName === "dark" ? "oxide-dark" : "oxide"}',
      content_css: '${themeName}',
      content_style: 'img { max-width: 100%; height: auto; }',
      toolbar: '${item.meta.options?.toolbar.join(" ")}',
      toolbar_sticky: true,
      toolbar_location: 'bottom',
      add_license_key: 'gpl',
      height: 500,
      plugins: ['lists', 'link', 'image', 'table'],
      setup: function(editor) {
        editor.on('change keyup blur', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            name: 'contentChange',
            content: editor.getContent()
          }));
        });
        editor.on('init', function() {
          const content = '${escapeContent(value)}';
          tinymce.activeEditor.setContent(content);
        });

        editor.on('FullscreenStateChanged', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ name: 'openFullscreen' }))
           console.log(tinymce)
        });

        
        editor.ui.registry.addButton('customImage', {
            icon: 'image',
            onAction: () => window.ReactNativeWebView.postMessage(JSON.stringify({ name: 'openImagePicker' }))
        });
      }
    });
  </script>
</body>
</html>
`;

  const Editor = useMemo(
    () => (
      <WebView
        originWhitelist={["*"]}
        ref={webViewRef}
        source={{ html: TINYMCE_HTML }}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          switch (data.name) {
            case "contentChange":
              handleContentChange(data.content);
              break;
            case "setHeight":
              console.log("setHeight", data.height);
              setEditorHeight(data.height);
              break;
            case "openImagePicker":
              setFilePickerOpen(true);
              break;
            case "openFullscreen":
              /**
               *    full screen works with either fullscreen and autoresize plugin,
               *    but setting 500px on init will not resize it when going to full screen
               *    and setting autoresize to true will not work on init (because it will be higher than the container height)
               * */
              setEditorOpen(true);

              break;
          }
        }}
        style={styles.editor}
      />
    ),
    []
  );

  return (
    <>
      <View style={[styles.preview, disabled && styles.previewDisabled]}>
        {Editor}
      </View>

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
      </RNModal>

      <Modal open={filePickerOpen} onClose={() => setFilePickerOpen(false)}>
        <Modal.Content>
          <ImageInput
            onChange={(image) => {
              handleImageChange(image as string);
            }}
          />
        </Modal.Content>
      </Modal>
    </>
  );
};

const editorStyles = createStyleSheet((theme) => ({
  preview: {
    height: 500,
    overflow: "hidden",
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
