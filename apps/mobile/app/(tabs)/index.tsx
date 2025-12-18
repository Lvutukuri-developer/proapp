import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Assignment = {
  id: string;
  title: string;
  due: string;
};

const STORAGE_KEYS = {
  assignments: "proapp.assignments.v1",
  completed: "proapp.completedIds.v1",
};

export default function HomeScreen() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: "1", title: "Math homework", due: "5:00 PM" },
    { id: "2", title: "Computer Science reading", due: "8:00 PM" },
    { id: "3", title: "Submit Canvas quiz", due: "11:59 PM" },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");

  // ---- Load saved data on first app open ----
  useEffect(() => {
    (async () => {
      try {
        const savedAssignments = await AsyncStorage.getItem(
          STORAGE_KEYS.assignments
        );
        const savedCompleted = await AsyncStorage.getItem(STORAGE_KEYS.completed);

        if (savedAssignments) {
          const parsed = JSON.parse(savedAssignments);
          if (Array.isArray(parsed)) setAssignments(parsed);
        }

        if (savedCompleted) {
          const parsed = JSON.parse(savedCompleted);
          if (Array.isArray(parsed)) setCompletedIds(parsed);
        }
      } catch (e) {
        // If storage is corrupted, we just ignore and continue with defaults
      }
    })();
  }, []);

  // ---- Save whenever assignments change ----
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.assignments,
          JSON.stringify(assignments)
        );
      } catch (e) {}
    })();
  }, [assignments]);

  // ---- Save whenever completedIds change ----
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.completed,
          JSON.stringify(completedIds)
        );
      } catch (e) {}
    })();
  }, [completedIds]);

  function toggleComplete(id: string) {
    if (completedIds.includes(id)) {
      setCompletedIds(completedIds.filter((x) => x !== id));
    } else {
      setCompletedIds([...completedIds, id]);
    }
  }

  function openAdd() {
    setNewTitle("");
    setNewDue("");
    setShowAdd(true);
  }

  function cancelAdd() {
    setShowAdd(false);
    setNewTitle("");
    setNewDue("");
  }

  function addTask() {
    const title = newTitle.trim();
    const due = newDue.trim();

    if (title.length === 0) return;

    const id = Date.now().toString();
    const newTask: Assignment = {
      id,
      title,
      due: due.length === 0 ? "No due time" : due,
    };

    setAssignments([newTask, ...assignments]);
    setShowAdd(false);
    setNewTitle("");
    setNewDue("");
  }

  const completedCount = completedIds.length;
  const totalCount = assignments.length;

  const progress = useMemo(() => {
    if (totalCount === 0) return 0;
    return completedCount / totalCount;
  }, [completedCount, totalCount]);

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.appName}>ProApp</Text>

            <View style={styles.headerRight}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {completedCount}/{totalCount} done
                </Text>
              </View>

              <Pressable
                onPress={openAdd}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.tagline}>Stay accountable. Ship your tasks.</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today</Text>
            <Text style={styles.sectionHint}>Tap to complete</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {assignments.map((a) => {
              const done = completedIds.includes(a.id);

              return (
                <Pressable
                  key={a.id}
                  onPress={() => toggleComplete(a.id)}
                  style={({ pressed }) => [
                    styles.card,
                    done && styles.cardDone,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.check, done && styles.checkDone]}>
                      <Text style={styles.checkText}>{done ? "✓" : ""}</Text>
                    </View>

                    <View style={styles.cardTextWrap}>
                      <Text style={[styles.cardTitle, done && styles.doneText]}>
                        {a.title}
                      </Text>

                      <View style={styles.metaRow}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>DUE</Text>
                        </View>
                        <Text style={styles.cardDue}>{a.due}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {assignments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No tasks yet</Text>
                <Text style={styles.emptyText}>Hit “+ Add” to create one.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Add Task Overlay */}
      {showAdd && (
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.overlayInner}
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add a task</Text>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Example: Finish ITSC reading"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
                autoFocus
              />

              <Text style={styles.inputLabel}>Due (optional)</Text>
              <TextInput
                value={newDue}
                onChangeText={setNewDue}
                placeholder="Example: 11:59 PM"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={cancelAdd}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={addTask}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                    newTitle.trim().length === 0 && styles.primaryBtnDisabled,
                  ]}
                  disabled={newTitle.trim().length === 0}
                >
                  <Text style={styles.primaryBtnText}>Add Task</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 18,
    maxWidth: 720,
    alignSelf: "center",
    width: "100%",
  },

  header: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#121A2B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.2,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#4F8CFF",
  },
  addButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 8,
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    marginTop: 14,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4F8CFF",
  },

  section: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#0F1728",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionHint: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 18,
  },

  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#121A2B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  cardDone: {
    opacity: 0.65,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    backgroundColor: "rgba(79,140,255,0.25)",
    borderColor: "rgba(79,140,255,0.75)",
  },
  checkText: {
    color: "white",
    fontWeight: "900",
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  doneText: {
    textDecorationLine: "line-through",
    color: "rgba(255,255,255,0.75)",
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  badgeText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cardDue: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyState: {
    marginTop: 22,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  emptyTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "600",
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 18,
    justifyContent: "center",
  },
  overlayInner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  modal: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#121A2B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modalTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#4F8CFF",
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
});
