import { View, Text, Pressable, StyleSheet } from "react-native";

interface PaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
}: PaginationProps) {
  const showPrevious = page > 1;
  const showNext = page < totalPages;

  return (
    <View style={styles.container}>
      <Text style={styles.info}>
        {`${(page - 1) * limit + 1}-${Math.min(
          page * limit,
          total
        )} of ${total}`}
      </Text>

      <View style={styles.buttons}>
        <Pressable
          onPress={() => showPrevious && onPageChange(page - 1)}
          disabled={!showPrevious}
          style={[styles.button, !showPrevious && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </Pressable>

        <Text style={styles.pageInfo}>{`Page ${page} of ${totalPages}`}</Text>

        <Pressable
          onPress={() => showNext && onPageChange(page + 1)}
          disabled={!showNext}
          style={[styles.button, !showNext && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    fontSize: 14,
    color: "#666",
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
    color: "#666",
  },
});
