import { MsIcon } from "material-symbols-react-native";
import * as msIconDefinition from "@material-symbols-react-native/outlined-400";

export type DirectusIconName = keyof typeof msIconDefinition;

interface DirectusIconProps {
  name: DirectusIconName;
  size?: number;
  color?: string;
}

// Debug helper to find exact icon names
const findSimilarIcons = (searchTerm: string) => {
  return Object.keys(msIconDefinition).filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Log available icons for debugging
console.log(
  'Icons containing "confirmation":',
  findSimilarIcons("confirmation")
);
console.log('Icons containing "timer":', findSimilarIcons("timer"));

export const DirectusIcon = ({
  name,
  size,
  color,
  ...props
}: DirectusIconProps) => {
  // Convert directus icon name to material symbols name format
  // e.g., "confirmation_number" -> "msConfirmationNumber"
  // e.g., "timer_3_alt_1" -> "msTimer_3Alt_1"
  const iconName =
    "ms" +
    name
      .split("_")
      .map((part, index) => {
        if (index === 0) {
          // First word is always capitalized
          return part.charAt(0).toUpperCase() + part.slice(1);
        }
        // If it's a number, keep it with underscore
        if (!isNaN(Number(part))) {
          return "_" + part;
        }
        // For other parts, capitalize without underscore
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("");

  // Get the icon definition
  const iconDef = msIconDefinition[iconName as DirectusIconName];

  if (!iconDef) {
    console.warn(
      `Icon "${name}" not found, transformed to "${iconName}". Available similar icons:`,
      findSimilarIcons(name.split("_")[0])
    );
    return null;
  }

  return <MsIcon icon={iconDef} size={size} color={color} {...props} />;
};
