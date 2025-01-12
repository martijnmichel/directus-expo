import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { CoreSchema, readItem } from "@directus/sdk";
import { useState } from "react";
import { parseTemplate } from "@/helpers/document/template";

export const useDocumentDisplayTemplate = ({
  collection,
  docId,
  template,
}: {
  collection: keyof CoreSchema;
  docId: number | string;
  template?: string;
}) => {
  const [data, setData] = useState<Record<string, unknown>>();
  const { directus } = useAuth();

  useEffect(() => {
    const extractTemplatePaths = (): string[] => {
      const matches = template?.match(/\{\{(.*?)\}\}/g) || [];
      return matches.map((match) => match.replace(/[{}]/g, "").trim());
    };
    const fetch = async () => {
      if (!template) return;
      try {
        const re = await directus?.request(
          // @ts-expect-error wrong type
          readItem(collection, docId, { fields: extractTemplatePaths() })
        );
        setData(re as Record<string, unknown>);
      } catch (e) {
        console.log(e);
      }
    };
    fetch();
  }, [collection, docId, template]);

  return template ? parseTemplate(template, data) : docId.toString();
};
