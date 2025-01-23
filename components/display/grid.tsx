import { lightTheme } from "@/unistyles/theme";
import React from "react";
import { View, ViewStyle } from "react-native";
import {
  createStyleSheet,
  UnistylesBreakpoints,
  useStyles,
} from "react-native-unistyles";

type Breakpoint = keyof UnistylesBreakpoints;

interface GridProps {
  children: React.ReactNode;
  spacing?: keyof typeof lightTheme.spacing;
  cols: Partial<Record<Breakpoint, number>>;
  style?: ViewStyle;
}

interface GridItemProps {
  children: React.ReactNode;
  span?: number;
  spacing: number;
  totalColumns: number;
}

const GridItem: React.FC<GridItemProps> = ({
  children,
  span = 1,
  spacing,
  totalColumns,
}) => {
  return (
    <View
      style={{
        width: `${(span / totalColumns) * 100}%`,
        padding: spacing / 2,
        flexDirection: "column",
      }}
    >
      {children}
    </View>
  );
};

export const Grid: React.FC<GridProps> = ({
  children,
  spacing = "md",
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  style,
}) => {
  const { theme, breakpoint } = useStyles(stylesheet);

  // Get the appropriate column count based on breakpoint
  const getColumnCount = () => {
    const breakpoints: Breakpoint[] = ["xs", "sm", "md", "lg", "xl"];
    const currentBreakpointIndex = breakpoints.indexOf(
      breakpoint as Breakpoint
    );

    // Find the largest defined column count for current or smaller breakpoints
    let largestDefinedColumns = cols.xs || 1;

    // Go from xs up to current breakpoint
    for (let i = 0; i <= currentBreakpointIndex; i++) {
      const bp = breakpoints[i];
      if (cols[bp] !== undefined) {
        largestDefinedColumns = cols[bp]!;
      }
    }

    return largestDefinedColumns;
  };

  const currentColumns = getColumnCount();
  const spacingValue = theme.spacing[spacing];

  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          margin: -(spacingValue / 2),
        },
        style,
      ]}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;

        return (
          <GridItem
            key={child.key}
            spacing={spacingValue}
            totalColumns={currentColumns}
            span={child.props.span || 1}
          >
            {child}
          </GridItem>
        );
      })}
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  // Moved styles inline for better control
}));
