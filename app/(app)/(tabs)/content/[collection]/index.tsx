import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { useCollection } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { useCollectionMeta } from "@/helpers/collections/getCollectionTranslation";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import CollectionLayout from "@/components/layout/CollectionLayout";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
export default function Collection() {
  const { collection } = useLocalSearchParams();
  const { data, isLoading } = useCollection(collection as keyof CoreSchema);
  const { label } = useCollectionMeta(data);

  const headerStyles = useHeaderStyles();

  if (isLoading) {
    return (
      <Layout>
        <></>
      </Layout>
    );
  }

  return data?.meta.singleton ? (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle: label,
          ...headerStyles,
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <DocumentEditor collection={collection as keyof CoreSchema} />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  ) : (
    <CollectionLayout>
      <CollectionDataTable collection={collection as keyof CoreSchema} />
    </CollectionLayout>
  );
}
