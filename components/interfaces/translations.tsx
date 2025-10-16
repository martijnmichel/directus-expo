import { usePermissions } from "@/state/queries/directus/core";
import { useStyles } from "react-native-unistyles";
import { InterfaceProps } from ".";
import { formStyles } from "./style";
import { useRelations } from "@/state/queries/directus/core";
import { CoreSchema } from "@directus/sdk";
import { useDocuments, useFields } from "@/state/queries/directus/collection";
import { useTranslation } from "react-i18next";
import { Modal } from "react-native";
import { Pressable } from "react-native";
import { View } from "react-native";
import { Text } from "../display/typography";
import { useEffect, useState } from "react";
import { Check, ChevronDown } from "../icons";
import { DocumentEditor } from "../content/DocumentEditor";
import { filter, find, isEmpty, isUndefined, map, some } from "lodash";
import { Link } from "expo-router";
import { RelatedListItem } from "../display/related-listitem";
import { Button } from "../display/button";
import { DirectusIcon } from "../display/directus-icon";
import { usePrimaryKey } from "@/hooks/usePrimaryKey";
import { Horizontal } from "../layout/Stack";
import EventBus, { MittEvents } from "@/utils/mitt";
import { objectToBase64 } from "@/helpers/document/docToBase64";

type RelatedItem = { id?: number | string; [key: string]: any };
type RelatedItemState = {
  create: RelatedItem[];
  update: RelatedItem[];
  delete: number[];
};

type M2MInputProps = InterfaceProps<{
  value: number[] | RelatedItemState;
  onChange: (value: RelatedItemState) => void;
}>;

export const Translations = ({
  docId,
  uuid,
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  disabled,
  required,
  ...props
}: M2MInputProps) => {
  if (!item) {
    console.warn(`M2MInput ${label}: item is required`);
    return null;
  }

  const [baseLanguage, setBaseLanguage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { styles: formStyle, theme } = useStyles(formStyles);
  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item?.collection as keyof CoreSchema);

  const { t } = useTranslation();

  const isInitial = Array.isArray(valueProp);
  const value = isInitial
    ? {
        create: [],
        update: [],
        delete: [],
      }
    : valueProp;

  const junction = relations?.find(
    (r) =>
      r.related_collection === item.collection &&
      r.meta.one_field === item.field
  );

  const relation = relations?.find(
    (r) =>
      r.field === junction?.meta.junction_field &&
      r.collection === junction.meta.many_collection
  );

  const { data: languages } = useDocuments(
    relation?.related_collection as keyof CoreSchema,
    {},
    { enabled: !!relation }
  );

  console.log({ languages });

  const { data: translatedDocuments } = useDocuments(
    relation?.collection as keyof CoreSchema,
    {
      filter: {
        _and: [
          {
            [relation?.meta.junction_field as any]: {
              _eq: docId,
            },
          },
        ],
      },
    },
    { enabled: !!relation && docId !== "+" }
  );

  const primaryKey = usePrimaryKey(relation?.collection as keyof CoreSchema);

  const getTranslatedDocumentByLanguage = (language: string) => {
    return (
      find(value.create, (doc) => doc?.[relation?.field as any] === language) ||
      find(value.update, (doc) => doc?.[relation?.field as any] === language) ||
      find(
        translatedDocuments?.items,
        (doc) => doc?.[relation?.field as any] === language
      )
    );
  };

  const defaultBaseLanguageValues = getTranslatedDocumentByLanguage(
    baseLanguage as string
  );

  useEffect(() => {
    const addM2M = (event: MittEvents["translations:edit"]) => {
      if (event.field === item.field && event.uuid === uuid) {
        console.log("translations:edit:received", event);

        const newState = {
          create: [
            ...value.create.filter(
              (d) =>
                !find(
                  event.data,
                  (o) =>
                    o?.[relation?.field as any] === d?.[relation?.field as any]
                )
            ),
            ...filter(event.data, (d) => !d.translations_id),
          ],
          update: [
            ...value.update.filter(
              (d) =>
                !find(
                  event.data,
                  (o) => o.translations_id === d.translations_id
                )
            ),
            ...filter(event.data, (d) => !!d.translations_id),
          ],
          delete: value.delete,
        };
        props.onChange(newState);
      }
    };
    EventBus.on("translations:edit", addM2M);
    return () => {
      EventBus.off("translations:edit", addM2M);
    };
  }, [valueProp, props.onChange, relation, junction, value, uuid]);

  console.log({
    item,
    junction,
    relation,
    languages,
    translatedDocuments,
    primaryKey,
    value,
    docId,
  });
 
  return (
    <View style={formStyle.formControl}>
      {label && (
        <Text
          style={[
            formStyle.label,
            disabled && { color: theme.colors.textTertiary },
          ]}
        >
          {label} {required && "*"}
        </Text>
      )}

      {map(languages?.items, (language) => {
        const translated = getTranslatedDocumentByLanguage(
          language?.[relation?.schema?.foreign_key_column as any]
        );

        const defaultValues =
          value.update.find(
            (d) =>
              d?.[relation?.field as any] ===
              language?.[relation?.schema?.foreign_key_column as any]
          ) ||
          value.create.find(
            (d) =>
              d?.[relation?.field as any] ===
              language?.[relation?.schema?.foreign_key_column as any]
          );
        const color = translated
          ? some(translated, (v) => {
              return !v || v?.length <= 0;
            })
            ? theme.colors.warning
            : theme.colors.success
          : theme.colors.errorText;
        return (
          <RelatedListItem
            key={language.code}
            prepend={
              <Horizontal>
                <DirectusIcon size={20} name="translate" />

                <View
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: color,
                    borderRadius: 999,
                  }}
                />
              </Horizontal>
            }
            append={
              <>
                <Link
                  href={{
                    pathname: `/modals/translations/[id]`,
                    params: {
                      collection: item.collection,
                      id:
                        find(
                          translatedDocuments?.items,
                          (doc) =>
                            doc?.[relation?.meta.many_field as any] ===
                            language?.[
                              relation?.schema?.foreign_key_column as any
                            ]
                        )?.[primaryKey as any] || "+",
                      uuid,
                      field: item.field,
                      base_language: baseLanguage,
                      defaultValues: defaultValues
                        ? objectToBase64(defaultValues)
                        : "",
                      baseLanguageValues: defaultBaseLanguageValues
                        ? objectToBase64(defaultBaseLanguageValues)
                        : "",
                      language:
                        language[relation?.schema?.foreign_key_column as any],
                    },
                  }}
                  asChild
                >
                  <Button variant="ghost" rounded>
                    <DirectusIcon name="edit_square" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  rounded
                  onPress={() => {
                    setBaseLanguage(
                      language?.[relation?.schema?.foreign_key_column as any]
                    );
                  }}
                >
                  <DirectusIcon name="compare" />
                </Button>
              </>
            }
          >
            <Horizontal>
              <Text>
                {language?.[relation?.schema?.foreign_key_column as any]}
              </Text>
              {baseLanguage ===
                language?.[relation?.schema?.foreign_key_column as any] && (
                <Horizontal>
                  <Text style={{ ...theme.typography.helper }}>
                    {t("base_language")}
                  </Text>
                  <Check size={16} />
                </Horizontal>
              )}
            </Horizontal>
          </RelatedListItem>
        );
      })}

      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};
