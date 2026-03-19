import { useLocalSearchParams, router, Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
} from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Vertical, Horizontal } from "@/components/layout/Stack";
import { Text, Muted } from "@/components/display/typography";
import { Button } from "@/components/display/button";
import { Input } from "@/components/interfaces/input";
import { Select } from "@/components/interfaces/select";
import { DirectusIcon } from "@/components/display/directus-icon";
import { useAuth } from "@/contexts/AuthContext";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_TYPE_LATEST_ITEMS,
  APP_WIDGET_TYPES,
  APP_WIDGET_LATEST_ITEMS_SLOTS,
} from "@/constants/widget";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { FieldPathPicker } from "@/components/content/FieldPathPicker";
import { updateItem, createItem, deleteItem } from "@directus/sdk";
import { useFields } from "@/state/queries/directus/collection";
import type { LatestItemsWidgetConfig } from "@/widgets/latestItems/types";
import { useWidgetItems } from "@/state/widget/useWidgetItems";
import { writeLatestItemsWidgetConfigListToCache } from "@/widgets/latestItems/sync";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Trash } from "@/components/icons/Trash";
import { Check } from "@/components/icons";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "@/components/interfaces/style";
import { Divider } from "@/components/layout/divider";

type FormValues = {
  type: string;
  title: string;
  collection: string;
  sort: string;
  extra: {
    slots: Array<{ key: string; label: string; field: string }>;
  };
};

const DEFAULT_SLOTS = APP_WIDGET_LATEST_ITEMS_SLOTS.map((s) => ({
  key: s.key,
  label: "",
  field: "",
}));

const DEFAULT_VALUES: FormValues = {
  type: APP_WIDGET_TYPE_LATEST_ITEMS,
  title: "",
  collection: "",
  sort: "-date_updated",
  extra: { slots: DEFAULT_SLOTS },
};

export default function WidgetConfigEditorScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { styles } = useStyles(formStyles);
  const { directus, user } = useAuth();
  const queryClient = useQueryClient();
  const widgetItemsQuery = useWidgetItems({ enabled: true });
  const configs = widgetItemsQuery.data?.configs ?? [];
  const existing = useMemo(
    () => (isNew ? null : (configs.find((c) => c.id === id) ?? null)),
    [configs, id, isNew],
  );

  const { data: allCollections } = useCollections();
  const collectionOptions = useMemo(
    () =>
      (Array.isArray(allCollections) ? allCollections : [])
        .filter(
          (c: any) =>
            c &&
            typeof c.collection === "string" &&
            !c.collection.startsWith("directus_") &&
            !!c.meta &&
            !c.meta?.hidden &&
            !!c.schema,
        )
        .sort(
          (a: any, b: any) =>
            Number(a?.meta?.sort ?? 0) - Number(b?.meta?.sort ?? 0),
        )
        .map((c: any) => ({
          value: String(c.collection),
          text:
            getCollectionTranslation(c, i18n.language) ?? String(c.collection),
        })),
    [allCollections, i18n.language],
  );

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<FormValues>({ defaultValues: DEFAULT_VALUES });

  const type = useWatch({ control, name: "type" });
  const collection = useWatch({ control, name: "collection" });
  const sort = useWatch({ control, name: "sort" });
  const slots = useWatch({ control, name: "extra.slots" }) ?? DEFAULT_SLOTS;

  // Populate form when an existing config is loaded.
  useEffect(() => {
    if (!existing) return;
    reset({
      type: existing.type || APP_WIDGET_TYPE_LATEST_ITEMS,
      title: existing.title ?? "",
      collection: existing.collection ?? "",
      sort: existing.sort ?? "",
      extra: existing.extra?.slots?.length
        ? existing.extra
        : { slots: DEFAULT_SLOTS },
    });
  }, [existing, reset]);

  // Reset sort + slots when collection changes (but not on initial mount).
  const prevCollection = useRef<string | null>(null);
  useEffect(() => {
    if (prevCollection.current === null) {
      prevCollection.current = collection;
      return;
    }
    if (collection === prevCollection.current) return;
    prevCollection.current = collection;
    setValue("sort", "-date_updated");
    setValue("extra.slots", DEFAULT_SLOTS);
  }, [collection, setValue]);

  const { data: rawFields } = useFields(collection as any);
  const sortOptions = useMemo<Array<{ value: string; text: string }>>(() => {
    const list = Array.isArray(rawFields) ? rawFields : [];
    const opts: Array<{ value: string; text: string }> = [];
    for (const f of list) {
      if (!f || typeof f.field !== "string") continue;
      if (f.meta?.hidden) continue;
      if (String(f.field).startsWith("_")) continue;
      if (Array.isArray(f.meta?.special) && f.meta.special.length > 0) continue;
      const name = String(f.field);
      opts.push({ value: `-${name}`, text: `${name} (desc)` });
      opts.push({ value: name, text: `${name} (asc)` });
    }
    return opts;
  }, [rawFields]);

  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);

  const writeCacheFromWidgetConfigsQuery = async () => {
    const refreshed = await widgetItemsQuery.refetch();
    await writeLatestItemsWidgetConfigListToCache(
      (refreshed.data as any)?.configs ?? [],
    );
    queryClient.invalidateQueries({ queryKey: ["widgetConfigs"] as any });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!directus) throw new Error("Not authenticated with Directus");
      if (!user?.id) throw new Error("Not authenticated (missing user)");
      if (!values.collection?.trim()) throw new Error("Missing collection");

      const payload: any = {
        user_id: user.id,
        type: values.type || APP_WIDGET_TYPE_LATEST_ITEMS,
        collection: values.collection,
        sort: values.sort,
        filter: {},
        extra: values.extra ?? { slots: DEFAULT_SLOTS },
      };
      if (values.title?.trim()) payload.title = values.title.trim();

      if (isNew) {
        await directus.request(
          createItem(APP_WIDGET_CONFIG_COLLECTION as any, payload),
        );
      } else {
        await directus.request(
          updateItem(APP_WIDGET_CONFIG_COLLECTION as any, id, payload),
        );
      }
    },
    onSuccess: async () => {
      await writeCacheFromWidgetConfigsQuery();
      router.back();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!directus) throw new Error("Not authenticated with Directus");
      if (isNew) return;
      await directus.request(
        deleteItem<any, any>(
          APP_WIDGET_CONFIG_COLLECTION as any,
          id as any,
        ) as any,
      );
    },
    onSuccess: async () => {
      await writeCacheFromWidgetConfigsQuery();
      router.back();
    },
  });

  const confirmRemove = () => {
    if (isNew) return;
    const values = getValues();
    Alert.alert(
      t("widget.removeTitle"),
      t("widget.removeMessage", { name: values.title || values.collection }),
      [
        { text: t("button.cancel"), style: "cancel" },
        {
          text: t("widget.removeButton"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle: getValues("title") || t("pages.settings.widget.addWidgetSetup"),
          headerBackVisible: false,
          ...useHeaderStyles(),
          headerRight: () => (
            <Horizontal>
              {!isNew && (
                <View style={{ marginLeft: "auto" }}>
                  <Button
                    variant="soft"
                    colorScheme="error"
                    onPress={confirmRemove}
                    size="sm"
                    rounded
                    loading={deleteMutation.isPending}
                  >
                    <Trash />
                  </Button>
                </View>
              )}
              <Button
                onPress={handleSubmit((values) => saveMutation.mutate(values))}
                disabled={saveMutation.isPending || !collection?.trim()}
                size="sm"
                rounded
                loading={saveMutation.isPending}
              >
                <Check />
              </Button>
            </Horizontal>
          ),
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <Vertical spacing="md">
              <Select
                label="Type"
                value={type || APP_WIDGET_TYPE_LATEST_ITEMS}
                onValueChange={(val) => setValue("type", String(val))}
                options={APP_WIDGET_TYPES.map((tt) => ({
                  value: tt.value,
                  text: tt.label,
                }))}
              />

              <Input
                label={t("widget.titleLabel")}
                value={useWatch({ control, name: "title" }) ?? ""}
                onChangeText={(val) => setValue("title", val)}
                placeholder={t("widget.titlePlaceholder")}
              />

              <Select
                label={t("widget.collectionLabel")}
                value={collection}
                onValueChange={(val) => setValue("collection", String(val))}
                options={collectionOptions}
                placeholder={t("widget.collectionPlaceholder")}
              />

              <Select
                label={t("widget.sortLabel")}
                value={sort ?? ""}
                onValueChange={(val) => setValue("sort", String(val))}
                options={sortOptions}
                placeholder={t("widget.sortPlaceholder")}
                disabled={!collection}
                
              />

              <Divider />

              {(type || APP_WIDGET_TYPE_LATEST_ITEMS) ===
                APP_WIDGET_TYPE_LATEST_ITEMS && (
                <Vertical spacing="xs">
                  <Vertical style={{ gap: 0 }}>
                    <Text style={[styles.label]}>
                      {t("widget.latestItems.slotsTitle")}
                    </Text>
                    <Text style={[styles.helperText]}>
                      {t("widget.latestItems.slotsHint")}
                    </Text>
                  </Vertical>
                  {slots.map((slot) => (
                    <Vertical
                      key={slot.key}
                      spacing="xs"
                      style={{ paddingVertical: 6 }}
                    >
                      <Text numberOfLines={1} style={[styles.label]}>
                        {(() => {
                          const def = APP_WIDGET_LATEST_ITEMS_SLOTS.find(
                            (s) => s.key === slot.key,
                          );
                          return def ? t(def.labelKey) : slot.key;
                        })()}
                      </Text>
                      <Input
                        value={slot.field?.trim() ? slot.field : ""}
                        placeholder={t(
                          "widget.latestItems.selectFieldPlaceholder",
                        )}
                        editable={false}
                        showSoftInputOnFocus={false}
                        caretHidden
                        onPressIn={() => {
                          setActiveSlotKey(slot.key);
                          setFieldPickerOpen(true);
                        }}
                        append={
                          slot.field?.trim() ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              colorScheme="error"
                              onPress={() => {
                                const current = getValues("extra.slots");
                                const updated = current.map((s) =>
                                  s.key === slot.key ? { ...s, field: "" } : s,
                                );
                                setValue("extra.slots", updated);
                              }}
                            >
                              <DirectusIcon name="close" />
                            </Button>
                          ) : null
                        }
                        style={{ paddingRight: 0 }}
                      />
                      {(() => {
                        const def = APP_WIDGET_LATEST_ITEMS_SLOTS.find(
                          (s) => s.key === slot.key,
                        );
                        if (!def) return null;
                        const hint = t(def.hintKey);
                        return hint ? (
                          <Muted numberOfLines={2}>{hint}</Muted>
                        ) : null;
                      })()}
                    </Vertical>
                  ))}
                </Vertical>
              )}
            </Vertical>
          </Section>
        </Container>
      </KeyboardAwareScrollView>

      <FieldPathPicker
        open={fieldPickerOpen}
        onClose={() => {
          setFieldPickerOpen(false);
          setActiveSlotKey(null);
        }}
        collection={collection || null}
        title={t("widget.latestItems.selectFieldTitle")}
        onSelect={(path) => {
          if (!activeSlotKey) return;
          const current = getValues("extra.slots");
          const updated = current.map((s) =>
            s.key === activeSlotKey ? { ...s, field: path } : s,
          );
          setValue("extra.slots", updated);
        }}
      />
    </KeyboardAwareLayout>
  );
}
