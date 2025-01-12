import { filter, map } from "lodash";
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
import { DirectusIcon } from "../display/directus-icon";

export default function UserCollections() {
  const { data } = useCollections();

  console.log({ data });

  const {
    i18n: { language },
  } = useTranslation();

  const renderCollections = (parent?: string) => {
    return map(
      filter(
        data,
        (c) => !c.collection.startsWith("directus_") && !c.meta?.hidden
      ),
      (collection) => {
        if (parent && parent !== collection.meta?.group && collection.schema) {
          return null;
        } else if (
          (!collection.schema && !parent && !collection.meta?.group) ||
          (!collection.schema && parent === collection.meta?.group)
        ) {
          return (
            <Collapsible
              defaultOpen={collection.meta.collapse === "open"}
              key={`collection-${collection.collection}`}
            >
              <CollapsibleTrigger
                color={collection.meta.color || ""}
                prepend={
                  collection.meta.icon && (
                    <DirectusIcon name={collection.meta.icon} />
                  )
                }
              >
                {getCollectionTranslation(collection, language)}
              </CollapsibleTrigger>
              <CollapsibleContent style={{ paddingLeft: 20 }}>
                <List>{renderCollections(collection.collection)}</List>
              </CollapsibleContent>
            </Collapsible>
          );
        } else if (
          (parent &&
            parent === collection.meta?.group &&
            !!collection.schema) ||
          (!parent && !collection.meta.group)
        ) {
          return (
            <ListItem
              href={`/(app)/(tabs)/content/${collection.collection}`}
              key={`collection-${collection.collection}`}
              color={collection.meta.color || ""}
              prepend={
                collection.meta.icon && (
                  <DirectusIcon name={collection.meta.icon} />
                )
              }
            >
              {getCollectionTranslation(collection, language)}
            </ListItem>
          );
        }
      }
    );
  };

  return <List>{renderCollections()}</List>;
}
