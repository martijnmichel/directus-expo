import React from "react";
import Svg, { Path } from "react-native-svg";
import { IconProps } from "./types";

// Approximation of Lucide "arrow-left-right" icon
export const Switch = ({ size = 24, color = "#000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Left-right arrows with horizontal line */}
    <Path
      d="M17 8L21 12L17 16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 12H21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 8L3 12L7 16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
