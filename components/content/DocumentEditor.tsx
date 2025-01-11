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
} from "expo-router";
import { Check } from "../icons";
import { M2OInput } from "../form/m2o-input";
import { ImageInput } from "../form/image-input";
import { M2MInput } from "../form/m2m-input";
import { coreCollections } from "@/state/queries/directus/core";
import { mutateDocument } from "@/state/actions/mutateItem";
import { InputHash } from "../form/input-hash";
import { ModalContext } from "../display/modal";
import { PortalOutlet } from "../layout/Portal";
export const DocumentEditor = ({
  collection,
  id,
  onSave,
}: {
  collection: keyof CoreSchema;
  id: number | string;
  onSave?: (doc: CoreSchema<keyof CoreSchema>) => void;
}) => {
  const [revision, setRevision] = useState<number>(0);
  const modalContext = useContext(ModalContext);
  const { styles } = useStyles(formStyles);
  const { directus } = useAuth();
  const context = useForm<CoreSchema<keyof CoreSchema>>();
  const { control } = context;

  const { data } = useCollection(collection as keyof CoreSchema);
  const {
    data: document,
    error,
    isFetching,
    isError,
  } = useDocument(collection as keyof CoreSchema, id);
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const { mutateAsync: updateDoc } = mutateDocument(
    collection as keyof CoreSchema,
    id as number
  );

  const getLabel = (field: string) =>
    fields
      ?.find((f) => f.field === field)
      ?.meta.translations?.find((t) => t.language === "nl-NL")?.translation ||
    field;

  const mapFields = (parent?: string): ReactNode =>
    fields

      ?.sort((a, b) => ((a.meta.sort || 0) < (b.meta.sort || 0) ? -1 : 1))
      .map((item) => {
        if (
          (parent && item.meta.group !== parent) ||
          (!!item.meta.group && !parent)
        ) {
          return null;
        } else if (item.meta.interface === "group-accordion") {
          return (
            <Fragment key={item.field}>{mapFields(item.meta.field)}</Fragment>
          );
        } else if (
          item.meta.interface &&
          ["group-raw", "group-detail"].includes(item.meta.interface)
        ) {
          return (
            <Collapsible key={item.field}>
              <CollapsibleTrigger>{getLabel(item.field)}</CollapsibleTrigger>
              <CollapsibleContent>
                <View style={styles.form}>{mapFields(item.meta.field)}</View>
              </CollapsibleContent>
            </Collapsible>
          );
        } else if (item.meta.interface === "input") {
          if (item.type === "string") {
            return (
              <Controller
                key={item.field}
                control={control}
                rules={{ required: item.meta.required }}
                name={item.field as keyof CoreSchema[keyof CoreSchema]}
                render={({ field: { onChange, value } }) => (
                  <Input
                    onChangeText={onChange}
                    value={value as string}
                    helper={item.meta.note || undefined}
                    placeholder={item.meta.display_options?.placeholder}
                    label={getLabel(item.field)}
                    autoCapitalize="none"
                  />
                )}
              />
            );
          } else if (item.type === "number") {
            return (
              <Controller
                key={item.field}
                control={control}
                rules={{ required: item.meta.required }}
                name={item.field as keyof CoreSchema[keyof CoreSchema]}
                render={({ field: { onChange, value } }) => (
                  <Input
                    onChangeText={onChange}
                    value={value as string}
                    helper={item.meta.note || undefined}
                    placeholder={item.meta.display_options?.placeholder}
                    label={getLabel(item.field)}
                    autoCapitalize="none"
                    keyboardType="numeric"
                  />
                )}
              />
            );
          }
        } else if (item.meta.interface === "input-hash") {
          return (
            <Controller
              key={item.field}
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <InputHash
                  onChangeText={onChange}
                  value={value as string}
                  helper={item.meta.note || undefined}
                  placeholder={item.meta.display_options?.placeholder}
                  label={getLabel(item.field)}
                  autoCapitalize="none"
                />
              )}
            />
          );
        } else if (item.meta.interface === "select-dropdown") {
          return (
            <Controller
              key={item.field}
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <Select
                  options={
                    item.meta.display_options?.choices ||
                    item.meta.options?.choices ||
                    []
                  }
                  onValueChange={onChange}
                  value={value as string}
                  helper={item.meta.note || undefined}
                  placeholder={item.meta.display_options?.placeholder}
                  label={getLabel(item.field)}
                />
              )}
            />
          );
        } else if (item.meta.interface === "input-multiline") {
          return (
            <Controller
              key={item.field}
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <TextArea
                  onChangeText={onChange}
                  value={value as string}
                  placeholder={item.meta.display_options?.placeholder}
                  label={getLabel(item.field)}
                  autoCapitalize="none"
                  helper={item.meta.note || undefined}
                />
              )}
            />
          );
        } else if (item.meta.interface === "input-rich-text-html") {
          return (
            <Controller
              key={item.field}
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <RichText
                  onChange={onChange}
                  value={value as string}
                  label={getLabel(item.field)}
                  helper={item.meta.note || undefined}
                />
              )}
            />
          );
        } else if (item.meta.interface === "select-dropdown-m2o") {
          return (
            <Controller
              key={item.field}
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <M2OInput
                  item={item}
                  value={value as string}
                  onValueChange={onChange}
                  label={getLabel(item.field)}
                  helper={item.meta.note || undefined}
                />
              )}
            />
          );
        } else if (item.meta.interface === "file-image") {
          return (
            <Controller
              key={item.field}
              control={control}
              rules={{ required: item.meta.required }}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <ImageInput
                  label={getLabel(item.field)}
                  helper={item.meta.note || undefined}
                  value={value as string}
                  onChange={onChange}
                />
              )}
            />
          );
        } else if (item.meta.interface === "list-m2m") {
          return (
            <Controller
              key={item.field}
              control={control}
              name={item.field as keyof CoreSchema[keyof CoreSchema]}
              render={({ field: { onChange, value } }) => (
                <M2MInput
                  value={value as number[]}
                  onChange={onChange}
                  item={item}
                  label={getLabel(item.field)}
                  helper={item.meta.note || undefined}
                />
              )}
            />
          );
        }
      });

  const handleSubmit = async (body: CoreSchema<keyof CoreSchema>) => {
    await updateDoc(body, {
      onSuccess: (updatedDoc) => {
        context.reset(updatedDoc as CoreSchema<keyof CoreSchema>);

        onSave?.(updatedDoc as CoreSchema<keyof CoreSchema>);
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
          headerRight: SubmitButton,
        }}
      />
      <PortalOutlet name="modal-header">
        <SubmitButton />
      </PortalOutlet>
      <View style={styles.form}>{mapFields()}</View>
    </FormProvider>
  );
};
