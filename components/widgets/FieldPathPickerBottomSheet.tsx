import { Modal } from "@/components/display/modal";
import { Vertical, Horizontal } from "@/components/layout/Stack";
import { Input } from "@/components/interfaces/input";
import { Text, Muted } from "@/components/display/typography";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/display/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { readFieldsByCollection, readRelations } from "@directus/sdk";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type FieldOutput = {
  field: string;
  meta?: { hidden?: boolean };
  schema?: { foreign_key_table?: string | null };
};

type RelationOutput = {
  many_collection?: string;
  many_field?: string;
  one_collection?: string;
  one_field?: string;
};

function useCollectionFields(collection: string | null, enabled: boolean) {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["fieldPathPicker", "fields", collection, user?.id],
    enabled: !!directus && !!collection && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await directus!.request(readFieldsByCollection(collection as any));
      const list = Array.isArray(res) ? res : ((res as any)?.data ?? []);
      return list as FieldOutput[];
    },
  });
}

function useCollectionRelations(collection: string | null, enabled: boolean) {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["fieldPathPicker", "relations", collection, user?.id],
    enabled: !!directus && !!collection && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await directus!.request(
        readRelations({
          filter: {
            _or: [
              { many_collection: { _eq: collection } },
              { one_collection: { _eq: collection } },
            ],
          },
          limit: -1,
        } as any),
      );
      const list = Array.isArray(res) ? res : ((res as any)?.data ?? []);
      return list as RelationOutput[];
    },
  });
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
  const fieldsQ = useCollectionFields(collection, true);
  const relQ = useCollectionRelations(collection, true);

  const relationTargets = useMemo(() => {
    const manyMap = new Map<string, string>();
    const oneMap = new Map<string, string>();
    const rels = relQ.data ?? [];
    for (const r of rels) {
      if (r?.many_collection === collection && r?.many_field) {
        if (r.one_collection) manyMap.set(String(r.many_field), String(r.one_collection));
      }
      if (r?.one_collection === collection && r?.one_field) {
        if (r.many_collection) oneMap.set(String(r.one_field), String(r.many_collection));
      }
    }
    return { manyMap, oneMap };
  }, [collection, relQ.data]);

  const fields = useMemo(() => {
    const list = (fieldsQ.data ?? [])
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

export function FieldPathPickerBottomSheet({
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

