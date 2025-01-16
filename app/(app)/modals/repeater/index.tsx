import { Stack } from "expo-router";

import { RepeaterDocument } from "@/components/interfaces/repeater";
import { Section } from "@/components/layout/Section";
import { KeyboardAwareScrollView } from "@/components/layout/Layout";

import { KeyboardAwareLayout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { useLocalSearchParams } from "expo-router";

export const RepeaterModal = () => {
  const { fields } = useLocalSearchParams();
  return (
    <KeyboardAwareLayout>
      <Stack.Screen options={{ headerTitle: "Repeater" }} />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <RepeaterDocument fields={fields} />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
};
