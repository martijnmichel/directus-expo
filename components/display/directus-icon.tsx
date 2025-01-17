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

const iconMapping: Record<string, DirectusIconName> = {
  // Common UI icons
  add: "msAdd",
  arrow_back: "msArrowBack",
  arrow_forward: "msArrowForward",
  check: "msCheck",
  close: "msClose",
  delete: "msDelete",
  edit: "msEdit",
  email: "msMail",
  error: "msError",
  help: "msHelp",
  info: "msInfo",
  local_offer: "msLocalActivity",
  menu: "msMenu",
  more_vert: "msMoreVert",
  place: "msLocationOn",
  refresh: "msRefresh",
  search: "msSearch",
  settings: "msSettings",

  // Content/Files
  folder: "msFolder",
  image: "msImage",
  file: "msFilePresent",
  attachment: "msAttachFile",

  // Navigation
  home: "msHome",
  list: "msList",
  dashboard: "msDashboard",

  // Status/Actions
  visibility: "msVisibility",
  visibility_off: "msVisibilityOff",
  favorite: "msFavorite",
  favorite_border: "msFavorite",
  star: "msStar",
  star_border: "msStar",
  warning: "msWarning",
  lock: "msLock",
  lock_open: "msLockOpen",

  // Communication
  chat: "msChat",
  comment: "msComment",
  notifications: "msNotifications",
  phone: "msPhoneCallback",

  // Media
  play_arrow: "msPlayArrow",
  pause: "msPause",
  stop: "msStop",
  volume_up: "msVolumeUp",
  volume_off: "msVolumeOff",

  // Social
  person: "msPerson",
  people: "msGroup",
  group: "msGroup",
  share: "msShare",

  // Time
  access_time: "msSchedule",
  calendar_today: "msCalendarToday",
  event: "msEvent",
  schedule: "msSchedule",

  // Transportation
  directions: "msDirections",
  navigation: "msNavigation",
  map: "msMap",

  // Misc
  language: "msLanguage",
  print: "msPrint",
  sync: "msSync",
  cloud: "msCloud",
  cloud_upload: "msCloudUpload",
  cloud_download: "msCloudDownload",
};

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
    iconMapping[name] ||
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
