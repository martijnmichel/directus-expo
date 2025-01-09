import { View, Text, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import { useLocalSearchParams } from "expo-router";
import { List, ListItem } from "@/components/display/list";
import { map, some } from "lodash";
import { useDocuments } from "@/state/queries/directus/collection";
import { useCollection } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { usePermissions } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { parseTemplate } from "@/helpers/document/template";
export default function Collection() {
  const { collection } = useLocalSearchParams();
  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: documents } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema]
  );

  return (
    <Layout>
      <Container>
        <Section>
          <H1>{getCollectionTranslation(data, "nl-NL")}</H1>

          <List>
            {map(documents, (doc) => (
              <ListItem href={`/content/${collection}/${doc.id}`}>
                {parseTemplate(data?.meta.display_template || "", doc)}
              </ListItem>
            ))}
          </List>
        </Section>
      </Container>
    </Layout>
  );
}
