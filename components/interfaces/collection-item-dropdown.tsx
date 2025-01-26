import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { CoreSchema, ReadFieldOutput, readItems } from "@directus/sdk";
import { Select } from "./select";
import { parseTemplate } from "@/helpers/document/template";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { router } from "expo-router";
import { Horizontal, Vertical } from "../layout/Stack";
import { formStyles } from "./style";
import { useStyles } from "react-native-unistyles";
import { ChevronDown, X } from "../icons";
import { objectToBase64 } from "@/helpers/document/docToBase64";
import { useDocument, useFields } from "@/state/queries/directus/collection";
import { Center } from "../layout/Center";
import EventBus from "@/utils/mitt";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { Text } from "../display/typography";

interface Schema {
  [key: string]: any;
}

interface M2OInputProps {
  item: ReadFieldOutput<Schema>;
  value?: { key: number; collection: string };
  onValueChange?: (value: { key: number; collection: string }) => void;
  label?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
}

export const CollectionItemDropdown = ({
  item,
  value,
  onValueChange,
  label,
  error,
  helper,
  disabled,
}: M2OInputProps) => {
  const { styles, theme } = useStyles(formStyles);

  const collection = item.meta.options?.selectedCollection as any;

  const { data: fields } = useFields(collection as keyof CoreSchema);

  useEffect(() => {
    EventBus.on("m2o:pick", (data) => {
      console.log(data);
      if (data.field === item.field) {
        onValueChange?.({
          key: Number(data.data[getPrimaryKey(fields) as any]),
          collection,
        });
      }
    });

    return () => {
      EventBus.off("m2o:pick", (data) => {
        console.log(data);
      });
    };
  }, [fields]);

  const Item = () => {
    const { data } = useDocument({
      collection,
      id: value?.key,
      options: {
        fields: [`*`],
      },
    });

    return (
      <Text numberOfLines={1}>
        {parseTemplate(item.meta?.options?.template || "", data)}
      </Text>
    );
  };

  return (
    <View style={styles.formControl}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <Pressable
          style={[
            styles.input,
            { display: "flex", flexDirection: "row", alignItems: "center" },
          ]}
          disabled={disabled}
          onPress={() => {
            router.push({
              pathname: `/modals/m2o/[collection]/pick`,
              params: {
                collection,
                data: objectToBase64({
                  field: item.field,
                  value: value,
                  filter: item.meta.options?.filter || [],
                }),
              },
            });
          }}
        >
          <Item />
        </Pressable>
        <View style={styles.append}>
          <ChevronDown color={theme.colors.textPrimary} />
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
