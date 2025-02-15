import { useCollection, usePresets } from "@/state/queries/directus/collection";
import { debounce, first, get, map, reduce, some, tail } from "lodash";
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
import { PortalOutlet } from "../layout/Portal";
import { View } from "react-native";
import { useFieldDisplayValue } from "@/helpers/document/getFieldValue";
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

export function CollectionDataTable({ collection }: { collection: string }) {
  const { t } = useTranslation();
  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: fields } = useFields(collection as keyof CoreSchema);

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

  const fieldsQuery = map(tableFields, (f) => {
    const field = fields?.find((fo) => fo.field === f);
    return getDisplayTemplateQueryFields(field) || f.split(".$")[0];
  });
  const { data: presets, isLoading: isPresetsLoading } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);

  console.log({ preset });

  const { data: documents, refetch } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema],
    {
      page,
      limit,
      search,
      fields: [...fieldsQuery, primaryKey],
    },
    {
      enabled: !!fieldsQuery.length,
    }
  );

  const { label } = useFieldMeta(collection);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const { parse } = useFieldDisplayValue(collection);

  const Col = ({
    template,
    document,
  }: {
    template?: string;
    field?: string;
    document: Record<string, unknown>;
  }) => {
    const lookupField = () => {
      if (!template) return null;

      const parts = template.split(".");
      const rootField = fields?.find((fo) => fo.field === parts[0]);
      const deepField = fields?.find((fo) => fo.field === template);

      // Handle transforms (parts with $)
      const transformName = parts.find((p) => p.startsWith("$"))?.substring(1);
      const fieldPath = parts.filter((p) => !p.startsWith("$")).join(".");
      const valuePath = tail(parts.filter((p) => !p.startsWith("$"))).join(".");

      return {
        field: rootField,
        deepField,
        path: fieldPath,
        transform: transformName,
        valuePath,
      };
    };

    const fieldInfo = lookupField();
    const rootValue = fieldInfo?.field
      ? get(document, fieldInfo.field.field)
      : null;
    const value = fieldInfo ? get(document, fieldInfo.path) : null;

    if (!value && !fieldInfo?.deepField && !!rootValue) {
      if (Array.isArray(rootValue)) {
        return (
          <Horizontal>
            {map(rootValue, (item) => {
              const value = get(item, fieldInfo?.valuePath ?? "");
              return value ? <Text>{value} </Text> : null;
            })}
          </Horizontal>
        );
      }
    } else if (fieldInfo?.field) {
      return parse({
        item: fieldInfo.field,
        data: document,
        valuePath: fieldInfo.valuePath,
      });
    } else return <Text>{value?.toString()}</Text>;
  };

  return (
    <>
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
            return (
              <Col
                template={f}
                document={doc}
                key={`table-${collection}-column-${f}`}
              />
            );
          })
        }
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
