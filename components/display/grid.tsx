import { lightTheme } from "@/unistyles/theme";
import React from "react";
import { View } from "react-native";
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
  padding?: keyof typeof lightTheme.spacing;
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
  const { styles } = useStyles(stylesheet);

  return (
    <View
      style={[
        styles.gridItem,
        {
          width: `${(span / totalColumns) * 100}%`,
          padding: spacing / 2,
        },
      ]}
    >
      {children}
    </View>
  );
};

export const Grid: React.FC<GridProps> = ({
  children,
  spacing = "md",
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  padding = "xs",
}) => {
  const { styles, theme, breakpoint } = useStyles(stylesheet);

  const currentColumns = cols[breakpoint] || 1;
  const spacingValue = theme.spacing[spacing];
  const paddingValue = theme.spacing[padding];

  return (
    <View
      style={[
        styles.container,
        {
          padding: paddingValue,
          margin: -(spacingValue / 2),
        },
      ]}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;

        return (
          <GridItem
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
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    flexDirection: "column",
  },
}));
