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
import { useCallback, useEffect, useState } from "react";
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

  const fieldsQuery = map(tableFields, (f) => {
    const field = fields?.find((fo) => fo.field === f);
    return getDisplayTemplateQueryFields(field) || f.split(".$")[0];
  });
  const { data: presets, isLoading: isPresetsLoading } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);


  const { data: documents, refetch } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema],
    {
      page,
      limit,
      search,
    },
    {
      enabled: !!fieldsQuery.length,
    }
  );

  const { data: relatedDocuments, refetch: refetchRelatedDocuments } = useDocuments(
    collection as keyof CoreSchema,
    {
      fields: [...fieldsQuery.filter(v => v.includes(".")), primaryKey],
      limit: -1,
      filter: {
        [primaryKey]: {
          _in: map(documents?.items, (doc) => doc[primaryKey as string]),
        },
      }
    },
    {
      enabled: !!fieldsQuery.length,
    }
  );


  console.log({ preset, tableFields, fieldsQuery, documents, relatedDocuments });

  const { label } = useFieldMeta(collection);

  useEffect(() => {
    refetch();
    refetchRelatedDocuments();
  }, [refetch, refetchRelatedDocuments]);

  const { parse } = useFieldDisplayValue(collection);

  const Col = ({
    template,
    document,
    relatedDocument,
  }: {
    template?: string;
    field?: string;
    document: Record<string, unknown>;
    relatedDocument?: Record<string, unknown>;
  }) => {
    const lookupField = () => {
      if (!template) return null;

      const parts = template.split(".");
      const rootField = fields?.find((fo) => fo.field === parts[0]);
      const deepField = fields?.find((fo) => fo.field === template);

      // Handle transforms (parts with $)
      const transformName = parts.find((p) => p.startsWith("$"))?.substring(1);
      const fieldPath = parts.filter((p) => !p.startsWith("$")).join(".");
      const parentFieldPath = parts.filter((p) => !p.startsWith("$")).slice(0, -1).join(".");
      const valuePath = tail(parts.filter((p) => !p.startsWith("$"))).join(".");

      return {
        field: rootField,
        deepField,
        path: fieldPath,
        transform: transformName,
        valuePath,
        parentFieldPath,
      };
    };

    const fieldInfo = lookupField();
    
    
    const rootValue = fieldInfo?.field
      ? get(document, fieldInfo.field.field)
      : null;
    const value = fieldInfo ? get(document, fieldInfo.path) : null;

    if (!value && !fieldInfo?.deepField && relatedDocument) {
      const path = fieldInfo?.path ?? "";
      const valuePath = fieldInfo?.valuePath ?? "";
      const valuePathParts = valuePath.split(".").filter(Boolean);
      const pathToArray =
        valuePathParts.length > 1
          ? valuePathParts.slice(0, -1).join(".")
          : "";
      const lastSegment = valuePathParts[valuePathParts.length - 1] ?? valuePath;

      // Use parentFieldPath first so nested paths (e.g. category.translations) get the right array
      const pathSegments = path.split(".").filter(Boolean);
      const isNestedRelationPath = pathSegments.length > 1; // e.g. category.translations.title

      let relatedValue: unknown = null;
      if (fieldInfo?.parentFieldPath) {
        relatedValue = get(relatedDocument, fieldInfo.parentFieldPath);
      }
      // When path goes through a relation (e.g. category.translations.title), do NOT fall back
      // to pathToArray/valuePath.
      const skipFallback =
        isNestedRelationPath &&
        fieldInfo?.parentFieldPath != null &&
        (relatedValue === null || relatedValue === undefined);

      if (!skipFallback && !Array.isArray(relatedValue) && pathToArray && pathToArray !== valuePath) {
        relatedValue = get(relatedDocument, pathToArray);
      }
      if (!skipFallback && !Array.isArray(relatedValue)) {
        relatedValue = get(relatedDocument, valuePath);
      }

      if (skipFallback && (relatedValue === null || relatedValue === undefined)) {
        return <Text style={[styles.cellText]}>–</Text>;
      }

      if (Array.isArray(relatedValue)) {
        // Path within each array item (supports any nesting: "title", "meta.label", "a.b.c", etc.)
        const parentPath = fieldInfo?.parentFieldPath ?? "";
        const itemPath =
          parentPath && path.startsWith(parentPath + ".")
            ? path.slice(parentPath.length + 1)
            : lastSegment;

        const str = relatedValue
          .map((item: unknown) => {
            const v =
              typeof item === "object" && item !== null && itemPath
                ? get(item as object, itemPath)
                : item;
            return v != null ? getFieldValueString({ value: v }) : "";
          })
          .filter(Boolean)
          .join(", ");
        return (
          <View style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.cellText, styles.truncate, { width: "100%" }]}
            >
              {str}
            </Text>
          </View>
        );
      }
      if (relatedValue != null) {
        return getFieldValueString({ value: relatedValue });
      }
    } 
    
    else if (fieldInfo?.transform && fieldInfo.field) {
     console.log({ value, fieldInfo, relatedDocument });
     return getFieldValue(fieldInfo.field, value, fieldInfo.transform);
    }
    else if (fieldInfo?.field) {
      return <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>{parse({
        item: fieldInfo.field,
        data: document,
      })}</Text>;
    } else return <Text>{value?.toString()}</Text>;
  };

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
            <Col
              template={f}
              document={doc}
              relatedDocument={relatedDoc}
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
