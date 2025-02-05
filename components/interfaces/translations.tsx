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
import { ChevronDown } from "../icons";
import { DocumentEditor } from "../content/DocumentEditor";
import { find, map } from "lodash";
import { Link } from "expo-router";
import { RelatedListItem } from "../display/related-listitem";
import { Button } from "../display/button";
import { DirectusIcon } from "../display/directus-icon";
import { usePrimaryKey } from "@/hooks/usePrimaryKey";

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

  const [modalVisible, setModalVisible] = useState(false);
  const { styles: formStyle, theme } = useStyles(formStyles);
  const { data: relations } = useRelations();
  const { data: permissions } = usePermissions();
  const { data: fields } = useFields(item?.collection as keyof CoreSchema);

  const { t } = useTranslation();

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

  const { data: translatedDocuments } = useDocuments(
    relation?.collection as keyof CoreSchema,
    {
      filter: {
        _and: [
          {
            translations_id: {
              _eq: docId,
            },
          },
        ],
      },
    }
  );

  const primaryKey = usePrimaryKey(relation?.collection as keyof CoreSchema);

  console.log({
    item,
    junction,
    relation,
    languages,
    translatedDocuments,
    primaryKey,
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

      {map(languages?.items, (language) => (
        <RelatedListItem
          key={language.code}
          append={
            <>
              <Link
                href={{
                  pathname: `/modals/translations/[id]`,
                  params: {
                    collection: junction?.collection,
                    id:
                      find(
                        translatedDocuments?.items,
                        (doc) =>
                          doc?.[relation?.meta.many_field as any] ===
                          language?.[relation?.schema.foreign_key_column as any]
                      )?.[primaryKey as any] || "+",
                    uuid,
                    field: item.field,
                    language:
                      language[relation?.schema.foreign_key_column as any],
                  },
                }}
                asChild
              >
                <Button variant="ghost" rounded>
                  <DirectusIcon name="edit_square" />
                </Button>
              </Link>
            </>
          }
        >
          {language?.[relation?.schema.foreign_key_column as any]}
        </RelatedListItem>
      ))}

      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};
