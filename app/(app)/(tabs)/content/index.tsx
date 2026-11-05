import UserCollections from "@/components/content/UserCollections";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { Vertical } from "@/components/layout/Stack";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";

export default function ContentHome() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const headerStyles = useHeaderStyles();

  return (
    <Layout>
      <Stack.Screen
        options={{
          headerShown: false,
          ...headerStyles,
        }}
      />
      <ScrollView>
        <Container>
          <Section>
            <Vertical>
              {!!top && <View style={{ height: top }} />}
              <H1>{t("pages.home.title")}</H1>
              <UserCollections />
            </Vertical>
          </Section>
        </Container>
      </ScrollView>
    </Layout>
  );
}
