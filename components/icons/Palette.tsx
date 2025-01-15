import React from "react";
import Svg, { Path } from "react-native-svg";
import { IconProps } from "./types";

export const Palette = ({ size = 24, color = "#000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.51-.19-1-.51-1.36-.32-.37-.49-.83-.49-1.31 0-1.1.9-2 2-2h2.5c2.48 0 4.5-2.02 4.5-4.5 0-5.52-4.48-8.83-10-8.83z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
