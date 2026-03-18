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
};

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
        const m2oTarget =
          (f.schema?.foreign_key_table ? String(f.schema.foreign_key_table) : null) ||
          relationTargets.manyMap.get(fieldName) ||
          null;
        const o2mTarget = relationTargets.oneMap.get(fieldName) || null;
        const related = m2oTarget || o2mTarget;

        if (!related || search.trim()) {
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

