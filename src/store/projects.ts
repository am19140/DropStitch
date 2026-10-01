import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ProjectColors } from '@/constants/theme';
import type { ParsedStep } from '@/lib/parse-steps';

export type PatternFile = {
  id: string;
  /** Original file name shown to the user. */
  name: string;
  kind: 'pdf' | 'image';
  mimeType: string;
  /** Name of the copy kept in the app's pattern storage (see lib/pattern-files). */
  storedName: string;
};

export type Step = {
  id: string;
  text: string;
  /** How many rows this step takes, when known. */
  rows?: number;
  rowsDone: number;
  done: boolean;
  /** Part of the pattern this step belongs to, e.g. "Left shoulder". */
  section?: string;
  /** Side of the first row in this step, for knitting worked back and forth. */
  startSide?: Side;
  /** Worked in the round (no right/wrong side rows). */
  inRound?: boolean;
  /** Row-by-row instructions that repeat, e.g. ["Row 1 (RS): k1, p1", "Row 2 (WS): purl"]. */
  lines?: string[];
};

export type Side = 'RS' | 'WS';

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  files: PatternFile[];
  steps: Step[];
  currentStep: number;
  /** Total rows knitted on this project. */
  rowCount: number;
  notes: string;
  /** Size being knitted, when the pattern has several. */
  size?: string;
  /** Colour of the project's box (from the palette in constants/theme). */
  color: string;
  /** Set when the project is finished; finished projects move to "Finished". */
  finishedAt?: number;
  /** Where the knitter left the row marker and scroll position in the pattern viewer. */
  viewer?: { markerY?: number; scrollY?: number };
};

export type Yarn = {
  id: string;
  /** Optional name, e.g. "Drops Merino Extra Fine". */
  name: string;
  colorName: string;
  hex: string;
  material: string;
  /** Needle sizes that fit, e.g. ["4 mm"]. Optional. */
  needles: string[];
  createdAt: number;
};

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function makeStep(step: ParsedStep): Step {
  return { ...step, id: newId(), rowsDone: 0, done: false };
}

/** Which side the next row is on, or undefined when it isn't known. */
export function currentSide(step: Step): Side | undefined {
  if (step.inRound || !step.startSide) return undefined;
  const even = step.rowsDone % 2 === 0;
  return even ? step.startSide : step.startSide === 'RS' ? 'WS' : 'RS';
}

/** The row-specific instruction for the next row, when the step repeats a few rows. */
export function currentLine(step: Step): string | undefined {
  if (!step.lines?.length) return undefined;
  return step.lines[step.rowsDone % step.lines.length];
}

export function projectTitle(project: Project) {
  return project.name.trim() || 'Untitled pattern';
}

export function projectProgress(project: Project) {
  const total = project.steps.length;
  const done = project.steps.filter((s) => s.done).length;
  return { done, total, fraction: total === 0 ? 0 : done / total };
}

type NewProject = { name: string; files: PatternFile[]; steps: ParsedStep[]; size?: string };
type NewYarn = Omit<Yarn, 'id' | 'createdAt'>;
type StepPatch = Partial<Pick<Step, 'text' | 'rows' | 'startSide' | 'inRound'>>;

type ProjectsState = {
  projects: Project[];
  yarns: Yarn[];
  seenWelcome: boolean;
  markWelcomeSeen: () => void;
  addProject: (input: NewProject) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'notes' | 'files'>>) => void;
  deleteProject: (id: string) => void;
  finishProject: (id: string) => void;
  reopenProject: (id: string) => void;

  increment: (id: string) => void;
  decrement: (id: string) => void;
  resetProgress: (id: string) => void;

  goToStep: (id: string, index: number) => void;
  completeStep: (id: string) => void;
  toggleStepDone: (id: string, stepId: string) => void;
  addSteps: (id: string, steps: ParsedStep[]) => void;
  updateStep: (id: string, stepId: string, patch: StepPatch) => void;
  deleteStep: (id: string, stepId: string) => void;
  moveStep: (id: string, stepId: string, direction: -1 | 1) => void;

  setViewer: (id: string, patch: NonNullable<Project['viewer']>) => void;

  addYarn: (yarn: NewYarn) => void;
  deleteYarn: (id: string) => void;
};

const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, length - 1));

export const useProjects = create<ProjectsState>()(
  persist(
    (set) => {
      const edit = (id: string, change: (project: Project) => Partial<Project>) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...change(p), updatedAt: Date.now() } : p
          ),
        }));

      const editSteps = (id: string, change: (steps: Step[]) => Step[]) =>
        edit(id, (p) => {
          const steps = change(p.steps);
          return { steps, currentStep: clampIndex(p.currentStep, steps.length) };
        });

      return {
        projects: [],
        yarns: [],
        seenWelcome: false,
        markWelcomeSeen: () => set({ seenWelcome: true }),

        addProject: ({ name, files, steps, size }) => {
          const now = Date.now();
          const used = useProjects.getState().projects.length;
          const project: Project = {
            id: newId(),
            name,
            createdAt: now,
            updatedAt: now,
            files,
            steps: steps.map(makeStep),
            currentStep: 0,
            rowCount: 0,
            notes: '',
            size,
            color: ProjectColors[used % ProjectColors.length],
          };
          set((state) => ({ projects: [project, ...state.projects] }));
          return project.id;
        },

        updateProject: (id, patch) => edit(id, () => patch),

        deleteProject: (id) =>
          set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

        finishProject: (id) => edit(id, () => ({ finishedAt: Date.now() })),
        reopenProject: (id) => edit(id, () => ({ finishedAt: undefined })),

        increment: (id) =>
          edit(id, (p) => ({
            rowCount: p.rowCount + 1,
            steps: p.steps.map((s, i) =>
              i === p.currentStep ? { ...s, rowsDone: s.rowsDone + 1 } : s
            ),
          })),

        decrement: (id) =>
          edit(id, (p) => {
            const step = p.steps[p.currentStep];
            // Only undo rows that were counted, so the step and total counts stay in sync.
            if (step ? step.rowsDone === 0 : p.rowCount === 0) return {};
            return {
              rowCount: Math.max(0, p.rowCount - 1),
              steps: p.steps.map((s, i) =>
                i === p.currentStep ? { ...s, rowsDone: s.rowsDone - 1 } : s
              ),
            };
          }),

        resetProgress: (id) =>
          edit(id, (p) => ({
            rowCount: 0,
            currentStep: 0,
            steps: p.steps.map((s) => ({ ...s, rowsDone: 0, done: false })),
          })),

        goToStep: (id, index) =>
          edit(id, (p) => ({ currentStep: clampIndex(index, p.steps.length) })),

        completeStep: (id) =>
          edit(id, (p) => {
            const steps = p.steps.map((s, i) => (i === p.currentStep ? { ...s, done: true } : s));
            const next = steps.findIndex((s, i) => i > p.currentStep && !s.done);
            return { steps, currentStep: next === -1 ? p.currentStep : next };
          }),

        toggleStepDone: (id, stepId) =>
          editSteps(id, (steps) =>
            steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s))
          ),

        addSteps: (id, newSteps) =>
          editSteps(id, (steps) => [...steps, ...newSteps.map(makeStep)]),

        updateStep: (id, stepId, patch) =>
          editSteps(id, (steps) => steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s))),

        deleteStep: (id, stepId) =>
          edit(id, (p) => {
            const index = p.steps.findIndex((s) => s.id === stepId);
            const steps = p.steps.filter((s) => s.id !== stepId);
            const current = index !== -1 && index < p.currentStep ? p.currentStep - 1 : p.currentStep;
            return { steps, currentStep: clampIndex(current, steps.length) };
          }),

        moveStep: (id, stepId, direction) =>
          edit(id, (p) => {
            const from = p.steps.findIndex((s) => s.id === stepId);
            const to = from + direction;
            if (from === -1 || to < 0 || to >= p.steps.length) return {};
            const steps = [...p.steps];
            [steps[from], steps[to]] = [steps[to], steps[from]];
            // Keep the "current" marker on the same step it was on.
            const currentId = p.steps[p.currentStep]?.id;
            return { steps, currentStep: Math.max(0, steps.findIndex((s) => s.id === currentId)) };
          }),

        // Not routed through edit(): viewer position isn't a change worth bumping updatedAt for.
        setViewer: (id, patch) =>
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id ? { ...p, viewer: { ...p.viewer, ...patch } } : p
            ),
          })),

        addYarn: (yarn) =>
          set((state) => ({ yarns: [{ ...yarn, id: newId(), createdAt: Date.now() }, ...state.yarns] })),
        deleteYarn: (id) => set((state) => ({ yarns: state.yarns.filter((y) => y.id !== id) })),
      };
    },
    {
      name: 'dropstitch-projects',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        yarns: state.yarns,
        seenWelcome: state.seenWelcome,
      }),
      // v1 projects had no box colour.
      migrate: (persisted, version) => {
        const state = persisted as { projects?: Project[] };
        if (version < 2 && state.projects) {
          state.projects = state.projects.map((p, i) => ({
            ...p,
            color: p.color ?? ProjectColors[i % ProjectColors.length],
          }));
        }
        return state as ProjectsState;
      },
    }
  )
);

export function useProject(id: string | undefined) {
  return useProjects((state) => state.projects.find((p) => p.id === id));
}

/** True once saved projects have been loaded from storage. */
export function useProjectsHydrated() {
  return useSyncExternalStore(
    (onChange) => useProjects.persist.onFinishHydration(onChange),
    () => useProjects.persist.hasHydrated(),
    () => false
  );
}
