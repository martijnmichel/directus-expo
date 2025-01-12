import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import React, { useState } from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface TableProps<T> {
  headers?: { [key: string]: string };
  fields: string[];
  items: T[];
  renderRow: (item: T) => React.ReactNode[];
  maxHeight?: number;
  widths?: { [key: string]: number };
  onRowPress?: (item: T) => void;
}

type SortConfig = {
  column: number;
  direction: "asc" | "desc";
};

function compareValues(a: any, b: any, direction: "asc" | "desc"): number {
  // Handle null/undefined values
  if (a == null) return direction === "asc" ? -1 : 1;
  if (b == null) return direction === "asc" ? 1 : -1;

  // Convert to numbers if both values are numeric strings
  const aNum = Number(a);
  const bNum = Number(b);
  if (!isNaN(aNum) && !isNaN(bNum)) {
    return direction === "asc" ? aNum - bNum : bNum - aNum;
  }

  // Handle strings (case-insensitive)
  const aStr = String(a).toLowerCase();
  const bStr = String(b).toLowerCase();
  return direction === "asc"
    ? aStr.localeCompare(bStr)
    : bStr.localeCompare(aStr);
}

export function Table<T>({
  headers,
  fields,
  items,
  renderRow,
  maxHeight = 500,
  widths,
  onRowPress,
}: TableProps<T>) {
  const { styles } = useStyles(stylesheet);
  const [sort, setSort] = useState<SortConfig | null>(null);

  console.log({ widths, headers, fields });

  const handleSort = (columnIndex: number) => {
    setSort((prev) => ({
      column: columnIndex,
      direction:
        prev?.column === columnIndex && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sort) return 0;

    const aValue = renderRow(a)[sort.column];
    const bValue = renderRow(b)[sort.column];

    // Extract text content if the cell is a ReactNode
    const aContent =
      typeof aValue === "string"
        ? aValue
        : typeof aValue === "number"
        ? aValue.toString()
        : React.isValidElement(aValue)
        ? // Try to get textContent from React elements
          aValue.props.children?.toString() || ""
        : "";

    const bContent =
      typeof bValue === "string"
        ? bValue
        : typeof bValue === "number"
        ? bValue.toString()
        : React.isValidElement(bValue)
        ? bValue.props.children?.toString() || ""
        : "";

    return compareValues(aContent, bContent, sort.direction);
  });

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.tableContainer}>
        <View style={styles.headerRow}>
          {fields.map((field, index) => {
            const hasDefinedWidth = widths?.[field] !== undefined;
            console.log(
              `Field ${field}: hasDefinedWidth=${hasDefinedWidth}, width=${widths?.[field]}`
            );

            return (
              <View
                key={index}
                style={[
                  styles.headerCell,
                  hasDefinedWidth ? { width: widths[field] } : { flex: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.headerText,
                    hasDefinedWidth && styles.truncate,
                  ]}
                  numberOfLines={1}
                >
                  {headers ? headers[field] : field}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView style={[styles.bodyContainer, { maxHeight }]}>
          {sortedItems.map((item, rowIndex) => (
            <Pressable
              onPress={() => onRowPress?.(item)}
              key={rowIndex}
              style={styles.row}
            >
              {renderRow(item).map((cell, cellIndex) => {
                const field = fields[cellIndex];
                const hasDefinedWidth = widths?.[field] !== undefined;

                return (
                  <View
                    key={cellIndex}
                    style={[
                      styles.cell,
                      hasDefinedWidth ? { width: widths[field] } : { flex: 1 },
                    ]}
                  >
                    {typeof cell === "string" ? (
                      <Text
                        style={[
                          styles.cellText,
                          hasDefinedWidth && styles.truncate,
                        ]}
                        numberOfLines={1}
                      >
                        {cell}
                      </Text>
                    ) : (
                      cell
                    )}
                  </View>
                );
              })}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    flex: 1,
    minWidth: "100%",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: theme.borderWidth.md,
    borderBottomColor: theme.colors.border,
  },
  headerCell: {
    padding: theme.spacing.sm,
    justifyContent: "center",
    minWidth: 0,
    borderRightWidth: theme.borderWidth.md,
    borderRightColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    fontWeight: "bold",
    color: theme.colors.textSecondary,
    textTransform: "capitalize",
    flexShrink: 1,
  },
  bodyContainer: {
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: theme.borderWidth.md,
    borderBottomColor: theme.colors.border,
    flex: 1,
  },
  cell: {
    padding: theme.spacing.lg,
    justifyContent: "center",
    minWidth: 0,
  },
  cellText: {
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  truncate: {
    overflow: "hidden",
    flexShrink: 1,
  },
}));
