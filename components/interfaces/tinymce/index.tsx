import React, { useState, useRef } from "react";
import { View, Pressable, TextInput } from "react-native";
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
<html>
<head>
  <script src="https://app.ecbase.nl/js/tinymce/tinymce.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; }
    .mce-content-body { font-family: -apple-system, sans-serif; width: 100%; overlfow-x: hidden }
    img { width: 100%; height: auto; }
    table { width: 100%; }
    td { border: 1px solid #ccc; padding: 8px; }
  </style>
</head>
<body>
  <textarea id="editor"></textarea>
  <script>
    tinymce.init({
      selector: '#editor',
      menubar: false,
      nowrap: true,
      skin: '${themeName === "dark" ? "oxide-dark" : "oxide"}',
      content_css: '${themeName}',
      content_style: 'img { max-width: 100%; height: auto; } .tox-toolbar { background-color: ${
        theme.colors.backgroundAlt
      } }',
      toolbar: '${item.meta.options?.toolbar.join(" ")} customFullscreen',
      toolbar_mode: 'floating',
      toolbar_location: 'bottom',
      add_license_key: 'gpl',
      height: 500,
      plugins: ['lists', 'link', 'image', 'table'],
      setup: function(editor) {
        editor.on('change keyup blur', function() {
          window.ReactNativeWebView.postMessage({ name: 'contentChange', content: editor.getContent() });
        });
        editor.on('init', function() {
          const content = '${escapeContent(value)}';
          tinymce.activeEditor.setContent(content);
        });

        editor.on('Load', function() {

 window.ReactNativeWebView.postMessage({ name: 'setHeight', height: document.getElementById('editor').height })
         
        });

        editor.ui.registry.addButton('customImage', {
            icon: 'image',
            onAction: () => window.ReactNativeWebView.postMessage({ name: 'openImagePicker' })
        });
        editor.ui.registry.addButton('customFullscreen', {
            icon: 'maximize',
            onAction: () => window.ReactNativeWebView.postMessage({ name: 'openFullscreen' })
        });
      }
    });
  </script>
</body>
</html>
`;

const Editor =   <WebView
originWhitelist={["*"]}
ref={webViewRef}
source={{ html: TINYMCE_HTML }}
onMessage={(event) => {
  switch (event.nativeEvent.data.name) {
    case "contentChange":
      handleContentChange(event.nativeEvent.data.content);
      break;
    case "setHeight":
      console.log("setHeight", event.nativeEvent.data.height);
      setEditorHeight(event.nativeEvent.data.height);
      break;
    case "openImagePicker":
      setFilePickerOpen(true);
      break;
    case "openFullscreen":
      setEditorOpen(true);
      break;
  }
}}
style={styles.editor}
/>


  return (
    <>
      <View style={[styles.preview, disabled && styles.previewDisabled, { height: editorHeight }]}>
        {Editor}

        
      </View>

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)}>
        <Modal.Content fullscreen={true} contentStyle={{ flex: 1 }}>
          {Editor}
        </Modal.Content>
      </Modal>

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
   height: 500, overflow: "hidden",
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
  },
}));
