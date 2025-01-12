import { View, Text, ScrollView, StyleSheet } from "react-native";
import React, { useState } from "react";
import { useStyles } from "react-native-unistyles";

interface TableProps<T> {
  headers: string[];
  items: T[];
  renderRow: (item: T) => React.ReactNode[];
  maxHeight?: number;
  widths?: number[];
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
  items,
  renderRow,
  maxHeight = 500,
  widths,
}: TableProps<T>) {
  const { styles } = useStyles(stylesheet);
  const [sort, setSort] = useState<SortConfig | null>(null);

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
          {headers.map((header, index) => (
            <View
              key={index}
              style={[
                styles.headerCell,
                widths?.[index] ? { width: widths[index] } : { flex: 1 },
              ]}
            >
              <Text
                style={[styles.headerText, widths?.[index] && styles.truncate]}
                numberOfLines={1}
              >
                {header}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView style={[styles.bodyContainer, { maxHeight }]}>
          {sortedItems.map((item, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {renderRow(item).map((cell, cellIndex) => (
                <View
                  key={cellIndex}
                  style={[
                    styles.cell,
                    widths?.[cellIndex]
                      ? { width: widths[cellIndex] }
                      : { flex: 1 },
                  ]}
                >
                  {typeof cell === "string" ? (
                    <Text
                      style={[
                        styles.cellText,
                        widths?.[cellIndex] && styles.truncate,
                      ]}
                      numberOfLines={1}
                    >
                      {cell}
                    </Text>
                  ) : (
                    cell
                  )}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const stylesheet = StyleSheet.create({
  container: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
  },
  tableContainer: {
    width: "100%",
    minWidth: "100%",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    width: "100%",
  },
  headerCell: {
    padding: 12,
    justifyContent: "center",
    minWidth: 0,
  },
  headerText: {
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    flexShrink: 1,
  },
  bodyContainer: {
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cell: {
    padding: 12,
    justifyContent: "center",
    minWidth: 0,
  },
  cellText: {
    color: "#374151",
    flexShrink: 1,
  },
  truncate: {
    overflow: "hidden",
    flexShrink: 1,
  },
});
