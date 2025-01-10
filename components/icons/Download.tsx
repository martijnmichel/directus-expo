import React from "react";
import Svg, { Path } from "react-native-svg";
import { IconProps } from "./types";

export const Download = ({ size = 24, color = "#000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 10l5 5 5-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15V3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
