import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "../interfaces/style";
import { FormProvider, useForm } from "react-hook-form";
import { mapFields } from "@/helpers/document/mapFields";
import { PortalOutlet } from "../layout/Portal";
import { Horizontal } from "../layout/Stack";
import { Check, Trash } from "../icons";
import { Stack } from "expo-router";
import { Button } from "../display/button";
import { useEffect } from "react";

export const RepeaterDocument = ({
  fields,
  defaultValues,
  onSave,
}: {
  fields: any[];
  defaultValues?: Record<string, any>;
  onSave?: (data: Record<string, any>) => void;
}) => {
  const { styles } = useStyles(formStyles);
  const context = useForm({ defaultValues });
  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty, isValid, isSubmitting, dirtyFields },
  } = context;

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues]);

  const submit = (data: Record<string, any>) => {
    onSave?.(data);
  };

  console.log({ context, fields });

  const SubmitButton = () => (
    <Button
      rounded
      loading={isSubmitting}
      disabled={!isDirty || !isValid || isSubmitting}
      onPress={handleSubmit(submit)}
    >
      <Check />
    </Button>
  );

  return (
    <FormProvider {...context}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Horizontal>
              <SubmitButton />
            </Horizontal>
          ),
        }}
      />
      <View style={styles.form}>
        {mapFields({
          fields,
          control,
          styles,
        })}
      </View>
    </FormProvider>
  );
};
