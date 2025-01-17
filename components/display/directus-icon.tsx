import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons/";

interface DirectusIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const DirectusIcon = ({ name, ...props }: DirectusIconProps) => {
  // Convert directus icon names to material icon names
  // e.g., "location_pin" -> "location-pin"
  const iconName = name?.replace(/_/g, "-");

  // Check if icon exists in MaterialCommunityIcons first
  if (iconName in MaterialCommunityIcons.glyphMap) {
    return (
      <MaterialCommunityIcons
        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
        {...props}
      />
    );
  }

  // Fallback to MaterialIcons
  return (
    <MaterialIcons
      name={iconName as keyof typeof MaterialIcons.glyphMap}
      {...props}
    />
  );
};
