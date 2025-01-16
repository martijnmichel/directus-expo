import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { Button } from "../display/button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Link } from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { List } from "../display/list";
import EventBus, { MittEvents } from "@/utils/mitt";
import { Trash } from "../icons";
import { Edit } from "../icons";

interface RepeaterInputProps {
  item: ReadFieldOutput<CoreSchema>;
  value: any[];
  onChange: (value: any[]) => void;
  label?: string;
  error?: string;
  helper?: string;
}

export const RepeaterInput = ({
  item,
  label,
  error,
  helper,
  value: valueProp = [],
  ...props
}: RepeaterInputProps) => {
  const { styles: formControlStyles } = useStyles(formStyles);
  const { styles } = useStyles(stylesheet);

  useEffect(() => {
    const addRepeaterItem = (event: MittEvents["repeater:add"]) => {
      if (event.field === item.field) {
        props.onChange([...valueProp, event.data]);
      }
    };

    EventBus.on("repeater:add", addRepeaterItem);
    return () => {
      EventBus.off("repeater:add", addRepeaterItem);
    };
  }, [valueProp, props.onChange]);

  return (
    <Vertical spacing="xs">
      {label && <Text style={formControlStyles.label}>{label}</Text>}
      <List>
        {valueProp.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.content}>{JSON.stringify(item)}</Text>

            <Button variant="ghost" rounded>
              <Edit />
            </Button>

            <Button
              variant="ghost"
              onPress={() => {
                const newValue = [...valueProp];
                newValue.splice(index, 1);
                props.onChange(newValue);
              }}
              rounded
            >
              <Trash />
            </Button>
          </View>
        ))}
      </List>

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
          pathname: `/modals/repeater`,
          params: {
            fields: JSON.stringify(item.meta?.options?.fields || []),
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
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    fontFamily: theme.typography.body.fontFamily,
  },
}));
