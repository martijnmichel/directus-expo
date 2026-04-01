import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { CoreSchema, ReadFieldOutput, readItems } from "@directus/sdk";
import { Select } from "./select";
import {
  getFieldPathsFromTemplate,
  getFieldsFromTemplate,
  parseRepeaterTemplate,
  parseTemplate,
  parseTemplateParts,
} from "@/helpers/document/template";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { Link, router } from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { formStyles } from "./style";
import { useStyles } from "react-native-unistyles";
import { ChevronDown, X } from "../icons";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import {
  useCollection,
  useDocument,
  useField,
  useFields,
} from "@/state/queries/directus/collection";
import { Center } from "../layout/Center";
import EventBus, {
  MittEvents,
  RelatedItem,
  RelatedItemState,
} from "@/utils/mitt";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { Text } from "../display/typography";
import { DirectusIcon } from "../display/directus-icon";
import { InterfaceProps } from ".";
import { filter, map, merge, uniq } from "lodash";
import { FieldValue } from "../content/FieldValue";
import { generateUUID } from "@/hooks/useUUID";
import { useRelations } from "@/state/queries/directus/core";
import { TemplatePartsRenderer } from "../content/TemplatePartsRenderer";

interface Schema {
  [key: string]: any;
}

type M2OInputProps = InterfaceProps<{
  value?: string | number | RelatedItem;
  onValueChange?: (value: string | number | RelatedItem | null) => void;
}>;

export const M2OInput = ({
  item,
  value: valueProp,
  documentSessionId,
  onValueChange,
  label,
  error,
  helper,
  disabled,
  required,
}: M2OInputProps) => {
  if (!item) {
    console.warn(`M2OInput ${label}: item is required`);
    return null;
  }

  const { data: relations } = useRelations();

  const relation = relations?.find(
    (r) => r.related_collection === item.schema.foreign_key_table,
  );

  const { data: relatedFields } = useFields(
    item.schema.foreign_key_table as any,
  );

  const { data: relatedCollection } = useCollection(
    item.schema.foreign_key_table as any,
  );

  const relatedPk = getPrimaryKey(relatedFields);

  const value = useMemo(() => {
    return typeof valueProp === "object"
      ? valueProp
      : !!valueProp
        ? {
            [relatedPk as string]: valueProp,
            __id: valueProp?.toString(),
            __state: RelatedItemState.Default,
          }
        : undefined;
  }, [valueProp, relatedPk, item.field, documentSessionId]);

  const hasValue = !!value;

  const relatedId = !!value ? value?.[relatedPk as string] : undefined;

  const interfaceTemplate = item.meta.options?.template || "";

  const effectiveTemplate =
    interfaceTemplate ||
    (relatedCollection?.meta?.display_template as string | undefined) ||
    "";

  const templatePaths = getFieldPathsFromTemplate(effectiveTemplate)
    .map((p) => (p.includes(".$") ? p.split(".$")[0] : p))
    .filter(Boolean);

  const requestFields = relation
    ? uniq([relatedPk, ...templatePaths]).filter(Boolean)
    : [];

  const isNew = value?.__state === RelatedItemState.Created;
  const isUpdated = value?.__state === RelatedItemState.Updated;
  const isPicked = value?.__state === RelatedItemState.Picked;
  const isDeleted = value?.__state === RelatedItemState.Deleted;
  const isDefault = value?.__state === RelatedItemState.Default;

  const { data: doc } = useDocument({
    collection: item.schema.foreign_key_table as any,
    id: relatedId,
    options: {
      fields: requestFields as any,
    },
    query: {
      enabled: hasValue && !!relatedId && !!relatedPk,
    },
  });

  const { styles, theme } = useStyles(formStyles);

  useEffect(() => {
    const addM2OAdd = (event: MittEvents["m2o:add"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        
        onValueChange?.({
          ...merge(value, event.data),
          __id: event.__id ?? event.draft_id ?? generateUUID(),
          __state: event.__id
            ? RelatedItemState.Picked
            : RelatedItemState.Created,
        });
      }
    };

    const updateM2OUpdate = (event: MittEvents["m2o:update"]) => {
      if (
        event.field === item.field &&
        event.document_session_id === documentSessionId
      ) {
        onValueChange?.({
          ...merge(value, event.data),
          __state: RelatedItemState.Updated,
        });
      }
    };

    EventBus.on("m2o:add", addM2OAdd);
    EventBus.on("m2o:update", updateM2OUpdate);
    return () => {
      EventBus.off("m2o:add", addM2OAdd);
      EventBus.off("m2o:update", updateM2OUpdate);
    };
  }, [relatedPk, item.field, documentSessionId, onValueChange, value]);

  const partsFromDoc = parseTemplateParts(
    effectiveTemplate,
    doc,
    relatedFields,
  );

  const partsFromValue = parseTemplateParts(
    effectiveTemplate,
    value,
    relatedFields,
  );

  const draftValueHasValues = Object.keys(value || {}).some((key) => {
    const field = relatedFields?.find((f) => f.field === key);
    return !!field && !field?.schema?.is_primary_key && !key.startsWith("__");
  });

  const parts = !!value && draftValueHasValues ? partsFromValue : partsFromDoc;

  console.log({
    item,
    relatedFields,
    relatedCollection,
    value,
    relatedId,
    doc,
    valueProp,
    requestFields,
    effectiveTemplate,
    templatePaths,
    relation,
    partsFromDoc,
    partsFromValue,
    parts,
  });

  return (
    <View style={styles.formControl}>
      {label && (
        <Text style={styles.label}>
          {label} {required && "*"}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <Pressable
          onPress={() => {
            router.push({
              pathname: `/modals/m2o/[collection]/pick`,
              params: {
                collection: item.schema.foreign_key_table as string,
                field: item.field,
                document_session_id: documentSessionId,
              },
            });
          }}
          style={[
            styles.input,
            { display: "flex", flexDirection: "row", alignItems: "center" },
          ]}
        >
          <TemplatePartsRenderer parts={parts} />
        </Pressable>
        <View style={styles.append}>
          {!disabled && (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 0,
              }}
            >
              {(isPicked || isUpdated || isDefault) && (
                <Link
                  href={{
                    pathname: `/modals/m2o/[collection]/[id]`,
                    params: {
                      collection: item.schema.foreign_key_table as string,
                      id: value?.[relatedPk as string],
                      draft_id: value?.__id,
                      draft:
                        value && draftValueHasValues
                          ? objectToBase64(value)
                          : undefined,
                      item_field: item.field,
                      document_session_id: documentSessionId,
                    },
                  }}
                  asChild
                >
                  <Button variant="ghost" size="icon">
                    <DirectusIcon name="edit_square" />
                  </Button>
                </Link>
              )}

              {isNew && (
                <Link
                  href={{
                    pathname: `/modals/m2o/[collection]/add`,
                    params: {
                      collection: item.schema.foreign_key_table as string,
                      document_session_id: documentSessionId,
                      item_field: item.field,
                      draft_id: value?.__id,
                      draft:
                        value && draftValueHasValues
                          ? objectToBase64(value)
                          : undefined,
                    },
                  }}
                  asChild
                >
                  <Button variant="ghost" size="icon">
                    <DirectusIcon name="edit_square" />
                  </Button>
                </Link>
              )}

              {(!hasValue) && (
                <Link
                  href={{
                    pathname: `/modals/m2o/[collection]/add`,
                    params: {
                      collection: item.schema.foreign_key_table as string,
                      document_session_id: documentSessionId,
                      
                      item_field: item.field,
                    },
                  }}
                  asChild
                >
                  <Button variant="ghost" size="icon">
                    <DirectusIcon name="add" />
                  </Button>
                </Link>
              )}

              {!!hasValue && (
                <Button
                  size="icon"
                  variant="ghost"
                  onPress={() => {
                    onValueChange?.(null);
                  }}
                >
                  <DirectusIcon name="close" />
                </Button>
              )}
            </View>
          )}
          {!hasValue && (
            <View>
              <ChevronDown size={20} color={theme.colors.textPrimary} />
            </View>
          )}
        </View>
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};
