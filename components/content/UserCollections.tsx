import { useCollections } from "@/state/directus/core";
import { H1, Text } from "../display/typography";
import { filter, map } from "lodash";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../display/collapsible";
import { List, ListItem } from "../display/list";
import { Fragment } from "react";

export default function UserCollections() {
  const { data } = useCollections();

  const renderCollections = (parent?: string) => {
    return map(
      filter(
        data,
        (c) => !c.collection.startsWith("directus_") && !c.meta.hidden
      ),
      (collection) => {
        if (parent && parent !== collection.meta.group && collection.schema) {
          return null;
        } else if (
          (!collection.schema && !parent && !collection.meta.group) ||
          (!collection.schema && parent === collection.meta.group)
        ) {
          return (
            <Collapsible key={`collection-${collection.collection}`}>
              <CollapsibleTrigger>{collection.collection}</CollapsibleTrigger>
              <CollapsibleContent style={{ paddingLeft: 20 }}>
                <List>{renderCollections(collection.collection)}</List>
              </CollapsibleContent>
            </Collapsible>
          );
        } else if (
          parent &&
          parent === collection.meta.group &&
          !!collection.schema
        ) {
          return (
            <ListItem
              href={`/content/${collection.collection}`}
              key={`collection-${collection.collection}`}
            >
              {collection.collection}
            </ListItem>
          );
        }
      }
    );
  };

  return <List>{renderCollections()}</List>;
}
