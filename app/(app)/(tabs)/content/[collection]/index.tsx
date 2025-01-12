import { View, Text, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { List, ListItem } from "@/components/display/list";
import { map, some } from "lodash";
import { useDocuments, useFields } from "@/state/queries/directus/collection";
import { useCollection } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { usePermissions } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { Plus } from "@/components/icons";
import { Button } from "@/components/display/button";
import { Table } from "@/components/display/table";
import { CollectionDataTable } from "@/components/content/CollectionDataTable";
export default function Collection() {
  const { collection } = useLocalSearchParams();
  const { data } = useCollection(collection as keyof CoreSchema);
  return (
    <Layout>
      <Stack.Screen
        options={{
          headerTitle: getCollectionTranslation(data, "nl-NL"),
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
        <CollectionDataTable collection={collection as keyof CoreSchema} />
      </Container>
    </Layout>
  );
}
