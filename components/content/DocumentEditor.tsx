import { CoreSchema, ReadFieldOutput, updateItem } from "@directus/sdk";
import { Controller, Form, FormProvider, useForm } from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "../form/style";
import { Button } from "../display/button";
import { Fragment, useContext, useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../display/collapsible";
import { ReactNode } from "react";
import { ChevronRight } from "../icons/Chevron";
import { Input } from "../form/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCollection,
  useDocument,
  useFields,
} from "@/state/queries/directus/collection";
import { Select } from "../form/select";
import { TextArea } from "../form/textarea";
import { RichText } from "../form/richtext";
import { View } from "react-native";
import {
  RelativePathString,
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { Check, Trash } from "../icons";
import { M2OInput } from "../form/m2o-input";
import { ImageInput } from "../form/image-input";
import { M2MInput } from "../form/m2m-input";
import { coreCollections } from "@/state/queries/directus/core";
import { mutateDocument } from "@/state/actions/mutateItem";
import { InputHash } from "../form/input-hash";
import { ModalContext } from "../display/modal";
import { PortalOutlet } from "../layout/Portal";
import { NumberInput } from "../form/number-input";
import { JsonInput } from "../form/json";
import { DirectusIcon } from "../display/directus-icon";
import { Horizontal } from "../layout/Stack";
import { Accordion } from "../display/accordion";
import { each, filter, find, isEmpty, map } from "lodash";
import { DateTime } from "../form/datetime";
import { ColorPicker } from "../form/color";
import EventBus from "@/utils/mitt";
import { queryClient } from "@/utils/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { directusToZod } from "@/utils/zod/directusToZod";
import { z } from "zod";
import { generateZodSchema } from "@/utils/zod/generateZodSchema";
import { DirectusError, DirectusErrorResponse } from "@/types/directus";
export const DocumentEditor = ({
  collection,
  id,
  defaultValues = {},
  onSave,
}: {
  collection: keyof CoreSchema;
  id?: number | string;
  defaultValues?: Record<string, unknown>;
  onSave?: (doc: Record<string, unknown>) => void;
  onDelete?: () => void;
}) => {
  const [revision, setRevision] = useState<number>(0);
  const modalContext = useContext(ModalContext);
  const { styles } = useStyles(formStyles);
  const { directus } = useAuth();

  const { data: fields } = useFields(collection as keyof CoreSchema);

  const context = useForm<Record<string, unknown>>();
  const {
    control,
    formState: { isDirty, isValid, isSubmitting, dirtyFields },
  } = context;

  const { data } = useCollection(collection as keyof CoreSchema);
  const {
    data: document,
    error,
    isFetching,
    isError,
  } = useDocument({
    collection: collection as keyof CoreSchema,
    id,
  });

  const { mutateAsync: updateDoc } = mutateDocument(
    collection as keyof CoreSchema,
    id as number
  );

  console.log({ isDirty, isValid, isSubmitting });

  const getDocumentFieldValues = (doc?: Record<string, unknown>) => {
    return fields?.reduce((acc, field) => {
      acc[field.field as keyof CoreSchema] =
        doc?.[field.field as keyof CoreSchema];
      return acc;
    }, {} as Record<string, unknown>);
  };

  useEffect(() => {
    if (isError) {
      console.log({ error });
    }
  }, [isError, error]);

  useEffect(() => {
    /** if a document is fetched, reset the form with the document */
    if (document) {
      context.reset(
        getDocumentFieldValues(document as Record<string, unknown>)
      );
      console.log("reset", document);
      setRevision((state) => state + 1);
    }
  }, [document]);

  const getLabel = (field: string) =>
    fields
      ?.find((f) => f.field === field)
      ?.meta.translations?.find((t) => t.language === "nl-NL")?.translation ||
    field;

  const mapFields = (parent?: string): ReactNode =>
    fields

      ?.sort((a, b) => ((a.meta.sort || 0) < (b.meta.sort || 0) ? -1 : 1))
      .map((item) => {
        const defaultProps = {
          key: item.field,
          label: getLabel(item.field),
          helper: item.meta.note || undefined,
          disabled: item.meta.readonly,
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
          item.meta.hidden
        ) {
          return null;
        } else if (item.meta.interface === "group-accordion") {
          return (
            <Accordion key={item.field}>{mapFields(item.meta.field)}</Accordion>
          );
        } else if (
          item.meta.interface &&
          ["group-raw", "group-detail"].includes(item.meta.interface)
        ) {
          return (
            <Collapsible key={item.field}>
              <CollapsibleTrigger
                color={item?.meta.options?.headerColor}
                prepend={<DirectusIcon name={item?.meta.options?.headerIcon} />}
              >
                {getLabel(item.field)}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <View style={styles.form}>{mapFields(item.meta.field)}</View>
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
                          value={value as string}
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
                        <RichText
                          {...defaultProps}
                          onChange={onChange}
                          value={value as string}
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
                          docId={id}
                          error={error?.message}
                        />
                      )}
                    />
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
                    <JsonInput
                      {...defaultProps}
                      onChange={onChange}
                      value={value as string}
                      error={error?.message}
                    />
                  )}
                />
              );

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

  type DirtyFieldsType =
    | boolean
    | null
    | {
        [key: string]: DirtyFieldsType;
      }
    | DirtyFieldsType[];

  function getDirtyValues<T extends Record<string, any>>(
    dirtyFields: Partial<Record<keyof T, DirtyFieldsType>>,
    values: T
  ): Partial<T> {
    const dirtyValues = Object.keys(dirtyFields).reduce((prev, key) => {
      const value = dirtyFields[key];
      if (!value) {
        return prev;
      }
      const isObject = typeof value === "object";
      const isArray = Array.isArray(value);
      const nestedValue =
        isObject && !isArray
          ? getDirtyValues(value as Record<string, any>, values[key])
          : values[key];
      return { ...prev, [key]: isArray ? values[key] : nestedValue };
    }, {} as Partial<T>);
    return dirtyValues;
  }

  const handleSubmit = async (body: Record<string, unknown>) => {
    const data = getDirtyValues(dirtyFields, body);

    await updateDoc(data, {
      onSuccess: (updatedDoc) => {
        context.reset(updatedDoc);

        onSave?.(updatedDoc as Record<string, unknown>);

        queryClient.invalidateQueries({
          queryKey: ["document", collection, id],
        });
        queryClient.invalidateQueries({
          queryKey: ["documents", collection],
        });
      },
      onError: (error: any) => {
        const errors = error.errors as DirectusErrorResponse;
        each(errors, (error) => {
          console.log(error);
          context.setError(error.extensions.field, {
            message: error.message,
          });
        });
      },
    });
  };

  const SubmitButton = () => (
    <Button
      rounded
      loading={context.formState.isSubmitting}
      disabled={
        !context.formState.isDirty ||
        !context.formState.isValid ||
        context.formState.isSubmitting
      }
      onPress={context.handleSubmit(handleSubmit)}
    >
      <Check />
    </Button>
  );

  if (isFetching) {
    return null;
  }
  return (
    <FormProvider key={revision + collection + id} {...context}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Horizontal>
              <Button rounded variant="soft">
                <Trash />
              </Button>
              <SubmitButton />
            </Horizontal>
          ),
        }}
      />
      <PortalOutlet name="modal-header">
        <SubmitButton />
      </PortalOutlet>
      <View style={styles.form}>{mapFields()}</View>
    </FormProvider>
  );
};
