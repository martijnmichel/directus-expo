import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import React, { useState } from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Dictionary } from "lodash";

interface TableProps<T extends Record<string, unknown>> {
  headers?: { [key: string]: string };
  fields: string[];
  items?: T[];
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

export function Table<T extends Record<string, unknown>>({
  headers,
  fields,
  items = [],
  renderRow,
  maxHeight = 500,
  widths = {},
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

  const sortedItems = [...(items || [])].sort((a, b) => {
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

  // Calculate default width if not specified
  const defaultColumnWidth = 150; // Or any other reasonable default
  const getColumnWidth = (field: string) => {
    return widths[field] || defaultColumnWidth;
  };

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.tableContainer}>
        {fields.length && (
          <View style={styles.headerRow}>
            {fields.map((field, index) => (
              <Pressable
                key={index}
                onPress={() => handleSort(index)}
                style={[styles.headerCell, { width: getColumnWidth(field) }]}
              >
                <Text
                  style={[styles.headerText, styles.truncate]}
                  numberOfLines={1}
                >
                  {headers ? headers[field] : field}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <ScrollView style={[styles.bodyContainer, { maxHeight }]}>
          {sortedItems.map((item, rowIndex) => (
            <Pressable
              onPress={() => onRowPress?.(item)}
              key={rowIndex}
              style={styles.row}
            >
              {renderRow(item).map((cell, cellIndex) => {
                const field = fields[cellIndex];
                return (
                  <View
                    key={cellIndex}
                    style={[styles.cell, { width: getColumnWidth(field) }]}
                  >
                    {typeof cell === "string" || typeof cell === "number" ? (
                      <Text
                        style={[styles.cellText, styles.truncate]}
                        numberOfLines={1}
                      >
                        {String(cell)}
                      </Text>
                    ) : React.isValidElement(cell) ? (
                      cell
                    ) : (
                      <Text
                        style={[styles.cellText, styles.truncate]}
                        numberOfLines={1}
                      >
                        {String(cell)}
                      </Text>
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
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: "center",
    borderRightWidth: theme.borderWidth.md,
    borderRightColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    ...theme.typography.label,
    fontSize: 15,
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
    fontFamily: theme.typography.body.fontFamily,
    flex: 1,
  },
  cell: {
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  cellText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
    flexShrink: 1,
  },
  truncate: {
    overflow: "hidden",
    flexShrink: 1,
  },
}));
