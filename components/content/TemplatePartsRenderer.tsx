import { ParsedTemplatePart } from "@/helpers/document/template";
import { Text } from "../display/typography";
import { Thumbnail } from "./Thumbnail";

const preserveWhitespace = (value: string) => {
  // React Native may trim/collapse normal spaces at Text boundaries.
  // NBSP keeps template spacing intact across split parts.
  return value.replace(/ /g, "\u00A0");
};

export const TemplatePartsRenderer = ({
  parts,
}: {
  parts: ParsedTemplatePart[];
}) => {
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "thumbnail") {
          return !!part.value && (
            <Thumbnail
              key={`thumbnail-${index}-${part.value}`}
              id={part.value}
              style={{ width: 22, height: 22, borderRadius: 4 }}
            />
          );
        }

        return (
          <Text key={`text-${index}-${part.value}`} numberOfLines={1} style={{ flexShrink: 1 }}>
            {preserveWhitespace(part.value)}
          </Text>
        );
      })}
    </>
  );
};
