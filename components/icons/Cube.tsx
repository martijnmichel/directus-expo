import React from "react";
import Svg, { Path } from "react-native-svg";
import { IconProps } from "./types";

export const Cube = ({ size = 24, color = "#000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 16.61V7.39a2 2 0 0 0-1-1.73l-7-4.02a2 2 0 0 0-2 0l-7 4.02a2 2 0 0 0-1 1.73v9.22a2 2 0 0 0 1 1.73l7 4.02a2 2 0 0 0 2 0l7-4.02a2 2 0 0 0 1-1.73z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 22V12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.5 7L12 12l8.5-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
