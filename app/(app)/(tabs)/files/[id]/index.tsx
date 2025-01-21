import { DocumentEditor } from "@/components/content/DocumentEditor";
import { Container } from "@/components/layout/Container";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { useFile } from "@/state/queries/directus/core";
import { Stack, useLocalSearchParams } from "expo-router";

export default function File() {
  const { id } = useLocalSearchParams();
  const { data: file } = useFile(id as string, { fields: ["title"] });
  return (
    <KeyboardAwareLayout>
      <Stack.Screen options={{ headerTitle: file?.title }} />
      <KeyboardAwareScrollView>
        <Container>
          <DocumentEditor collection="directus_files" id={id as string} />
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
