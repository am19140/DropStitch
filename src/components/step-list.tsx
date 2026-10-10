import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, Spacing } from "@/constants/theme";
import { detectRows, parseSteps } from "@/lib/parse-steps";
import { useProjects, type Project, type Step } from "@/store/projects";

type Editing =
  { mode: "edit"; step: Step } | { mode: "add" } | { mode: "paste" } | null;

const C = Colors.light;

/** The pattern's steps as a thread of beads: done ones checked, the current one ringed in blue. */
export function StepList({ project }: { project: Project }) {
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
          const last = index === project.steps.length - 1;
          const newSection =
            step.section && step.section !== project.steps[index - 1]?.section;
          return (
            <View key={step.id}>
              {newSection ? (
                <Text style={styles.sectionLabel}>{step.section}</Text>
              ) : null}
              <View style={[styles.row, current && styles.rowCurrent]}>
                {/* The thread down the side, dark where the knitting is done. */}
                {!last && (
                  <View
                    style={[
                      styles.thread,
                      { backgroundColor: step.done ? C.text : C.cardLine },
                    ]}
                  />
                )}
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
                    step.done && styles.checkDone,
                    current && !step.done && styles.checkCurrent,
                  ]}
                >
                  {step.done ? (
                    <Icon name="check" size={15} color={C.surface} strokeWidth={2.6} />
                  ) : current ? (
                    <View style={styles.currentDot} />
                  ) : null}
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
                  <Text
                    style={[
                      styles.stepText,
                      current && styles.stepTextCurrent,
                      !step.done && !current && { color: C.textSecondary },
                    ]}
                    numberOfLines={3}
                  >
                    {index + 1}. {step.text}
                  </Text>
                  {(step.rows || current || step.rowsDone > 0) && (
                    <Text style={styles.stepSub}>
                      {step.rows
                        ? `${step.rowsDone} / ${step.rows} rows`
                        : `${step.rowsDone} rows`}
                      {current ? " · current" : ""}
                    </Text>
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
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    marginLeft: 44,
    fontFamily: Fonts.display,
    fontSize: 16,
    color: C.text,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
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
    alignItems: "flex-start",
    gap: 14,
    marginHorizontal: -8,
    paddingLeft: 8,
    paddingTop: 10,
    borderRadius: 16,
  },
  rowCurrent: {
    backgroundColor: C.skySoft,
  },
  thread: {
    position: "absolute",
    left: 21,
    top: 40,
    bottom: -10,
    width: 2,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  checkCurrent: {
    borderWidth: 2.5,
    borderColor: C.primary,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  rowBody: {
    flex: 1,
    gap: 2,
    paddingTop: 3,
    paddingBottom: 12,
  },
  stepText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 21,
    color: C.text,
  },
  stepTextCurrent: {
    fontFamily: Fonts.extrabold,
  },
  stepSub: {
    fontFamily: Fonts.semibold,
    fontSize: 12.5,
    color: C.textSecondary,
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
