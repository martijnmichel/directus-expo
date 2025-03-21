import { router, Stack } from "expo-router";

import { Section } from "@/components/layout/Section";
import { KeyboardAwareScrollView } from "@/components/layout/Layout";

import { KeyboardAwareLayout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { useLocalSearchParams } from "expo-router";
import { RepeaterDocument } from "@/components/content/RepeaterDocument";
import { base64ToObject } from "@/helpers/document/docToBase64";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import EventBus from "@/utils/mitt";
import { useTranslation } from "react-i18next";

const RepeaterModal = () => {
  const { fields, document, item_field, index, uuid } = useLocalSearchParams();
  const headerStyle = useHeaderStyles({ isModal: true });
  const defaultValues = base64ToObject(document as string);
  const { t } = useTranslation();
  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle: t("pages.modals.repeater.edit"),
          ...headerStyle,
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <RepeaterDocument
              fields={base64ToObject(fields as string)}
              defaultValues={defaultValues}
              onSave={(doc) => {
                console.log("doc", doc);
                router.dismiss();
                EventBus.emit("repeater:edit", {
                  field: item_field as string,
                  data: doc,
                  index: parseInt(index as string),
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
