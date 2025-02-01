import React, { useEffect, useState, useCallback } from "react";
import { Text, View, FlatList } from "react-native";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Link } from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import {
  DndProvider,
  Draggable,
  DraggableGrid,
  DraggableStack,
  UniqueIdentifier,
} from "@mgcrea/react-native-dnd";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import EventBus, { MittEvents } from "@/utils/mitt";
import { DragIcon, Trash, Edit } from "../icons";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import { parseRepeaterTemplate } from "@/helpers/document/template";
import { runOnJS } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Alert } from "../display/alert";

interface RepeaterInputProps {
  item: ReadFieldOutput<CoreSchema>;
  value: any[] | undefined;
  onChange: (value: any[]) => void;
  label?: string;
  error?: string;
  uuid?: string;
  helper?: string;
  sortable?: boolean;
  disabled?: boolean;
}

export const RepeaterInput = ({
  item,
  label,
  error,
  uuid,
  helper,
  value = [],
  sortable = true,
  onChange,
  disabled,
}: RepeaterInputProps) => {
  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles } = useStyles(stylesheet);
  const { t } = useTranslation();

  const onOrderChange = useCallback(
    (order: UniqueIdentifier[]) => {
      console.log({ order });
      // Reorder the items based on the new order
      const newItems = order.map((index) => value[parseInt(index as string)]);
      console.log({ newItems });
      onChange?.(newItems);
    },
    [value, onChange]
  );

  const getDisplayValue = (repeatItem: any) => {
    const format = item.meta?.display_options?.format;
    return parseRepeaterTemplate(format, repeatItem);
  };

  useEffect(() => {
    EventBus.on("repeater:add", (data) => {
      if (data.field === item.field && data.uuid === uuid) {
        onChange([...value, data.data]);
      }
    });

    EventBus.on("repeater:edit", (data) => {
      if (data.field === item.field && data.uuid === uuid) {
        const newValue = [...value];
        newValue[data.index] = data.data;
        onChange(newValue);
      }
    });
  }, [onChange, item.field, uuid]);

  return (
    <Vertical spacing="xs">
      {label && <Text style={formControlStyles.label}>{label}</Text>}

      {!value?.length && (
        <Alert message={t("components.repeater.noItems")} status="info" />
      )}

      <GestureHandlerRootView>
        <DndProvider>
          <DraggableStack
            key={JSON.stringify(value)}
            direction="column"
            onOrderChange={onOrderChange}
          >
            {(value || []).map((repeaterItem, index) => (
              <Draggable
                key={index}
                id={index.toString()}
                disabled={!sortable}
                data={repeaterItem}
                style={[styles.listItem, styles.fullWidth]}
              >
                <View style={styles.dragHandle}>
                  <DragIcon />
                </View>

                <Text style={styles.content}>
                  {getDisplayValue(repeaterItem)}
                </Text>

                <Link
                  href={{
                    pathname: `/modals/repeater/edit`,
                    params: {
                      document: objectToBase64(repeaterItem),
                      fields: objectToBase64(item.meta?.options?.fields || []),
                      item_field: item.field,
                      uuid,
                      index: index,
                    },
                  }}
                  asChild
                >
                  <Button variant="ghost" rounded>
                    <Edit />
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
                  <Trash />
                </Button>
              </Draggable>
            ))}
          </DraggableStack>
        </DndProvider>
      </GestureHandlerRootView>

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
                fields: objectToBase64(item.meta?.options?.fields || []),
                item_field: item.field,
                uuid,
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
