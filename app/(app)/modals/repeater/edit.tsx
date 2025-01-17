import { Stack } from "expo-router";

import { Section } from "@/components/layout/Section";
import { KeyboardAwareScrollView } from "@/components/layout/Layout";

import { KeyboardAwareLayout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { useLocalSearchParams } from "expo-router";
import { RepeaterDocument } from "@/components/content/RepeaterDocument";
import { base64ToObject } from "@/helpers/document/docToBase64";

const RepeaterModal = () => {
  const { fields, document } = useLocalSearchParams();

  const defaultValues = base64ToObject(document as string);
  console.log({ defaultValues, fields });
  return (
    <KeyboardAwareLayout>
      <Stack.Screen options={{ headerTitle: "Repeater" }} />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <RepeaterDocument
              fields={base64ToObject(fields as string)}
              defaultValues={defaultValues}
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
};

export default RepeaterModal;
