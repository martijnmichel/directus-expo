import { View, Text, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { useCollection } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { usePermissions } from "@/state/queries/directus/core";
import { Plus } from "@/components/icons";
import { Button } from "@/components/display/button";
import { Table } from "@/components/display/table";
import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { useCollectionMeta } from "@/helpers/collections/getCollectionTranslation";
import { DocumentEditor } from "@/components/content/DocumentEditor";
export default function Collection() {
  const { collection } = useLocalSearchParams();
  const { data, isLoading } = useCollection(collection as keyof CoreSchema);
  const { label } = useCollectionMeta(data);

  if (isLoading) {
    return null;
  }

  return (
    <Layout>
      <Stack.Screen
        options={{
          headerTitle: label,
          headerRight: () => (
            <Link href={`/content/${collection}/+`} asChild>
              <Button rounded>
                <Plus />
              </Button>
            </Link>
          ),
        }}
      />
      <Container>
        <Section>
          {data?.meta.singleton ? (
            <DocumentEditor collection={collection as keyof CoreSchema} />
          ) : (
            <CollectionDataTable collection={collection as keyof CoreSchema} />
          )}
        </Section>
      </Container>
    </Layout>
  );
}
