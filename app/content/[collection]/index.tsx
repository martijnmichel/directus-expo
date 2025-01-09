import { View, Text, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import { useLocalSearchParams } from "expo-router";
import { useCollection, useDocuments } from "@/state/directus/collection";
import { List, ListItem } from "@/components/display/list";
import { map } from "lodash";
export default function Collection() {
  const { collection } = useLocalSearchParams();
  const { data } = useCollection(collection as string);
  const { data: documents } = useDocuments(collection);
  return (
    <Layout>
      <Container>
        <Section>
          <H1>{collection}</H1>
          <Text>{JSON.stringify(data)}</Text>
          <List>
            {map(documents, (doc) => (
              <ListItem href={`/content/${collection}/${doc.id}`}>
                {doc.id}
              </ListItem>
            ))}
          </List>
        </Section>
      </Container>
    </Layout>
  );
}
