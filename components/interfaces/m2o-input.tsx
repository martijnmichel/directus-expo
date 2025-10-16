import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { CoreSchema, ReadFieldOutput, readItems } from "@directus/sdk";
import { Select } from "./select";
import {
  getFieldsFromTemplate,
  parseRepeaterTemplate,
  parseTemplate,
} from "@/helpers/document/template";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../display/button";
import { router } from "expo-router";
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
import EventBus from "@/utils/mitt";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { Text } from "../display/typography";
import { DirectusIcon } from "../display/directus-icon";
import { InterfaceProps } from ".";
import { filter, map } from "lodash";
import { FieldValue } from "../content/FieldValue";

interface Schema {
  [key: string]: any;
}

type M2OInputProps = InterfaceProps<{
  value?: string | number;
  onValueChange?: (value: string | number | null) => void;
}>;

export const M2OInput = ({
  item,
  value,
  uuid,
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

  const { styles, theme } = useStyles(formStyles);

  const { data: fields } = useFields(item.schema.foreign_key_table as any);
  const pk = getPrimaryKey(fields);
  useEffect(() => {
    EventBus.on("m2o:pick", (data) => {
      console.log({ data, fields, pk });
      if (data.field === item.field && data.uuid === uuid) {
        onValueChange?.(data.data[pk as any]);
      }
    });

    return () => {
      EventBus.off("m2o:pick", (data) => {
        console.log(data);
      });
    };
  }, [fields, pk, item.field, uuid]);

  const TemplateField = ({
    data,
    field,
  }: {
    data: Record<string, any>;
    field: string;
  }) => {
    const isArray = Array.isArray(data?.[field]);
    const value = data?.[field];
    console.log({ data, field, isArray, value });
    return isArray ? (
      <Horizontal>
        {map(data?.[field], (item) => {
          return <TemplateField data={item} field={field} />;
        })}
      </Horizontal>
    ) : (
      <Text>{value}</Text>
    );
  };

  const Item = () => {
    const { data: collection } = useCollection(
      item.schema.foreign_key_table as any
    );
    const relatedFields = getFieldsFromTemplate(item.meta?.options?.template);
    const displayTemplate = `${
      item.meta?.display_options?.template || collection?.meta.display_template
    }`
      .replace("{{", "")
      .replace("}}", "")
      .trim();

    const { data, isLoading, refetch } = useDocument({
      collection: item.schema.foreign_key_table as any,
      id: value,
      options: {
        fields: relatedFields.length
          ? map(
              filter(relatedFields, (f) => f.type === "transform"),
              (field) => field.name
            )
          : [`*`, ...(displayTemplate ? [displayTemplate] : [])],
      },
      query: {
        retry: false,
        enabled: false,
      },
    });

    useEffect(() => {
      if (value) {
        refetch();
      }
    }, [value]);

    console.log({
      relatedFields,
      data,
      collection,
      pkField: fields?.find((f) => f.schema.is_primary_key),
      displayTemplate,
      tmpl: parseTemplate(displayTemplate as string, data, fields),
      tmpl2: parseRepeaterTemplate(displayTemplate as string, data as any),
    });

    if (isLoading) return null;

    if (relatedFields.length) {
      map(relatedFields, (field) => {
        return (
          <FieldValue
            field={fields?.find(
              (f) => "name" in field && f.field === field?.name
            )}
            transform={field}
            data={data}
          />
        );
      });
    } else if ((item.meta.display === "related-values" || collection?.meta.display_template) && displayTemplate) {
      return (
        <Text>
          {displayTemplate.split(".").map((field, index) => {

            const value = data?.[field];
            const previousField = displayTemplate.split(".").slice(0, index).join(".");
            const isArray = Array.isArray(data?.[previousField]);
            console.log({ data, field, isArray, value, previousField });
            return isArray ? (
              <Text>
                {map(data?.[previousField] as any, (item) => {
                  return `${item?.[field]}`;
                }).join(", ")}
              </Text>
            ) : (
              null
            );
          })}
        </Text>
      );
    } else {
      return (
        <Text>
          {
            data?.[
              fields?.find((f) => f.schema.is_primary_key)
                ?.field as keyof typeof data
            ] as string
          }
        </Text>
      );
    }
  };

  console.log({ m2o: item, fields, value });

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
                  uuid: uuid as string,
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
