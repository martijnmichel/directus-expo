import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import React, { useState } from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Dictionary } from "lodash";
import { useTranslation } from "react-i18next";
import { Horizontal } from "../layout/Stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TableProps<T extends Record<string, unknown>> {
  headers?: { [key: string]: string };
  fields: string[];
  items?: T[];
  toolbarItems?: React.ReactNode;
  renderRow: (item: T) => (React.ReactNode | null)[];

  widths?: { [key: string]: number };
  onRowPress?: (item: T) => void;
  noDataText?: string;
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
  toolbarItems,
  fields,
  items = [],
  renderRow,
  widths = {},
  onRowPress,
  noDataText,
}: TableProps<T>) {
  const { styles } = useStyles(stylesheet);
  const { bottom } = useSafeAreaInsets();

  const [sort, setSort] = useState<SortConfig | null>(null);
  const { t } = useTranslation();

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

  const renderCell = (cell: React.ReactNode): React.ReactElement => {
    // Ensure we always return a React element wrapped in Text
    if (cell == null || cell === "") {
      return (
        <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>
          -
        </Text>
      );
    }

    // If it's already a React element, return it
    if (React.isValidElement(cell)) {
      if (cell.type === Text) {
        return React.cloneElement(cell as React.ReactElement, {
          numberOfLines: 1,
          style: [styles.cellText, styles.truncate, cell.props.style],
        });
      }
      return (
        <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>
          {cell}
        </Text>
      );
    }

    // For primitive types
    if (
      typeof cell === "string" ||
      typeof cell === "number" ||
      typeof cell === "boolean"
    ) {
      return (
        <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>
          {String(cell)}
        </Text>
      );
    }

    // For arrays or objects
    return (
      <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>
        {JSON.stringify(cell)}
      </Text>
    );
  };

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.tableContainer}>
        <ScrollView stickyHeaderIndices={[0]} style={{ flex: 1 }}>
          {fields.length > 0 && (
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                {fields.map((field, index) => (
                  <Pressable
                    key={field}
                    onPress={() => handleSort(index)}
                    style={[
                      styles.headerCell,
                      { width: getColumnWidth(field), flexShrink: 0 },
                    ]}
                  >
                    <Text
                      style={[styles.headerText, styles.truncate]}
                      numberOfLines={1}
                    >
                      {headers ? String(headers[field]) : String(field)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.bodyContainer}>
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
                      style={[
                        styles.cell,
                        { width: getColumnWidth(field), flexShrink: 0 },
                      ]}
                    >
                      {renderCell(cell)}
                    </View>
                  );
                })}
              </Pressable>
            ))}
          </View>

          <View style={{ height: (toolbarItems ? 140 : 70) + bottom }} />
        </ScrollView>

        <View style={[styles.floatingToolbar, { paddingBottom: bottom + 70 }]}>
          <Horizontal>{toolbarItems}</Horizontal>
        </View>
      </View>
      {!items.length && (
        <Text style={styles.noData}>
          {noDataText || t("components.table.noData")}
        </Text>
      )}
    </ScrollView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    width: "100%",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    flex: 1,
    minWidth: "100%",
    position: "relative",
  },
  floatingToolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
  },
  headerContainer: {
    backgroundColor: theme.colors.background,
    zIndex: 100,
  },
  headerRow: {
    display: "flex",
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
  },
  noData: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    padding: theme.spacing.lg,
  },
}));
