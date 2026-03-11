import { useCollection, usePresets } from "@/state/queries/directus/collection";
import { debounce, first, get, map, reduce, some, tail } from "lodash";
import { Table, tableStylesheet } from "../display/table";
import { Container } from "../layout/Container";
import { useFields } from "@/state/queries/directus/collection";
import { useDocuments } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { useTranslation } from "react-i18next";
import { useFieldMeta } from "@/helpers/document/fieldLabel";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { Horizontal, Vertical } from "../layout/Stack";
import { PortalOutlet } from "../layout/Portal";
import { View } from "react-native";
import {
  getFieldValue,
  getFieldValueString,
  useFieldDisplayValue,
} from "@/helpers/document/getFieldValue";
import { useDocumentsFilters } from "@/hooks/useDocumentsFilters";
import { Pagination } from "./filters/pagination";
import { SearchFilter } from "./filters/search-filter-modal";
import { usePermissions, useRelations } from "@/state/queries/directus/core";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";
import { usePrimaryKey } from "@/hooks/usePrimaryKey";
import { useCollectionTableFields } from "@/hooks/useCollectionTableFields";
import { getFieldsFromTemplate } from "@/helpers/document/template";
import { Text } from "../display/typography";
import {
  getDisplayTemplateQueryFields,
  getDisplayTemplateTransformName,
} from "@/helpers/collections/getDisplayTemplate";
import { useStyles } from "react-native-unistyles";
import { DataTableColumn } from "./DataTableColumn";

export function CollectionDataTable({ collection }: { collection: string }) {
  const { t } = useTranslation();
  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const { styles } = useStyles(tableStylesheet);
  const { data: permissions } = usePermissions();
  const { data: relations } = useRelations();
  const primaryKey = usePrimaryKey(collection as keyof CoreSchema);

  const canRead = isActionAllowed(
    collection as keyof CoreSchema,
    "read",
    permissions
  );

  const filterContext = useDocumentsFilters();
  const { page, limit, search, setSearch } = filterContext;

  const tableFields = useCollectionTableFields({
    collection: collection as keyof CoreSchema,
  });

  const fieldsQuery = useMemo(
    () =>
      map(tableFields, (f) => {
        const field = fields?.find((fo) => fo.field === f);
        return getDisplayTemplateQueryFields(field) || f.split(".$")[0];
      }),
    [tableFields, fields]
  );

  const { data: presets, isLoading: isPresetsLoading } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);

  const documentsQuery = useMemo(
    () => ({ page, limit, search }),
    [page, limit, search]
  );

  const { data: documents, refetch } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema],
    documentsQuery,
    {
      enabled: !!fieldsQuery.length,
    }
  );

  const documentIds = useMemo(
    () => map(documents?.items, (doc) => doc[primaryKey as string]),
    [documents?.items, primaryKey]
  );

  const relatedDocumentsQuery = useMemo(
    () => ({
      fields: [...fieldsQuery.filter((v) => v.includes(".")), primaryKey],
      limit: -1,
      filter: documentIds?.length ? {
        [primaryKey]: { _in: documentIds },
      } : {},
    }),
    [fieldsQuery, primaryKey, documentIds]
  );

  const { data: relatedDocuments, refetch: refetchRelatedDocuments } =
    useDocuments(
      collection as keyof CoreSchema,
      relatedDocumentsQuery,
      {
        enabled: !!fieldsQuery.length && !!documentIds?.length,
      }
    );

  const { label } = useFieldMeta(collection);

  useEffect(() => {
    refetch();
    refetchRelatedDocuments();
  }, [refetch, refetchRelatedDocuments]);


  return (
    <>
      <Table
        headers={reduce(
          tableFields,
          (prev, curr) => ({ ...prev, [curr]: label(curr.split(".")[curr.split(".").length - 1]) || "" }),
          {}
        )}
        fields={tableFields}
        items={(documents?.items as Record<string, unknown>[]) || []}
        widths={preset?.layout_options?.tabular?.widths}
        renderRow={(doc) => {
          const relatedDoc = (relatedDocuments?.items as Record<string, unknown>[] | undefined)?.find(
            (r) => r[primaryKey as string] === doc[primaryKey as string]
          );
          return map(tableFields, (f) => (
            <DataTableColumn
              template={f}
              document={doc}
              relatedDocument={relatedDoc}
              collection={collection as keyof CoreSchema}
              key={`table-${collection}-column-${f}`}
            />
          ));
        }}
        onRowPress={(doc) => {
          if (canRead) {
            router.push(`/content/${collection}/${doc[primaryKey as any]}`);
          }
        }}
        noDataText={t("components.table.noData")}
      />
      <PortalOutlet name="floating-toolbar">
        <Pagination {...filterContext} total={documents?.total} />
        <SearchFilter {...filterContext} />
      </PortalOutlet>
    </>
  );
}
