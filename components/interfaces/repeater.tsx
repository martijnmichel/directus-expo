import React, { useEffect, useState } from "react";
import { Text, View, FlatList } from "react-native";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Link } from "expo-router";
import { Vertical } from "../layout/Stack";
import {
  DndProvider,
  Draggable,
  DndProviderProps,
} from "@mgcrea/react-native-dnd";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import EventBus, { MittEvents } from "@/utils/mitt";
import { DragIcon, Trash, Edit } from "../icons";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import { parseRepeaterTemplate } from "@/helpers/document/template";

interface RepeaterInputProps {
  item: ReadFieldOutput<CoreSchema>;
  value: any[];
  onChange: (value: any[]) => void;
  label?: string;
  error?: string;
  helper?: string;
  sortable?: boolean;
}

export const RepeaterInput = ({
  item,
  label,
  error,
  helper,
  value: items = [],
  sortable = true,
  onChange,
}: RepeaterInputProps) => {
  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles } = useStyles(stylesheet);
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleDragEnd: DndProviderProps["onDragEnd"] = ({ active, over }) => {
    "worklet";
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string, 10);
      const newIndex = parseInt(over.id as string, 10);

      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);

      setLocalItems(newItems);
      onChange(newItems);
    }
  };

  const getDisplayValue = (repeatItem: any) => {
    const format = item.meta?.display_options?.format;
    return parseRepeaterTemplate(format, repeatItem);
  };

  const renderItem = ({
    item: repeaterItem,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <Draggable
      id={index.toString()}
      disabled={!sortable}
      style={styles.listItem}
    >
      <View style={styles.dragHandle}>
        <DragIcon />
      </View>

      <Text style={styles.content}>{getDisplayValue(repeaterItem)}</Text>

      <Link
        href={{
          pathname: `/modals/repeater/edit`,
          params: {
            data: objectToBase64(item),
            fields: objectToBase64(item.meta?.options?.fields || []),
            item_field: item.field,
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
        onPress={() => {
          const newValue = [...items];
          newValue.splice(index, 1);
          onChange(newValue);
        }}
        rounded
      >
        <Trash />
      </Button>
    </Draggable>
  );

  useEffect(() => {
    const handleRepeaterAdd = (data: any) => {
      if (data.field === item.field) {
        const newValue = [...items, data.value];
        onChange(newValue);
      }
    };

    const handleRepeaterEdit = (data: any) => {
      if (data.field === item.field) {
        const newValue = [...items];
        newValue[data.index] = data.value;
        onChange(newValue);
      }
    };

    EventBus.on("repeater:add", handleRepeaterAdd);

    return () => {
      EventBus.off("repeater:add", handleRepeaterAdd);
    };
  }, [item.field, items, onChange]);

  return (
    <Vertical spacing="xs">
      {label && <Text style={formControlStyles.label}>{label}</Text>}

      <GestureHandlerRootView style={styles.list}>
        <DndProvider onDragEnd={handleDragEnd}>
          <FlatList
            data={localItems}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={true}
          />
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

      <Link
        href={{
          pathname: `/modals/repeater/add`,
          params: {
            fields: objectToBase64(item.meta?.options?.fields || []),
            item_field: item.field,
          },
        }}
        asChild
      >
        <Button>Add Item</Button>
      </Link>
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
    flex: 0,
    width: "100%",
    minHeight: 100,
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
}));
