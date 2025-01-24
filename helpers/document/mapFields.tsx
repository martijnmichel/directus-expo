import { Accordion } from "@/components/display/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/display/collapsible";
import { DirectusIcon } from "@/components/display/directus-icon";
import { CheckboxGroup } from "@/components/interfaces/checkbox-group";
import { ColorPicker } from "@/components/interfaces/color";
import { DateTime } from "@/components/interfaces/datetime";
import { ImageInput } from "@/components/interfaces/image-input";
import { Input } from "@/components/interfaces/input";
import { M2MInput } from "@/components/interfaces/m2m-input";
import { M2OInput } from "@/components/interfaces/m2o-input";
import { NumberInput } from "@/components/interfaces/number-input";
import { RadioButtonGroup } from "@/components/interfaces/radio-button-group";
import { RepeaterInput } from "@/components/interfaces/repeater";
import { Select } from "@/components/interfaces/select";
import { SelectMulti } from "@/components/interfaces/select-multi";
import { formStyles } from "@/components/interfaces/style";
import { TextArea } from "@/components/interfaces/textarea";
import { Toggle } from "@/components/interfaces/toggle";
import {
  useItemPermissions,
  usePermissions,
} from "@/state/queries/directus/core";
import {
  CoreSchema,
  readItemPermissions,
  ReadUserPermissionsOutput,
} from "@directus/sdk";
import { ReadFieldOutput } from "@directus/sdk";
import { ReactNode } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { getCanCreate, getCanUpdate } from "./fieldPermissions";
import { isFieldAllowed } from "../permissions/isFieldAllowed";
import { TinyMCEEditor } from "@/components/interfaces/tinymce";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { H2, H3 } from "@/components/display/typography";
import { Divider } from "@/components/layout/divider";
import { StyleSheetWithSuperPowers } from "react-native-unistyles/lib/typescript/src/types";

import { TagsInput } from "@/components/interfaces/tags-input";
import { FileInput } from "@/components/interfaces/file-input";
import { FilesMultiInput } from "@/components/interfaces/files-multi-input";
import { Slider } from "@/components/interfaces/slider";

export const mapFields = ({
  fields,
  parent,
  control,
  docId,
  canUpdateItem = true,
  permissions,
  styles,
}: {
  fields?: ReadFieldOutput<CoreSchema>[];
  parent?: string;
  control: UseFormReturn["control"];
  docId?: number | string | "+";
  canUpdateItem?: boolean;
  permissions?: ReadUserPermissionsOutput;
  styles?: any;
}): ReactNode => {
  const getLabel = (field: string) =>
    fields
      ?.find((f) => f.field === field)
      ?.meta.translations?.find((t) => t.language === "nl-NL")?.translation ||
    field;

  const filtered = parent
    ? fields?.filter((f) => f.meta.group === parent)
    : fields;

  return filtered
    ?.sort((a, b) => ((a.meta.sort || 0) < (b.meta.sort || 0) ? -1 : 1))
    .map((item) => {
      const canCreate = !!permissions
        ? isFieldAllowed(item.field, "create", permissions?.[item.collection])
        : true;

      const canUpdate = !!permissions
        ? isFieldAllowed(item.field, "update", permissions?.[item.collection])
        : true;

      const defaultProps = {
        label: getLabel(item.field),
        helper: item.meta.note || undefined,
        disabled:
          item.meta.readonly ||
          (docId === "+" && !canCreate) ||
          (docId !== "+" && !canUpdate) ||
          (docId !== "+" && !canUpdateItem),
        placeholder: item.meta.options?.placeholder,
        prepend: item.meta.options?.iconLeft && (
          <DirectusIcon name={item.meta.options.iconLeft} />
        ),
        append: item.meta.options?.iconRight && (
          <DirectusIcon name={item.meta.options.iconRight} />
        ),
      };
      if (
        (parent && item.meta.group !== parent) ||
        (!!item.meta.group && !parent) ||
        item.meta.hidden ||
        !item.meta.interface
      ) {
        return null;
      } else if (item.meta.interface === "group-accordion") {
        return (
          <Accordion key={item.field}>
            {mapFields({
              parent: item.meta.field,
              fields,
              control,
              canUpdateItem,
              permissions,
              styles,
            })}
          </Accordion>
        );
      } else if (
        item.meta.interface &&
        item.type === "alias" &&
        ["group-raw", "group-detail"].includes(item.meta.interface)
      ) {
        return (
          <Collapsible key={item.field}>
            <CollapsibleTrigger
              variant="accordion"
              color={item?.meta.options?.headerColor}
              prepend={<DirectusIcon name={item?.meta.options?.headerIcon} />}
            >
              {getLabel(item.field)}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <View style={styles.form}>
                {mapFields({
                  parent: item.meta.field,
                  fields,
                  control,
                  canUpdateItem,
                  permissions,
                  styles,
                })}
              </View>
            </CollapsibleContent>
          </Collapsible>
        );
      } else {
        // Type-based switch statement from previous code
        switch (item.type) {
          case "string":
          case "text":
            switch (item.meta.interface) {
              case "input":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={(value as string) || ""}
                        autoCapitalize="none"
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "input-multiline":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <TextArea
                        {...defaultProps}
                        onChangeText={onChange}
                        value={value as string}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "input-rich-text-html":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({ field: { onChange, value } }) => (
                      <TinyMCEEditor
                        {...defaultProps}
                        onChange={onChange}
                        value={value as string}
                        item={item}
                      />
                    )}
                  />
                );

              case "system-token":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={"**********"}
                        autoCapitalize="none"
                        disabled
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "select-color":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <ColorPicker
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as string}
                        presets={item.meta.options?.presets}
                        opacity={item.meta.options?.opacity}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "select-dropdown":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Select
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as string}
                        options={item.meta.options?.choices || []}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "select-radio":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <RadioButtonGroup
                        {...defaultProps}
                        onChange={onChange}
                        value={value as string}
                        options={item.meta.options?.choices || []}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "select-dropdown-m2o":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <M2OInput
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as string}
                        item={item}
                        error={error?.message}
                      />
                    )}
                  />
                );

              default:
                // Fallback for string type
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={(value as string) || ""}
                        autoCapitalize="none"
                        disabled={!!item.meta.interface}
                        helper="Fallback"
                        error={error?.message}
                      />
                    )}
                  />
                );
            }

          case "integer":
          case "float":
          case "decimal":
          case "bigInteger":
            switch (item.meta.interface) {
              case "input":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <NumberInput
                        {...defaultProps}
                        onChangeText={onChange}
                        value={value as string}
                        autoCapitalize="none"
                        keyboardType="numeric"
                        min={item.meta.options?.min}
                        max={item.meta.options?.max}
                        step={item.meta.options?.step}
                        float={item.type === "float"}
                        decimal={item.type === "decimal"}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "select-dropdown-m2o":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <M2OInput
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as string}
                        item={item}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "slider":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Slider
                        {...defaultProps}
                        onChange={onChange}
                        value={value as number}
                        min={item.meta.options?.min}
                        max={item.meta.options?.max}
                        step={item.meta.options?.step}
                        error={error?.message}
                      />
                    )}
                  />
                );

              default:
                // Fallback for string type
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={value as string}
                        autoCapitalize="none"
                        disabled
                        helper="Fallback"
                        error={error?.message}
                      />
                    )}
                  />
                );
            }

          case "hash":
            switch (item.meta.interface) {
              case "input-hash":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={value as string}
                        autoCapitalize="none"
                        autoComplete="new-password"
                        textContentType="password"
                        append={<DirectusIcon name="lock" />}
                      />
                    )}
                  />
                );
              default:
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={value as string}
                        autoCapitalize="none"
                        secureTextEntry
                        disabled
                        helper="Fallback"
                      />
                    )}
                  />
                );
            }
          case "uuid":
            switch (item.meta.interface) {
              case "file-image":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <ImageInput
                        {...defaultProps}
                        onChange={onChange}
                        value={value as string}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "file":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <FileInput
                        {...defaultProps}
                        onChange={onChange}
                        value={value as string}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "input":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChange={onChange}
                        value={value as string}
                        error={error?.message}
                      />
                    )}
                  />
                );
              default:
                // Fallback for string type
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={value as string}
                        autoCapitalize="none"
                        disabled
                        helper="Fallback"
                        error={error?.message}
                      />
                    )}
                  />
                );
            }

          case "alias":
            switch (item.meta.interface) {
              case "list-m2o":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <M2OInput
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as string}
                        item={item}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "list-m2m":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <M2MInput
                        {...defaultProps}
                        onChange={onChange}
                        value={value as number[]}
                        item={item}
                        docId={docId}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "files":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <FilesMultiInput
                        {...defaultProps}
                        onChange={onChange}
                        value={value as number[]}
                        item={item}
                        docId={docId}
                        error={error?.message}
                      />
                    )}
                  />
                );
              case "presentation-divider":
                return (
                  <Vertical
                    spacing="xs"
                    style={{ marginTop: 20 }}
                    key={item.field}
                  >
                    <Horizontal>
                      {item.meta.options?.icon && (
                        <DirectusIcon size={32} name={item.meta.options.icon} />
                      )}
                      <H3 numberOfLines={1}>{item.meta.options?.title}</H3>
                    </Horizontal>
                    <Divider />
                  </Vertical>
                );
            }

          case "dateTime":
            switch (item.meta.interface) {
              case "datetime":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <DateTime
                        {...defaultProps}
                        onValueChange={onChange}
                        value={String(value)}
                        error={error?.message}
                      />
                    )}
                  />
                );
              default:
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={String(value)}
                        autoCapitalize="none"
                        disabled
                        helper="Fallback"
                        error={error?.message}
                      />
                    )}
                  />
                );
            }
          case "json":
            switch (item.meta.interface) {
              case "select-multiple-dropdown":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <SelectMulti
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as (string | number)[]}
                        options={item.meta.options?.choices || []}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "select-multiple-checkbox":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <CheckboxGroup
                        {...defaultProps}
                        onChange={onChange}
                        value={value as (string | number)[]}
                        options={item.meta.options?.choices || []}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "list":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <RepeaterInput
                        {...defaultProps}
                        onChange={onChange}
                        value={value as (string | number)[]}
                        item={item}
                        error={error?.message}
                      />
                    )}
                  />
                );

              case "tags":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <TagsInput
                        {...defaultProps}
                        sortByAlphabet={item.meta.options?.alphabetize}
                        presets={item.meta.options?.presets}
                        onChange={onChange}
                        value={value as string[]}
                        error={error?.message}
                      />
                    )}
                  />
                );

              default:
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Input
                        {...defaultProps}
                        onChangeText={onChange}
                        value={String(value)}
                        autoCapitalize="none"
                        disabled
                        helper="Fallback"
                        error={error?.message}
                      />
                    )}
                  />
                );
            }

          case "boolean":
            switch (item.meta.interface) {
              case "boolean":
                return (
                  <Controller
                    key={item.field}
                    control={control}
                    rules={{ required: item.meta.required }}
                    name={item.field as keyof CoreSchema[keyof CoreSchema]}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Toggle
                        {...defaultProps}
                        onValueChange={onChange}
                        value={value as boolean}
                        error={error?.message}
                        info={item.meta.options?.label}
                      />
                    )}
                  />
                );
            }

          default:
            // Final fallback for unknown types
            console.warn(
              `Unhandled field type: ${item.type} with interface: ${item.meta.interface}`
            );
            return (
              <Controller
                key={item.field}
                control={control}
                rules={{ required: item.meta.required }}
                name={item.field as keyof CoreSchema[keyof CoreSchema]}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <Input
                    {...defaultProps}
                    onChangeText={onChange}
                    value={String(value)}
                    autoCapitalize="none"
                    disabled
                    helper="Fallback"
                    error={error?.message}
                  />
                )}
              />
            );
        }
      }
    });
};
