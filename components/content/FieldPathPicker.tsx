import { Modal } from "@/components/display/modal";
import { Input } from "@/components/interfaces/input";
import { Text, Muted } from "@/components/display/typography";
import { DirectusIcon } from "@/components/display/directus-icon";
import { ChevronRight } from "@/components/icons/Chevron";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, View } from "react-native";
import { useFields } from "@/state/queries/directus/collection";
import { useRelations } from "@/state/queries/directus/core";
import type { CoreSchema } from "@directus/sdk";
import { ScrollView } from "react-native-gesture-handler";
import { createStyleSheet, useStyles } from "react-native-unistyles";

// ---------------------------------------------------------------------------
// Local primitives
// ---------------------------------------------------------------------------

const stylesheet = createStyleSheet((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
}));

function ExpandableRow({
  label,
  hint,
  depth,
  children,
}: {
  label: string;
  hint?: string;
  depth: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { styles, theme } = useStyles(stylesheet);
  const spin = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(spin, {
      toValue: open ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <>
      <Pressable
        onPress={toggle}
        style={[styles.row, { paddingLeft: depth * 16 }]}
      >
        <Text style={{ flex: 1 }}>{label}</Text>
        {hint ? <Muted>{hint}</Muted> : null}
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </Animated.View>
      </Pressable>
      {open ? (
        <View style={{ paddingLeft: (depth + 1) * 16 }}>{children}</View>
      ) : null}
    </>
  );
}

function LeafRow({
  label,
  hint,
  depth,
  onPress,
  icon,
  primary,
}: {
  label: string;
  hint?: string;
  depth: number;
  onPress: () => void;
  icon?: string;
  primary?: boolean;
}) {
  const { styles, theme } = useStyles(stylesheet);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { paddingLeft: depth * 16 }]}
    >
      {icon ? (
        <DirectusIcon
          name={icon as any}
          size={16}
          color={primary ? theme.colors.primary : theme.colors.textMuted}
        />
      ) : null}
      <Text
        style={[{ flex: 1 }, primary ? { color: theme.colors.primary } : undefined]}
      >
        {label}
      </Text>
      {hint ? <Muted>{hint}</Muted> : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Helpers (unchanged)
// ---------------------------------------------------------------------------

type FieldOutput = {
  field: string;
  meta?: { hidden?: boolean };
  special?: string[] | string | null;
  schema?: { foreign_key_table?: string | null };
  type?: string;
};

function asArray(val: unknown): string[] {
  if (val && typeof val === "object" && Array.isArray((val as any).data)) {
    return asArray((val as any).data);
  }
  if (Array.isArray(val)) {
    return val
      .map((v: any) => {
        if (v == null) return "";
        if (typeof v === "string" || typeof v === "number") return String(v);
        if (typeof v === "object") {
          if (typeof v.collection === "string") return v.collection;
          if (typeof v.value === "string" || typeof v.value === "number")
            return String(v.value);
          if (typeof v.key === "string") return v.key;
        }
        return "";
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof val === "string" && val.trim()) {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function readM2AAllowedCollectionsFromField(field: any): string[] {
  if (!field) return [];
  const opts = field?.meta?.options ?? field?.options ?? null;
  return asArray(
    opts?.allowedCollections ??
      opts?.allowed_collections ??
      opts?.collections ??
      opts?.allowed ??
      opts?.one_allowed_collections ??
      opts?.oneAllowedCollections ??
      field?.meta?.one_allowed_collections ??
      field?.one_allowed_collections,
  );
}

function getAliasRelationTargets(args: {
  relations: any[];
  collection: string;
  aliasField: string;
  field?: any;
}):
  | null
  | { kind: "m2m"; relatedCollection: string; viaJunctionField?: string | null }
  | { kind: "m2a"; junctionField: string; allowedCollections: string[] } {
  const { relations, collection, aliasField, field } = args;
  const junction = relations.find(
    (r) =>
      r &&
      r.related_collection === collection &&
      r.meta?.one_field === aliasField &&
      r.collection &&
      r.meta?.junction_field,
  );
  if (!junction) return null;

  const junctionCollection = String(junction.collection);
  const junctionField = String(junction.meta.junction_field);
  const manySide = relations.find(
    (r) => r && r.collection === junctionCollection && r.field === junctionField,
  );

  if (!manySide || manySide.related_collection == null) {
    const allowedFromField = readM2AAllowedCollectionsFromField(field);
    const allowedFromManySide = asArray(
      manySide?.meta?.one_allowed_collections ?? manySide?.one_allowed_collections,
    );
    const allowedFromJunctionRelation = asArray(
      junction.meta?.one_allowed_collections ?? junction.one_allowed_collections,
    );
    const allowed = allowedFromField.length
      ? allowedFromField
      : allowedFromManySide.length
        ? allowedFromManySide
        : allowedFromJunctionRelation;
    return { kind: "m2a", junctionField, allowedCollections: allowed };
  }

  const special = field?.meta?.special;
  const isTranslationsAlias =
    (Array.isArray(special) && special.map(String).includes("translations")) ||
    field?.meta?.interface === "translations";
  return {
    kind: "m2m",
    relatedCollection: isTranslationsAlias
      ? junctionCollection
      : String(manySide.related_collection),
    viaJunctionField: isTranslationsAlias ? null : junctionField,
  };
}

// ---------------------------------------------------------------------------
// FieldTree
// ---------------------------------------------------------------------------

function FieldTree({
  collection,
  basePath,
  search,
  onSelect,
  depth,
}: {
  collection: string;
  basePath: string;
  search: string;
  onSelect: (path: string) => void;
  depth: number;
}) {
  const { t } = useTranslation();
  const fieldsQ = useFields(collection as keyof CoreSchema);
  const relQ = useRelations();

  const relationTargets = useMemo(() => {
    const manyMap = new Map<string, string>();
    const oneMap = new Map<string, string>();
    const rels = (relQ.data ?? []) as any[];
    for (const r of rels) {
      if (r?.collection === collection && r?.field) {
        if (r.related_collection)
          manyMap.set(String(r.field), String(r.related_collection));
      }
      if (r?.related_collection === collection && r?.meta?.one_field) {
        oneMap.set(String(r.meta.one_field), String(r.collection));
      }
    }
    return { manyMap, oneMap };
  }, [collection, relQ.data]);

  const fields = useMemo(() => {
    const list = ((fieldsQ.data ?? []) as any[])
      .filter((f) => f && typeof f.field === "string")
      .filter((f) => !f.meta?.hidden)
      .filter((f) => !String(f.field).startsWith("_"));
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((f) => String(f.field).toLowerCase().includes(q));
  }, [fieldsQ.data, search]);

  if (fieldsQ.isLoading) return <Muted>Loading…</Muted>;
  if (fieldsQ.isError) return <Muted>Failed to load fields.</Muted>;

  return (
    <>
      {fields.map((f) => {
        const fieldName = String(f.field);
        const fullPath = `${basePath}${fieldName}`;
        const specialRaw = (f as any)?.meta?.special ?? (f as any)?.special;
        const specials = Array.isArray(specialRaw)
          ? specialRaw.map((x) => String(x).toLowerCase())
          : specialRaw != null
            ? [String(specialRaw).toLowerCase()]
            : [];
        const iface = String((f as any)?.meta?.interface ?? "").toLowerCase();
        const isFileField =
          specials.includes("file") ||
          specials.includes("files") ||
          specials.includes("directus_files") ||
          iface.includes("file-image");

        const relations = ((relQ.data ?? []) as any[]) || [];
        const isAlias = f.type === "alias";
        const m2oTarget =
          !isAlias
            ? (f.schema?.foreign_key_table
                ? String(f.schema.foreign_key_table)
                : null) || relationTargets.manyMap.get(fieldName) || null
            : null;
        const o2mTarget = !isAlias ? relationTargets.oneMap.get(fieldName) || null : null;
        const related = m2oTarget || o2mTarget;

        const isDirectusFilesRelation = m2oTarget === "directus_files";

        const aliasTargets = isAlias
          ? getAliasRelationTargets({ relations, collection, aliasField: fieldName, field: f })
          : null;

        // ── Alias (m2m / m2a) ──────────────────────────────────────────────
        if (aliasTargets && !search.trim()) {
          if (aliasTargets.kind === "m2m") {
            const relatedCollection = aliasTargets.relatedCollection;
            const via = aliasTargets.viaJunctionField
              ? `${String(aliasTargets.viaJunctionField)}.`
              : "";
            return (
              <ExpandableRow
                key={`${collection}.${basePath}${fieldName}`}
                label={fieldName}
                hint={relatedCollection}
                depth={depth}
              >
                <FieldTree
                  collection={relatedCollection}
                  basePath={`${basePath}${fieldName}.${via}`}
                  search={search}
                  onSelect={onSelect}
                  depth={0}
                />
              </ExpandableRow>
            );
          }

          // M2A
          const { allowedCollections, junctionField } = aliasTargets;
          return (
            <ExpandableRow
              key={`${collection}.${basePath}${fieldName}`}
              label={fieldName}
              hint="M2A"
              depth={depth}
            >
              {allowedCollections.length === 0 ? (
                <Muted>No allowed collections.</Muted>
              ) : (
                allowedCollections.map((col) => (
                  <ExpandableRow
                    key={`${collection}.${basePath}${fieldName}.${col}`}
                    label={col}
                    hint={junctionField}
                    depth={0}
                  >
                    <FieldTree
                      collection={col}
                      basePath={`${basePath}${fieldName}.${junctionField}:${col}.`}
                      search={search}
                      onSelect={onSelect}
                      depth={0}
                    />
                  </ExpandableRow>
                ))
              )}
            </ExpandableRow>
          );
        }

        // ── M2O / O2M relation ─────────────────────────────────────────────
        if (related && !search.trim()) {
          return (
            <ExpandableRow
              key={`${collection}.${basePath}${fieldName}`}
              label={fieldName}
              hint={related}
              depth={depth}
            >
              {isDirectusFilesRelation && (
                <LeafRow
                  label={t("widget.latestItems.thumbnailTransform")}
                  icon="msAutoAwesomeMosaic"
                  primary
                  depth={0}
                  onPress={() => onSelect(`${fullPath}.$thumbnail`)}
                />
              )}
              <FieldTree
                collection={related}
                basePath={`${basePath}${fieldName}.`}
                search={search}
                onSelect={onSelect}
                depth={0}
              />
            </ExpandableRow>
          );
        }

        // ── Leaf field ─────────────────────────────────────────────────────
        return (
          <View key={`${collection}.${basePath}${fieldName}`}>
            <LeafRow
              label={fieldName}
              depth={depth}
              onPress={() => onSelect(fullPath)}
            />
            {isFileField && (
              <LeafRow
                label={t("widget.latestItems.thumbnailTransform")}
                  icon="msAutoAwesomeMosaic"
                  primary
                  depth={depth}
                onPress={() => onSelect(`${fullPath}.$thumbnail`)}
              />
            )}
          </View>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function FieldPathPicker({
  open,
  onClose,
  collection,
  title = "Select field",
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  collection: string | null;
  title?: string;
  onSelect: (path: string) => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Content variant="bottomSheet" height="80%" title={title}>
        <ScrollView>
          <View style={{ gap: 8, paddingBottom: 16 }}>
            <Input
              value={search}
              placeholder="Search fields…"
              onChangeText={setSearch as any}
            />
            {!collection ? (
              <Muted>Select a collection first.</Muted>
            ) : (
              <FieldTree
                collection={collection}
                basePath=""
                search={search}
                depth={0}
                onSelect={(path) => {
                  onSelect(path);
                  onClose();
                }}
              />
            )}
          </View>
        </ScrollView>
      </Modal.Content>
    </Modal>
  );
}
