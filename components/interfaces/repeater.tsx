import React, { useEffect, useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Link } from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { Sortable, SortableItem } from "@/contexts/DragDrop";
import EventBus, { MittEvents, RelatedItem } from "@/utils/mitt";
import { DragIcon, Trash, Edit } from "../icons";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import { parseRepeaterTemplate } from "@/helpers/document/template";
import { useTranslation } from "react-i18next";
import { Alert } from "../display/alert";
import { InterfaceProps } from ".";
import { generateUUID } from "@/hooks/useUUID";
import { RelatedListItem } from "../display/related-listitem";
import { DirectusIcon } from "../display/directus-icon";

type RepeaterInputProps = InterfaceProps<{
  value: Record<string, any>[] | undefined;
  onChange: (value: Record<string, any>[]) => void;
}>;

export const RepeaterInput = ({
  item,
  label,
  error,
  documentSessionId,
  helper,
  value: valueProp = [],
  onChange,
  disabled,
  required,
}: RepeaterInputProps) => {
  if (!item) {
    console.warn(`RepeaterInput ${label}: item is required`);
    return null;
  }

  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles } = useStyles(stylesheet);
  const { t } = useTranslation();

  const value = useMemo(() => {
    return valueProp?.length
      ? valueProp.map((v) => ({
          ...v,
          __id: v.__id ?? generateUUID(),
        }))
      : [];
  }, [valueProp]);


  const getDisplayValue = (repeatItem: any) => {
    const format = item.meta?.display_options?.format;
    return format
      ? parseRepeaterTemplate(format, repeatItem)
      : Object.values(repeatItem)
          .slice(0, 3)
          .map((v: any) => v?.toString())
          .join(" - ") || "--";
  };

  useEffect(() => {
    const addRepeater = (data: MittEvents["repeater:add"]) => {
      if (
        data.field === item.field &&
        data.document_session_id === documentSessionId
      ) {
        onChange([...value, { ...data.data, __id: generateUUID() }]);
      }
    };

    const editRepeater = (data: MittEvents["repeater:edit"]) => {
      if (
        data.field === item.field &&
        data.document_session_id === documentSessionId
      ) {
        const newValue = [...value, { ...data.data, __id: generateUUID() }];
        onChange(newValue);
      }
    };

    EventBus.on("repeater:add", addRepeater);
    EventBus.on("repeater:edit", editRepeater);

    return () => {
      EventBus.off("repeater:add", addRepeater);
      EventBus.off("repeater:edit", editRepeater);
    };
  }, [onChange, item.field, documentSessionId, value]);

  console.log({ item, value });

  return (
    <Vertical spacing="xs">
      {label && (
        <Text style={formControlStyles.label}>
          {label} {required && "*"}
        </Text>
      )}

      {!value?.length && (
        <Alert message={t("components.repeater.noItems")} status="info" />
      )}

      <Sortable
        direction="column"
        style={{ gap: 3 }}
        onOrderChange={(newOrderIds) => {
          const newValue = newOrderIds.map(
            (id) => value.find((v) => v.__id === id) as RelatedItem,
          );
          console.log({ newValue, newOrderIds });
          onChange(newValue);
        }}
      >
        {(value || []).map((repeaterItem, index) => (
          <SortableItem
            key={repeaterItem.__id}
            id={repeaterItem.__id.toString()}
            activationDelay={200}
          >
            <RelatedListItem
              isDraggable
              append={
                <>
                  <Link
                    href={{
                      pathname: `/modals/repeater/edit`,
                      params: {
                        document: objectToBase64(repeaterItem),
                        fields: objectToBase64(
                          item.meta?.options?.fields.map((f: any) => ({
                            ...f,
                            type: f.type || "string",
                            meta: {
                              ...f.meta,
                              interface: f.meta?.interface || "input",
                            },
                          })) || [],
                        ),
                        item_field: item.field,
                        document_session_id: documentSessionId,
                        index: index,
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
                    disabled={disabled}
                    onPress={() => {
                      const newValue = [...value];
                      newValue.splice(index, 1);
                      onChange?.(newValue);
                    }}
                    rounded
                  >
                    <DirectusIcon name="close" />
                  </Button>
                </>
              }
            >
              {getDisplayValue(repeaterItem)}
            </RelatedListItem>
          </SortableItem>
        ))}
      </Sortable>

      {(error || helper) && (
        <Text
          style={[
            formControlStyles.helperText,
            error && formControlStyles.errorText,
          ]}
        >
          {error || helper}
        </Text>
      )}

      {!disabled && (
        <Horizontal spacing="xs">
          <Link
            href={{
              pathname: `/modals/repeater/add`,
              params: {
                fields: objectToBase64(
                  item.meta?.options?.fields.map((f: any) => ({
                    ...f,
                    type: f.type || "string",
                    meta: {
                      ...f.meta,
                      interface: f.meta?.interface || "input",
                    },
                  })) || [],
                ),
                item_field: item.field,
                document_session_id: documentSessionId,
              },
            }}
            asChild
          >
            <Button>{t("components.repeater.addItem")}</Button>
          </Link>
        </Horizontal>
      )}
    </Vertical>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    height: 44,
    maxWidth: 500,
    marginBottom: theme.spacing.xs,
  },
  content: {
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
  },
  list: {
    width: "100%",
    minHeight: 44,
  },
  dragHandle: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  grid: {
    width: "100%",
    alignItems: "stretch",
  },
  fullWidth: {
    width: "100%",
  },
}));
