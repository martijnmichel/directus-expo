import { useCollection, usePresets } from "@/state/queries/directus/collection";
import { debounce, map, reduce, some } from "lodash";
import { Table } from "../display/table";
import { Container } from "../layout/Container";
import { useFields } from "@/state/queries/directus/collection";
import { useDocuments } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { useTranslation } from "react-i18next";
import { useFieldMeta } from "@/helpers/document/fieldLabel";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { Horizontal, Vertical } from "../layout/Stack";
import { Check, ChevronRight } from "../icons";
import { Button } from "../display/button";
import { DirectusIcon } from "../display/directus-icon";
import { PortalOutlet } from "../layout/Portal";
import { Modal } from "../display/modal";
import { Input } from "../interfaces/input";
import { Text } from "../display/typography";
import { View } from "react-native";
import { getFieldValue } from "@/helpers/document/getFieldValue";
import { useDocumentsFilters } from "@/contexts/useDocumentsFilters";
import { UseDocumentsFiltersReturn } from "@/contexts/useDocumentsFilters";
import { Pagination } from "./filters/pagination";
import { SearchFilter } from "./filters/search-filter-modal";

export function CollectionDataTable({ collection }: { collection: string }) {
  const { t } = useTranslation();
  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: fields } = useFields(collection as keyof CoreSchema);

  const filterContext = useDocumentsFilters();
  const { page, limit, search, setSearch } = filterContext;

  const { data: documents, refetch } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema],
    {
      page,
      limit,
      search,
    }
  );

  const { label } = useFieldMeta(collection);

  const { data: presets } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);

  const tableFields =
    /** headers from presets */
    (preset && preset.layout_query?.tabular?.fields) ||
    /** or headers from fields that have values in the documents */
    (!preset &&
      fields
        ?.filter(
          (f) =>
            !!some(
              documents?.items,
              (doc) => !!doc?.[f.field as keyof typeof doc]
            )
        )
        .map((f) => f.field)) ||
    /** or headers from all fields */
    fields?.map((f) => f.field) ||
    [];

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <Vertical>
      <Table
        headers={reduce(
          tableFields,
          (prev, curr) => ({ ...prev, [curr]: label(curr) || "" }),
          {}
        )}
        fields={tableFields}
        items={(documents?.items as Record<string, unknown>[]) || []}
        widths={preset?.layout_options?.tabular?.widths}
        renderRow={(doc) =>
          map(tableFields, (f) => {
            const field = fields?.find((fo) => fo.field === f);

            return field
              ? getFieldValue(field, doc)
              : (doc[f] as number | string | null);
          })
        }
        onRowPress={(doc) => {
          console.log(doc);
          router.push(`/content/${collection}/${doc.id}`);
        }}
        noDataText={t("components.table.noData")}
      />
      <PortalOutlet name="floating-toolbar">
        <Pagination {...filterContext} total={documents?.total} />
        <SearchFilter {...filterContext} />
      </PortalOutlet>
      <View style={{ height: 60 }} />
    </Vertical>
  );
}
