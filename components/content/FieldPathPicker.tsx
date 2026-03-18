import { Modal } from "@/components/display/modal";
import { Vertical, Horizontal } from "@/components/layout/Stack";
import { Input } from "@/components/interfaces/input";
import { Text, Muted } from "@/components/display/typography";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/display/accordion";
import { useMemo, useState } from "react";
import { useFields } from "@/state/queries/directus/collection";
import { useRelations } from "@/state/queries/directus/core";
import type { CoreSchema } from "@directus/sdk";

type FieldOutput = {
  field: string;
  meta?: { hidden?: boolean };
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
          // Common Directus option shapes
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
    // directus csv comes back as "a,b,c"
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
  // Directus stores allowed collections for list-m2a in interface options (naming varies by version)
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
  | {
      kind: "m2m";
      relatedCollection: string;
    }
  | {
      kind: "m2a";
      junctionField: string;
      allowedCollections: string[];
    } {
  const { relations, collection, aliasField, field } = args;
  // Same approach as `CollectionDataTable`: find the junction relation for the alias field
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

  // M2A: many-side related_collection is null and allowed collections live on meta.one_allowed_collections
  if (!manySide || manySide.related_collection == null) {
    // Prefer reading from the alias field interface options (most reliable), fallback to relation meta.
    const allowedFromField = readM2AAllowedCollectionsFromField(field);
    // Important: for "O2M -> junction_field -> M2A" (e.g. `articles.content`),
    // the allowed collections live on the *junction field relation* (`articles_content.item`),
    // not on the O2M relation (`articles_content.articles_id`).
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
    return {
      kind: "m2a",
      junctionField,
      allowedCollections: allowed,
    };
  }

  // M2M: many-side points to the related collection
  return { kind: "m2m", relatedCollection: String(manySide.related_collection) };
}

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
  const fieldsQ = useFields(collection as keyof CoreSchema);
  const relQ = useRelations();

  const relationTargets = useMemo(() => {
    const manyMap = new Map<string, string>();
    const oneMap = new Map<string, string>();
    const rels = (relQ.data ?? []) as any[];
    for (const r of rels) {
      if (r?.collection === collection && r?.field) {
        // many side: collection.field -> related_collection
        if (r.related_collection) {
          manyMap.set(String(r.field), String(r.related_collection));
        }
      }
      if (r?.related_collection === collection && r?.meta?.one_field) {
        // one side: related_collection.meta.one_field -> collection
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
    <Vertical spacing="xs" style={{ paddingLeft: depth > 0 ? 8 : 0 }}>
      {fields.map((f) => {
        const fieldName = String(f.field);
        const relations = ((relQ.data ?? []) as any[]) || [];
        const isAlias = f.type === "alias";
        // Important: alias fields (m2m/m2a/o2m aliases) should NOT be resolved via the generic
        // relation maps, otherwise M2A aliases jump into the junction collection fields.
        const m2oTarget =
          !isAlias
            ? (f.schema?.foreign_key_table
                ? String(f.schema.foreign_key_table)
                : null) || relationTargets.manyMap.get(fieldName) || null
            : null;
        const o2mTarget = !isAlias ? relationTargets.oneMap.get(fieldName) || null : null;
        const related = m2oTarget || o2mTarget;

        const aliasTargets =
          isAlias
            ? getAliasRelationTargets({
                relations,
                collection,
                aliasField: fieldName,
                field: f,
              })
            : null;

        if (!related || search.trim()) {
          // If this is an alias relation (m2m/m2a) and we're not searching, show as expandable.
          if (aliasTargets && !search.trim()) {
            if (aliasTargets.kind === "m2m") {
              const relatedCollection = aliasTargets.relatedCollection;
              return (
                <Accordion
                  key={`${collection}.${basePath}${fieldName}`}
                  defaultValue={null as any}
                >
                  <AccordionItem value={`${collection}.${basePath}${fieldName}`}>
                    <AccordionTrigger variant="accordion">
                      <Horizontal spacing="sm" style={{ alignItems: "center" }}>
                        <Text>{fieldName}</Text>
                        <Muted>{relatedCollection}</Muted>
                      </Horizontal>
                    </AccordionTrigger>
                    <AccordionContent>
                      <FieldTree
                        collection={relatedCollection}
                        basePath={`${basePath}${fieldName}.`}
                        search={search}
                        onSelect={onSelect}
                        depth={depth + 1}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }

            // M2A: show allowed collections as nested accordions
            const allowed = aliasTargets.allowedCollections;
            const junctionField = aliasTargets.junctionField;
            return (
              <Accordion
                key={`${collection}.${basePath}${fieldName}`}
                defaultValue={null as any}
              >
                <AccordionItem value={`${collection}.${basePath}${fieldName}`}>
                  <AccordionTrigger variant="accordion">
                    <Horizontal spacing="sm" style={{ alignItems: "center" }}>
                      <Text>{fieldName}</Text>
                      <Muted>M2A</Muted>
                    </Horizontal>
                  </AccordionTrigger>
                  <AccordionContent>
                    {allowed.length === 0 ? (
                      <Muted>No allowed collections.</Muted>
                    ) : (
                      <Vertical spacing="xs" style={{ paddingLeft: 8 }}>
                        {allowed.map((col) => (
                          <Accordion
                            key={`${collection}.${basePath}${fieldName}.${col}`}
                            defaultValue={null as any}
                          >
                            <AccordionItem value={`${collection}.${basePath}${fieldName}.${col}`}>
                              <AccordionTrigger variant="accordion">
                                <Horizontal spacing="sm" style={{ alignItems: "center" }}>
                                  <Text>{col}</Text>
                                  <Muted>{junctionField}</Muted>
                                </Horizontal>
                              </AccordionTrigger>
                              <AccordionContent>
                                <FieldTree
                                  collection={col}
                                  basePath={`${basePath}${fieldName}.${junctionField}:${col}.`}
                                  search={search}
                                  onSelect={onSelect}
                                  depth={depth + 2}
                                />
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                      </Vertical>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          }

          return (
            <Button
              key={`${collection}.${basePath}${fieldName}`}
              variant="ghost"
              size="sm"
              onPress={() => onSelect(`${basePath}${fieldName}`)}
              rightIcon={related ? <DirectusIcon name="chevron_right" /> : undefined}
              style={{ justifyContent: "flex-start" }}
            >
              {fieldName}
            </Button>
          );
        }

        return (
          <Accordion key={`${collection}.${basePath}${fieldName}`} defaultValue={null as any}>
            <AccordionItem value={`${collection}.${basePath}${fieldName}`}>
              <AccordionTrigger variant="accordion">
                <Horizontal spacing="sm" style={{ alignItems: "center" }}>
                  <Text>{fieldName}</Text>
                  <Muted>{related}</Muted>
                </Horizontal>
              </AccordionTrigger>
              <AccordionContent>
                <FieldTree
                  collection={related}
                  basePath={`${basePath}${fieldName}.`}
                  search={search}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </Vertical>
  );
}

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
        <Vertical spacing="md">
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
        </Vertical>
      </Modal.Content>
    </Modal>
  );
}

