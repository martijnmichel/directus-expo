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
import { DirectusIcon } from "../display/directus-icon";

interface Schema {
  [key: string]: any;
}

interface M2OInputProps {
  item: ReadFieldOutput<Schema>;
  value?: string | number;
  onValueChange?: (value: string | number | null) => void;
  label?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
}

export const M2OInput = ({
  item,
  value,
  onValueChange,
  label,
  error,
  helper,
  disabled,
}: M2OInputProps) => {
  const { styles, theme } = useStyles(formStyles);

  const { data: fields } = useFields(item.schema.foreign_key_table as any);
  const pk = getPrimaryKey(fields);
  useEffect(() => {
    EventBus.on("m2o:pick", (data) => {
      console.log({ data, fields, pk });
      if (data.field === item.field) {
        onValueChange?.(data.data[pk as any]);
      }
    });

    return () => {
      EventBus.off("m2o:pick", (data) => {
        console.log(data);
      });
    };
  }, [fields, pk, item.field]);

  const Item = () => {
    const { data } = useDocument({
      collection: item.schema.foreign_key_table as any,
      id: value,
      options: {
        fields: [`*.*`],
      },
    });

    console.log({ data });

    return (
      <Text numberOfLines={1}>
        {parseTemplate(item.meta?.options?.template || "", data, fields)}
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
                collection: item.schema.foreign_key_table as string,
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
          <ChevronDown size={20} color={theme.colors.textPrimary} />
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
