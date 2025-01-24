import UserCollections from "@/components/content/UserCollections";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Divider } from "@/components/layout/divider";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { Vertical } from "@/components/layout/Stack";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

export default function Home() {
  const { t } = useTranslation();
  return (
    <Layout>
      <ScrollView>
        <Container>
          <Section>
            <Vertical>
              <H1>{t("pages.home.title")}</H1>
              <UserCollections />
            </Vertical>
          </Section>
        </Container>
      </ScrollView>
    </Layout>
  );
}
