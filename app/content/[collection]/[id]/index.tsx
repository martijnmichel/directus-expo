import { View, Text, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import { useLocalSearchParams } from "expo-router";
import {
  useCollection,
  useDocument,
  useFields,
} from "@/state/directus/collection";
import { List, ListItem } from "@/components/display/list";
import { map } from "lodash";
export default function Collection() {
  const { collection, id } = useLocalSearchParams();
  const { data } = useCollection(collection as string);
  const { data: document } = useDocument(collection as string, id);
  const { data: fields } = useFields(collection as string);

  const fieldValue = (field: string) => {
    return document?.[field as keyof typeof document];
  };

  return (
    <Layout>
      <Container>
        <Section>
          <H1>{collection}</H1>
          <Text>{JSON.stringify(data)}</Text>
          <List>
            {map(fields, ({ field, collection }) => (
              <ListItem>
                {field}: {fieldValue(field)}
              </ListItem>
            ))}
          </List>
        </Section>
      </Container>
    </Layout>
  );
}
