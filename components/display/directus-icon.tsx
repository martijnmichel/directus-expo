import { MaterialIcons } from "@expo/vector-icons/";

interface DirectusIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const DirectusIcon = ({ name, ...props }: DirectusIconProps) => {
  // Convert directus icon names to material icon names if needed
  // e.g., "location_pin" -> "location-pin"
  const iconName = name?.replace(
    /_/g,
    "-"
  ) as keyof typeof MaterialIcons.glyphMap;

  return <MaterialIcons name={iconName} {...props} />;
};
