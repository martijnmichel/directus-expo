import { MsIcon } from "material-symbols-react-native";
import * as msIconDefinition from "@material-symbols-react-native/outlined-400";

export type DirectusIconName = keyof typeof msIconDefinition;

interface DirectusIconProps {
  name: DirectusIconName;
  size?: number;
  color?: string;
}

export const DirectusIcon = ({
  name,
  size,
  color,
  ...props
}: DirectusIconProps) => {
  // Convert directus icon name to material symbols name format
  // e.g., "avg_pace" -> "msAvgPace"
  const iconName =
    "ms" +
    name
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

  // Get the icon definition
  const iconDef = msIconDefinition[iconName as DirectusIconName];

  if (!iconDef) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <MsIcon icon={iconDef} size={size} color={color} {...props} />;
};
