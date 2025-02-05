import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { useDebounce } from "@uidotdev/usehooks";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
  usePathname,
} from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { get, map, set, uniq } from "lodash";
import { CoreSchema, createItem, readItem } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import {
  useCollection,
  useDocument,
  useDocuments,
} from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { EventBus } from "@/utils/mitt";
import { usePrimaryKey } from "@/hooks/usePrimaryKey";
import { useRelations } from "@/state/queries/directus/core";
import { Alert } from "@/components/display/alert";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { useState } from "react";
import { Button } from "@/components/display/button";
import { View } from "react-native";
import { Tabs } from "@/components/display/tabs";
import { Check } from "@/components/icons";
import { base64ToObject } from "@/helpers/document/docToBase64";
export default function Collection() {
  const {
    collection,
    id,
    uuid,
    field,
    language,
    base_language,
    defaultValues: base64DefaultValues,
  } = useLocalSearchParams();

  const defaultValues = base64DefaultValues
    ? base64ToObject((base64DefaultValues as string) || "")
    : undefined;
  console.log({ defaultValues });

  const { data: relations } = useRelations();

  const junction = relations?.find(
    (r) => r.related_collection === collection && r.meta.one_field === field
  );

  const relation = relations?.find(
    (r) =>
      r.field === junction?.meta.junction_field &&
      r.collection === junction.meta.many_collection
  );

  const lanuages = [language, base_language];
  const [open, setOpen] = useState(lanuages[0]);

  const { data } = useCollection(
    relation?.related_collection as keyof CoreSchema
  );
  const headerTitle = useDocumentDisplayTemplate({
    collection: collection as keyof CoreSchema,
    docId: id as string,
    template: data?.meta.display_template || "",
  });

  const primaryKey = usePrimaryKey(collection as keyof CoreSchema);

  const headerStyles = useHeaderStyles({ isModal: true });

  const { data: documents } = useDocuments(
    relation?.collection as keyof CoreSchema,
    {
      filter: {
        _and: [{ [relation?.field as any]: { _eq: base_language } }],
      },
    },
    { enabled: !!relation }
  );

  const [form, setForm] = useState<Record<string, any>[]>([]);

  const debouncedForm = useDebounce(form, 1000);

  console.log({ documents, junction, relation, form: debouncedForm });

  const handleChange = (doc: Record<string, any>, lang: string) => {
    const index = form.findIndex((i) => i?.[relation?.field as any] === lang);
    if (!doc?.[relation?.field as any]) {
      set(doc, relation?.field as any, lang);
    }
    const updated = [...form];
    updated[index >= 0 ? index : form.length] = doc;
    setForm(updated);
  };

  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle,
          ...headerStyles,
          presentation: "modal",
          headerRight: () => (
            <Button
              rounded
              disabled={!debouncedForm.length}
              onPress={() => {
                console.log(debouncedForm);
                router.dismiss();
                EventBus.emit("translations:edit", {
                  data: debouncedForm,
                  field: field as string,
                  uuid: uuid as string,
                });
              }}
            >
              <Check />
            </Button>
          ),
        }}
      />
      <KeyboardAwareScrollView>
        {!!junction && (
          <Container>
            <Section>
              <Vertical spacing="xxl">
                <Tabs variant="underline" defaultValue={language as string}>
                  <Tabs.List>
                    {uniq(lanuages).map((l) => (
                      <Tabs.Trigger key={l as string} value={l as string}>
                        {l}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  <Tabs.Content forceMount value={language as string}>
                    <DocumentEditor
                      collection={junction?.collection as keyof CoreSchema}
                      id={!defaultValues ? (id as string) || "+" : "+"}
                      submitType="inline"
                      onChange={(doc) => handleChange(doc, language as string)}
                      defaultValues={defaultValues}
                    />
                  </Tabs.Content>

                  {base_language !== language && (
                    <Tabs.Content forceMount value={base_language as string}>
                      <DocumentEditor
                        collection={junction?.collection as keyof CoreSchema}
                        id={(get(documents, "items[0].id") as string) || "+"}
                        submitType="inline"
                        onChange={(doc) =>
                          handleChange(doc, base_language as string)
                        }
                      />
                    </Tabs.Content>
                  )}
                </Tabs>
              </Vertical>
            </Section>
          </Container>
        )}
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
