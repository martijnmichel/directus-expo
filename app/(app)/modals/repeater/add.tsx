import { Stack, useRouter } from "expo-router";

import { Section } from "@/components/layout/Section";
import { KeyboardAwareScrollView } from "@/components/layout/Layout";

import { KeyboardAwareLayout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { useLocalSearchParams } from "expo-router";
import { RepeaterDocument } from "@/components/content/RepeaterDocument";
import { base64ToObject } from "@/helpers/document/docToBase64";
import { EventBus } from "@/utils/mitt";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { useTranslation } from "react-i18next";

const RepeaterModal = () => {
  const { fields, item_field, uuid } = useLocalSearchParams();
  const router = useRouter();
  const headerStyle = useHeaderStyles({ isModal: true });
  const { t } = useTranslation();
  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle: t("pages.modals.repeater.add"),
          ...headerStyle,
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <RepeaterDocument
              fields={base64ToObject(fields as string)}
              onSave={(doc) => {
                console.log("doc", doc);
                router.dismiss();
                EventBus.emit("repeater:add", {
                  field: item_field as string,
                  data: doc,
                  uuid: uuid as string,
                });
              }}
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
};

export default RepeaterModal;
