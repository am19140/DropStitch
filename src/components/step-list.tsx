import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { detectRows, parseSteps } from "@/lib/parse-steps";
import { useProjects, type Project, type Step } from "@/store/projects";

type Editing =
  { mode: "edit"; step: Step } | { mode: "add" } | { mode: "paste" } | null;

export function StepList({ project }: { project: Project }) {
  const theme = useTheme();
  const [editing, setEditing] = useState<Editing>(null);
  const { goToStep, toggleStepDone } = useProjects(
    useShallow((s) => ({
      goToStep: s.goToStep,
      toggleStepDone: s.toggleStepDone,
    })),
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.list}>
        {project.steps.length === 0 && (
          <View style={styles.empty}>
            <ThemedText type="smallBold">No steps yet</ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.center}
            >
              Add the steps of your pattern to tick them off as you go — or just
              use the row counter below.
            </ThemedText>
          </View>
        )}

        {project.steps.map((step, index) => {
          const current = index === project.currentStep;
          const newSection =
            step.section && step.section !== project.steps[index - 1]?.section;
          return (
            <View key={step.id} style={styles.item}>
              {newSection ? (
                <ThemedText
                  type="eyebrow"
                  themeColor="textSecondary"
                  style={styles.sectionLabel}
                >
                  {step.section!.toUpperCase()}
                </ThemedText>
              ) : null}
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: current ? theme.pink : theme.surface,
                    borderColor: current ? theme.pink : "transparent",
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: step.done }}
                  accessibilityLabel={
                    step.done ? "Mark as not done" : "Mark as done"
                  }
                  hitSlop={10}
                  onPress={() => toggleStepDone(project.id, step.id)}
                  style={[
                    styles.check,
                    {
                      borderColor: step.done
                        ? theme.success
                        : theme.textSecondary,
                      backgroundColor: step.done
                        ? theme.success
                        : "transparent",
                    },
                  ]}
                >
                  {step.done && (
                    <Icon name="check" size={16} color={theme.onPrimary} />
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Step ${index + 1}: ${step.text}`}
                  accessibilityHint="Makes this the current step"
                  onPress={() => goToStep(project.id, index)}
                  style={({ pressed }) => [
                    styles.rowBody,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <ThemedText style={step.done && styles.doneText}>
                    <ThemedText themeColor="textSecondary">
                      {index + 1}.{" "}
                    </ThemedText>
                    {step.text}
                  </ThemedText>
                  {(step.rows || current || step.rowsDone > 0) && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {step.rows
                        ? `${step.rowsDone} / ${step.rows} rows`
                        : `${step.rowsDone} rows`}
                      {current ? "  ·  CURRENT" : ""}
                    </ThemedText>
                  )}
                </Pressable>

                <Button
                  icon="edit"
                  variant="ghost"
                  size="small"
                  accessibilityLabel={`Edit step ${index + 1}`}
                  onPress={() => setEditing({ mode: "edit", step })}
                />
              </View>
            </View>
          );
        })}

        <View style={styles.footer}>
          <Button
            label="Add step"
            icon="add"
            variant="secondary"
            onPress={() => setEditing({ mode: "add" })}
            style={styles.flex}
          />
          <Button
            label="Paste steps"
            icon="file"
            variant="secondary"
            onPress={() => setEditing({ mode: "paste" })}
            style={styles.flex}
          />
        </View>
      </ScrollView>

      {editing?.mode === "paste" ? (
        <PasteStepsSheet
          projectId={project.id}
          onClose={() => setEditing(null)}
        />
      ) : editing ? (
        <StepEditorSheet
          key={editing.mode === "edit" ? editing.step.id : "new"}
          projectId={project.id}
          step={editing.mode === "edit" ? editing.step : undefined}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function StepEditorSheet({
  projectId,
  step,
  onClose,
}: {
  projectId: string;
  step?: Step;
  onClose: () => void;
}) {
  const { addSteps, updateStep, deleteStep, moveStep } = useProjects(
    useShallow((s) => ({
      addSteps: s.addSteps,
      updateStep: s.updateStep,
      deleteStep: s.deleteStep,
      moveStep: s.moveStep,
    })),
  );
  const [text, setText] = useState(step?.text ?? "");
  const [rows, setRows] = useState(step?.rows ? String(step.rows) : "");

  const parsedRows = Number.parseInt(rows, 10);
  const rowsValue = parsedRows > 0 ? parsedRows : undefined;

  const save = () => {
    const trimmed = text.trim();
    if (step)
      updateStep(projectId, step.id, { text: trimmed, rows: rowsValue });
    else
      addSteps(projectId, [
        { text: trimmed, rows: rowsValue ?? detectRows(trimmed) },
      ]);
    onClose();
  };

  return (
    <Sheet
      visible
      title={step ? "Edit step" : "New step"}
      onClose={onClose}
      actionLabel="Save"
      actionDisabled={text.trim().length === 0}
      onAction={save}
    >
      <TextField
        label="Instructions"
        value={text}
        onChangeText={setText}
        placeholder="e.g. Rows 1-10: k2, p2 rib"
        multiline
        autoFocus={!step}
      />
      <TextField
        label="Number of rows (optional)"
        value={rows}
        onChangeText={(value) => setRows(value.replace(/[^0-9]/g, ""))}
        placeholder="e.g. 10"
        keyboardType="number-pad"
        maxLength={4}
        hint={
          step
            ? "Leave empty if this step has no set number of rows."
            : 'Leave empty to work it out from the text, like "Rows 1-10".'
        }
      />
      {step && (
        <View style={styles.editActions}>
          <Button
            label="Move up"
            icon="up"
            variant="secondary"
            size="small"
            onPress={() => moveStep(projectId, step.id, -1)}
          />
          <Button
            label="Move down"
            icon="down"
            variant="secondary"
            size="small"
            onPress={() => moveStep(projectId, step.id, 1)}
          />
          <Button
            label="Delete"
            icon="trash"
            variant="danger"
            size="small"
            onPress={() => {
              deleteStep(projectId, step.id);
              onClose();
            }}
          />
        </View>
      )}
    </Sheet>
  );
}

function PasteStepsSheet({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const addSteps = useProjects((s) => s.addSteps);
  const [text, setText] = useState("");
  const parsed = parseSteps(text);

  return (
    <Sheet
      visible
      title="Paste steps"
      onClose={onClose}
      actionLabel={parsed.length > 0 ? `Add ${parsed.length}` : "Add"}
      actionDisabled={parsed.length === 0}
      onAction={() => {
        addSteps(projectId, parsed);
        onClose();
      }}
    >
      <TextField
        label="Pattern text"
        value={text}
        onChangeText={setText}
        placeholder={
          "Rows 1-10: k2, p2 rib\nRow 11: knit\nKnit 20 rows in stockinette"
        }
        multiline
        autoFocus
        style={styles.pasteInput}
        hint="Each line becomes a step. Lines like “Rows 1-10” or “knit 20 rows” get a row count automatically."
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  item: {
    gap: Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.three,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  center: {
    textAlign: "center",
    maxWidth: 320,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    borderRadius: 14,
    borderWidth: 2,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.three,
  },
  doneText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  editActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  pasteInput: {
    minHeight: 240,
  },
});
