import React, { useState, useRef } from "react";
import { View, Pressable, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Modal } from "../../display/modal";
import { Input } from "../input";
import { Button } from "@/components/display/button";

interface TinyMCEEditorProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChangeText"> {
  value?: string;
  onChangeText?: (text: string) => void;
}

export const TinyMCEEditor = ({
  value = "",
  onChangeText,
  label,
  error,
  helper,
  style,
  disabled,
  ...props
}: TinyMCEEditorProps) => {
  const { styles } = useStyles(editorStyles);
  const [content, setContent] = useState(value);
  const webViewRef = useRef<WebView>(null);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChangeText?.(newContent);
  };

  const injectContent = (htmlContent: string) => {
    webViewRef.current?.injectJavaScript(`
        tinymce.activeEditor.setContent(\`${htmlContent.replace(
          /`/g,
          "\\`"
        )}\`);
        true;
      `);
  };

  const TINYMCE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://app.ecbase.nl/js/tinymce/tinymce.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0;  }
    .mce-content-body { font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
  <textarea id="editor"></textarea>
  <script>
    tinymce.init({
      selector: '#editor',
      menubar: false,
      plugins: 'lists link image',
      toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link',
      height: 500,
      setup: function(editor) {
        editor.on('change', function() {
          window.ReactNativeWebView.postMessage(editor.getContent());
        });
      }
    });
  </script>
</body>
</html>
`;

  return (
    <>
      <View style={[styles.preview, disabled && styles.previewDisabled]}>
        <WebView
          ref={webViewRef}
          source={{ html: TINYMCE_HTML }}
          onLoadEnd={() => injectContent(content)}
          onMessage={(event) => handleContentChange(event.nativeEvent.data)}
          style={styles.editor}
        />

        {/**   <WebView
          style={styles.webview}
          source={{
            html: `
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body { margin: 0; padding: 8px; font-family: -apple-system, sans-serif; }
                            img { max-width: 100%; height: auto; }
                          </style>
                        </head>
                        <body>${content}</body>
                      </html>
                    `,
          }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        /> */}
      </View>

      {/** <Modal>
        <Modal.Trigger>
          <Button>Open editor</Button>
        </Modal.Trigger>

        <Modal.Content
          variant="bottomSheet"
          height="90%"
          contentStyle={styles.editorContainer}
        >
          {({ close }) => (
            <WebView
              ref={webViewRef}
              source={{ html: TINYMCE_HTML }}
              onLoadEnd={() => injectContent(content)}
              onMessage={(event) => handleContentChange(event.nativeEvent.data)}
              style={styles.editor}
            />
          )}
        </Modal.Content>
      </Modal> */}
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
  },
}));
