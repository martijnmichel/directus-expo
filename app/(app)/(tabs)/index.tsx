import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";

export default function Home() {
  return (
    <Layout>
      <ScrollView>
        <Container>
          <UserCollections />
        </Container>
      </ScrollView>
    </Layout>
  );
}
