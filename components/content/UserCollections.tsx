import { filter, map, orderBy, some } from "lodash";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../display/collapsible";
import { List, ListItem } from "../display/list";
import { Fragment } from "react";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { useTranslation } from "react-i18next";
import { DirectusIcon, DirectusIconName } from "../display/directus-icon";
import { CoreSchema, ReadCollectionOutput } from "@directus/sdk";

export default function UserCollections() {
  const { data } = useCollections();
  const { t, i18n } = useTranslation();

  console.log({ noMeta: data?.filter((c) => !c.meta) });

  const CollectionGroup = ({
    collection,
  }: {
    collection: ReadCollectionOutput<CoreSchema>;
  }) => {
    const hasChildren =
      filter(data, (c) => c.meta?.group === collection.collection).length > 0;

    return (
      <Collapsible
        defaultOpen={collection.meta?.collapse === "open"}
        key={`collection-${collection.collection}`}
      >
        <CollapsibleTrigger
          color={collection.meta?.color || ""}
          href={`/content/${collection.collection}`}
          prepend={
            <DirectusIcon
              name={(collection.meta?.icon as DirectusIconName) || "msDatabase"}
            />
          }
        >
          {getCollectionTranslation(collection, i18n.language)}
        </CollapsibleTrigger>
        <CollapsibleContent style={{ paddingLeft: 20 }}>
          <List>{renderCollections(collection.collection)}</List>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderCollections = (parent?: string) => {
    return map(
      orderBy(
        filter(
          data,
          (c) =>
            !c.collection.startsWith("directus_") && !!c.meta && !c.meta?.hidden
        ),
        (i) => i.meta?.sort
      ),
      (collection) => {
        if (parent && parent !== collection.meta?.group && collection.schema) {
          return null;
        } else if (
          (!collection.schema && !parent && !collection.meta?.group) ||
          (!collection.schema && parent === collection.meta?.group)
        ) {
          return (
            <CollectionGroup
              key={`collection-${collection.collection}`}
              collection={collection}
            />
          );
        } else if (
          (parent &&
            parent === collection.meta?.group &&
            !!collection.schema) ||
          (!parent && !collection.meta?.group)
        ) {
          const hasChildren =
            filter(
              data,
              (c) => c.meta?.group === collection.collection && !c.meta?.hidden
            ).length > 0;
          return hasChildren ? (
            <CollectionGroup
              collection={collection}
              key={`collection-${collection.collection}`}
            />
          ) : (
            <ListItem
              href={`/(app)/(tabs)/content/${collection.collection}`}
              key={`collection-${collection.collection}`}
              prepend={
                <DirectusIcon
                  name={
                    (collection.meta?.icon as DirectusIconName) || "database"
                  }
                />
              }
            >
              {getCollectionTranslation(collection, i18n.language)}
            </ListItem>
          );
        }
      }
    );
  };

  return <List>{renderCollections()}</List>;
}
