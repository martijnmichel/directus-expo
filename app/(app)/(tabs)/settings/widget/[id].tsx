import { useLocalSearchParams, router } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Alert, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Vertical, Horizontal } from "@/components/layout/Stack";
import { DividerSubtitle } from "@/components/display/subtitle";
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
} from "@/constants/widget";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { FieldPathPickerBottomSheet } from "@/components/widgets/FieldPathPickerBottomSheet";
import { readFieldsByCollection, updateItem, createItem, deleteItem } from "@directus/sdk";
import type { LatestItemsWidgetConfig } from "@/widgets/latestItems/types";
import { useWidgetItems } from "@/state/widget/useWidgetItems";
import { writeLatestItemsWidgetConfigListToCache } from "@/widgets/latestItems/sync";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_SLOTS = [
  { key: "left", label: "Left", field: "" },
  { key: "title", label: "Title", field: "" },
  { key: "subtitle", label: "Subtitle", field: "" },
  { key: "right", label: "Right", field: "" },
];

export default function WidgetConfigEditorScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";

  const { directus, user } = useAuth();
  const queryClient = useQueryClient();
  const widgetItemsQuery = useWidgetItems({ enabled: true });
  const configs = widgetItemsQuery.data?.configs ?? [];
  const existing = useMemo(
    () => (isNew ? null : configs.find((c) => c.id === id) ?? null),
    [configs, id, isNew],
  );

  const { data: allCollections } = useCollections();
  const collectionOptions = useMemo(() => {
    return (Array.isArray(allCollections) ? allCollections : [])
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
        text: getCollectionTranslation(c, i18n.language) ?? String(c.collection),
      }));
  }, [allCollections, i18n.language]);

  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);

  const [form, setForm] = useState<
    Partial<LatestItemsWidgetConfig> & { collection: string }
  >({
    type: APP_WIDGET_TYPE_LATEST_ITEMS,
    title: "",
    collection: "",
    sort: "-date_updated",
    limit: 5,
    extra: { slots: DEFAULT_SLOTS },
  });

  useEffect(() => {
    if (isNew) return;
    if (!existing) return;
    setForm({
      id: existing.id,
      type: existing.type || APP_WIDGET_TYPE_LATEST_ITEMS,
      title: existing.title ?? "",
      collection: existing.collection ?? "",
      sort: existing.sort ?? "-date_updated",
      limit: existing.limit ?? 5,
      extra: existing.extra?.slots?.length ? existing.extra : { slots: DEFAULT_SLOTS },
    });
  }, [existing, isNew]);

  const sortOptionsQuery = useQuery({
    queryKey: ["widgetSortOptions", form.collection, user?.id],
    enabled: !!directus && !!form.collection,
    staleTime: 60_000,
    queryFn: async (): Promise<Array<{ value: string; text: string }>> => {
      const raw = await directus!.request(readFieldsByCollection(form.collection as any));
      const list = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
      const simple = (list as any[])
        .filter((f) => f && typeof f.field === "string")
        .filter((f) => !f.meta?.hidden)
        .filter((f) => !String(f.field).startsWith("_"))
        .filter((f) => !Array.isArray(f.meta?.special) || f.meta.special.length === 0);

      const opts: Array<{ value: string; text: string }> = [];
      for (const f of simple) {
        const name = String(f.field);
        opts.push({ value: `-${name}`, text: `${name} (desc)` });
        opts.push({ value: name, text: `${name} (asc)` });
      }
      return opts;
    },
  });
  const sortOptions = sortOptionsQuery.data ?? [];

  const writeCacheFromWidgetConfigsQuery = async () => {
    const refreshed = await widgetItemsQuery.refetch();
    await writeLatestItemsWidgetConfigListToCache((refreshed.data as any)?.configs ?? []);
    // Ensure any screens depending on widgetConfigs update immediately.
    queryClient.invalidateQueries({ queryKey: ["widgetConfigs"] as any });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!directus) throw new Error("Not authenticated with Directus");
      if (!user?.id) throw new Error("Not authenticated (missing user)");
      if (!form.collection?.trim()) throw new Error("Missing collection");

      const payload: any = {
        user_id: user.id,
        type: form.type || APP_WIDGET_TYPE_LATEST_ITEMS,
        collection: form.collection,
        sort: form.sort,
        limit: form.limit,
        filter: {},
        extra: form.extra ?? { slots: DEFAULT_SLOTS },
      };
      if (form.title?.trim()) payload.title = form.title.trim();

      if (isNew) {
        await directus.request(createItem(APP_WIDGET_CONFIG_COLLECTION as any, payload));
      } else {
        await directus.request(updateItem(APP_WIDGET_CONFIG_COLLECTION as any, id, payload));
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
      await directus.request(deleteItem<any, any>(APP_WIDGET_CONFIG_COLLECTION as any, id as any) as any);
    },
    onSuccess: async () => {
      await writeCacheFromWidgetConfigsQuery();
      router.back();
    },
  });

  const confirmRemove = () => {
    if (isNew) return;
    Alert.alert(
      t("widget.removeTitle"),
      t("widget.removeMessage", { name: form.title || form.collection }),
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
    <Layout>
      <Container>
        <Section>
          <Vertical spacing="md">
            <DividerSubtitle
              title={isNew ? t("widget.addModalTitle") : t("widget.editModalTitle")}
              icon="msWidgets"
            />

            <Select
              label="Type"
              value={form.type || APP_WIDGET_TYPE_LATEST_ITEMS}
              onValueChange={(val) => setForm((f) => ({ ...f, type: String(val) }))}
              options={APP_WIDGET_TYPES.map((tt) => ({ value: tt.value, text: tt.label }))}
            />

            <Input
              label={t("widget.titleLabel")}
              value={form.title ?? ""}
              onChangeText={(val) => setForm((f) => ({ ...f, title: val }))}
              placeholder={t("widget.titlePlaceholder")}
            />

            <Select
              label={t("widget.collectionLabel")}
              value={form.collection}
              onValueChange={(val) => setForm((f) => ({ ...f, collection: String(val) }))}
              options={collectionOptions}
              placeholder={t("widget.collectionPlaceholder")}
            />

            <Select
              label={t("widget.sortLabel")}
              value={form.sort ?? ""}
              onValueChange={(val) => setForm((f) => ({ ...f, sort: String(val) }))}
              options={sortOptions.length ? sortOptions : []}
              placeholder={t("widget.sortPlaceholder")}
              disabled={!form.collection}
            />

            <Input
              label={t("widget.limitLabel")}
              value={String(form.limit ?? 5)}
              onChangeText={(val) => setForm((f) => ({ ...f, limit: Number(val) || 5 }))}
              keyboardType="number-pad"
            />

            {(form.type || APP_WIDGET_TYPE_LATEST_ITEMS) === APP_WIDGET_TYPE_LATEST_ITEMS && (
              <Vertical spacing="xs">
                <Text style={{ fontWeight: "600" }}>Fields</Text>
                <Muted>
                  Choose which fields to show on the widget rows (supports deep relations).
                </Muted>
                {(Array.isArray(form.extra?.slots) ? form.extra?.slots : DEFAULT_SLOTS).map(
                  (slot) => (
                    <Horizontal
                      key={slot.key}
                      spacing="sm"
                      style={{ alignItems: "center" }}
                    >
                      <Input
                        value={slot.label}
                        onChangeText={(val) =>
                          setForm((f) => {
                            const slots = Array.isArray(f.extra?.slots)
                              ? [...(f.extra!.slots as any[])]
                              : [...DEFAULT_SLOTS];
                            const idx = slots.findIndex((s) => s.key === slot.key);
                            if (idx >= 0) slots[idx] = { ...slots[idx], label: val };
                            return { ...f, extra: { ...(f.extra ?? {}), slots } };
                          })
                        }
                        placeholder={slot.key}
                        style={{ flex: 1 }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setActiveSlotKey(slot.key);
                          setFieldPickerOpen(true);
                        }}
                      >
                        <DirectusIcon name="chevron_right" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        colorScheme="error"
                        onPress={() =>
                          setForm((f) => {
                            const slots = Array.isArray(f.extra?.slots)
                              ? [...(f.extra!.slots as any[])]
                              : [...DEFAULT_SLOTS];
                            const idx = slots.findIndex((s) => s.key === slot.key);
                            if (idx >= 0) slots[idx] = { ...slots[idx], field: "" };
                            return { ...f, extra: { ...(f.extra ?? {}), slots } };
                          })
                        }
                      >
                        <DirectusIcon name="close" />
                      </Button>
                    </Horizontal>
                  ),
                )}
              </Vertical>
            )}

            <Horizontal spacing="sm" style={{ alignItems: "center" }}>
              <Button variant="soft" onPress={() => router.back()}>
                {t("button.cancel")}
              </Button>
              <Button
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.collection?.trim()}
              >
                {saveMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
              {!isNew && (
                <View style={{ marginLeft: "auto" }}>
                  <Button
                    variant="soft"
                    colorScheme="error"
                    onPress={confirmRemove}
                    leftIcon={<DirectusIcon name="delete" />}
                    loading={deleteMutation.isPending}
                  >
                    {t("widget.removeButton")}
                  </Button>
                </View>
              )}
            </Horizontal>
          </Vertical>
        </Section>
      </Container>

      <FieldPathPickerBottomSheet
        open={fieldPickerOpen}
        onClose={() => {
          setFieldPickerOpen(false);
          setActiveSlotKey(null);
        }}
        collection={form.collection || null}
        title="Select field"
        onSelect={(path) => {
          if (!activeSlotKey) return;
          setForm((f) => {
            const slots = Array.isArray(f.extra?.slots)
              ? [...(f.extra!.slots as any[])]
              : [...DEFAULT_SLOTS];
            const idx = slots.findIndex((s) => s.key === activeSlotKey);
            if (idx >= 0) slots[idx] = { ...slots[idx], field: path };
            return { ...f, extra: { ...(f.extra ?? {}), slots } };
          });
        }}
      />
    </Layout>
  );
}

