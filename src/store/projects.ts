import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { YarnAppearance } from '@/components/yarn-ball';
import { ProjectColors, RetiredColors } from '@/constants/theme';
import { dayKey } from '@/lib/dates';
import type { ParsedStep } from '@/lib/parse-steps';
import { countsRows, lengthTarget } from '@/lib/step-rules';

export { countsRows };

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
  /** The pattern's full wording, when `text` is a shortened version of it. */
  detail?: string;
  /** How many stitches you should have once the step is done, when the pattern says. */
  stitches?: number;
  /** The pattern reader wasn't sure this is an instruction (see pattern-parser.ts). */
  unsure?: boolean;
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
  /** Knitting time already counted, in milliseconds (not including a running session). */
  knitMs?: number;
  /** When the knitting timer was started, while it's running. */
  timerStartedAt?: number;
  /** When a row was last counted or a step finished. */
  lastStitchAt?: number;
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
  /** How the painted yarn ball looks: thin and fuzzy, smooth, or chunky. */
  appearance?: YarnAppearance;
  createdAt: number;
  /** When it was last changed; older yarns only have createdAt. */
  updatedAt?: number;
};

/** Something deleted on this phone, remembered until the account has been told. */
export type Tombstone = { at: number; files?: string[] };

/** What this phone knows about the account it saves to. */
export type SyncMeta = {
  /** Whose account the knitting on this phone belongs to; null before the first sign-in. */
  userId: string | null;
  /** The server time of the newest change already fetched from the account. */
  pulledAt: string | null;
  /** `project:abc` → the change time the account has, so unchanged things aren't sent again. */
  versions: Record<string, number>;
  /** Pattern files already in the account, by stored name. */
  uploaded: Record<string, true>;
  /** Pattern files to remove from the account (their project or file was deleted). */
  removeFiles: string[];
};

export const emptySync: SyncMeta = { userId: null, pulledAt: null, versions: {}, uploaded: {}, removeFiles: [] };

/**
 * A timer left running stops counting this long after the last row (or after it was started):
 * a forgotten timer shouldn't turn a night's sleep into knitting time. Long enough for a slow round.
 */
export const TIMER_IDLE_MS = 30 * 60_000;

/** When a running session stops counting: now, or 30 minutes after the last row if that's earlier. */
function sessionEnd(p: Project, now: number) {
  const last = Math.max(p.timerStartedAt ?? 0, p.lastStitchAt ?? 0);
  return Math.min(now, last + TIMER_IDLE_MS);
}

/** Whether the timer is counting: started, and a row counted (or started) in the last 30 minutes. */
export function timerRunning(p: Project, now = Date.now()) {
  return !!p.timerStartedAt && sessionEnd(p, now) === now;
}

/** Stops a running timer, adding the session to the project's knitting time. */
function stopTimer(p: Project): Partial<Project> {
  if (!p.timerStartedAt) return {};
  const session = Math.max(0, sessionEnd(p, Date.now()) - p.timerStartedAt);
  return { knitMs: (p.knitMs ?? 0) + session, timerStartedAt: undefined };
}

/** Keeps the timer going, or starts a new session when it isn't running (or stopped counting a while ago). */
function resumeTimer(p: Project): Partial<Project> {
  if (timerRunning(p)) return {};
  return { ...stopTimer(p), timerStartedAt: Date.now() };
}

/** Total knitting time so far, including a running session. */
export function knitTime(p: Project, now = Date.now()) {
  return (p.knitMs ?? 0) + (p.timerStartedAt ? Math.max(0, sessionEnd(p, now) - p.timerStartedAt) : 0);
}

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

/**
 * Which step "undo one row" takes a row from: the current one, or — right after counting a step's
 * last row moved you on — the step before it. -1 when there are no steps (only the total counts);
 * undefined when there's nothing to undo.
 */
export function undoStepIndex(p: Project): number | undefined {
  const step = p.steps[p.currentStep];
  if (!step) return p.rowCount > 0 ? -1 : undefined;
  if (step.rowsDone > 0) return p.currentStep;
  const previous = p.steps[p.currentStep - 1];
  return previous && previous.rowsDone > 0 ? p.currentStep - 1 : undefined;
}

/** The row-specific instruction for the next row, when the step repeats a few rows. */
export function currentLine(step: Step): string | undefined {
  if (!step.lines?.length) return undefined;
  return step.lines[step.rowsDone % step.lines.length];
}

/** "Repeat rows 1–2 until the back measures 26 cm" → "26 cm": the length a step knits up to, when it says. */
export function untilLength(step: Step): string | undefined {
  return lengthTarget(step.text);
}

/**
 * For steps that repeat a few rows ("Repeat rows 1–2 7 times", "RS and WS rows 7 times each"):
 * which repeat you're on (`now` of `of`, when the pattern says how many) and which row of it.
 */
export function repeatInfo(step: Step): { size: number; now: number; of?: number; row: number } | undefined {
  const bothSides =
    !!step.rows && step.rows % 2 === 0 && /\btimes\s+each\b|\b(?:RS and WS|WS and RS)\b/i.test(step.text);
  const size = step.lines?.length || (bothSides ? 2 : 0);
  if (!size) return undefined;
  const of = step.rows ? Math.ceil(step.rows / size) : undefined;
  if (of !== undefined && of < 2) return undefined;
  // Once every row is counted, stay on the last one.
  const at = step.rows ? Math.min(step.rowsDone, step.rows - 1) : step.rowsDone;
  return { size, now: Math.floor(at / size) + 1, of, row: (at % size) + 1 };
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
type StepPatch = Partial<Pick<Step, 'text' | 'rows' | 'startSide' | 'inRound' | 'unsure'>>;

type ProjectsState = {
  projects: Project[];
  yarns: Yarn[];
  seenWelcome: boolean;
  /** Stitch help on the counter: Mrs Purl explains stitches like ssk under each row. Advanced knitters can turn it off. */
  stitchHelp: boolean;
  setStitchHelp: (on: boolean) => void;
  markWelcomeSeen: () => void;
  /** Which on-screen guides have been shown (or skipped) on this phone, by guide id. */
  seenTours: Record<string, true>;
  markTourSeen: (id: string) => void;
  /** Shows every guide again, from the profile. */
  resetTours: () => void;
  /** The knitter's name, for the account button. Only kept on this phone. */
  knitterName: string;
  setKnitterName: (name: string) => void;
  /** Rows counted per day ("2026-10-08" → 14), across all projects. A day is listed once you knit on it. */
  knitLog: Record<string, number>;
  /** When the name or the knitting log last changed, for saving them to the account. */
  profileUpdatedAt: number;
  /** Projects and yarns deleted here, keyed `project:id` / `yarn:id`, until the account knows. */
  deleted: Record<string, Tombstone>;
  sync: SyncMeta;
  /** Pattern files to remove from the account later. */
  queueRemoteFileDelete: (storedNames: string[]) => void;
  /** Removes everyone's knitting from this phone (after signing out); the welcome stays seen. */
  clearLocalData: () => void;
  addProject: (input: NewProject) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'notes' | 'files'>>) => void;
  deleteProject: (id: string) => void;
  finishProject: (id: string) => void;
  reopenProject: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;

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

      /** Marks today as a knitting day, adding `rows` to today's count. */
      const logKnitting = (rows: number) =>
        set((state) => {
          const today = dayKey(Date.now());
          return {
            knitLog: { ...state.knitLog, [today]: (state.knitLog[today] ?? 0) + rows },
            profileUpdatedAt: Date.now(),
          };
        });

      /** Takes an undone row back off today's count (the day stays a knitting day). */
      const unlogRow = () =>
        set((state) => {
          const today = dayKey(Date.now());
          const rows = state.knitLog[today];
          return rows ? { knitLog: { ...state.knitLog, [today]: rows - 1 }, profileUpdatedAt: Date.now() } : {};
        });

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
        stitchHelp: true,
        setStitchHelp: (on) => set({ stitchHelp: on }),
        seenTours: {},
        markTourSeen: (id) => set((state) => ({ seenTours: { ...state.seenTours, [id]: true } })),
        resetTours: () => set({ seenTours: {} }),
        knitterName: '',
        setKnitterName: (knitterName) => set({ knitterName, profileUpdatedAt: Date.now() }),
        knitLog: {},
        profileUpdatedAt: 0,
        deleted: {},
        sync: emptySync,
        queueRemoteFileDelete: (storedNames) =>
          set((state) => ({ sync: { ...state.sync, removeFiles: [...state.sync.removeFiles, ...storedNames] } })),
        clearLocalData: () =>
          set({ projects: [], yarns: [], knitterName: '', knitLog: {}, profileUpdatedAt: 0, deleted: {}, sync: emptySync }),

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
          set((state) => {
            const project = state.projects.find((p) => p.id === id);
            return {
              projects: state.projects.filter((p) => p.id !== id),
              deleted: { ...state.deleted, [`project:${id}`]: { at: Date.now(), files: project?.files.map((f) => f.storedName) } },
            };
          }),

        finishProject: (id) =>
          edit(id, (p) => ({ finishedAt: Date.now(), ...stopTimer(p) })),

        startTimer: (id) => {
          logKnitting(0);
          edit(id, (p) => resumeTimer(p));
        },
        pauseTimer: (id) => edit(id, (p) => stopTimer(p)),
        reopenProject: (id) => edit(id, () => ({ finishedAt: undefined })),

        increment: (id) => {
          logKnitting(1);
          edit(id, (p) => {
            const steps = p.steps.map((s, i) => (i === p.currentStep ? { ...s, rowsDone: s.rowsDone + 1 } : s));
            const step = steps[p.currentStep];
            let currentStep = p.currentStep;
            // Counting a step's last row finishes it: go straight on to the next step instead of
            // showing the finished one again. The last step waits for "Finish project".
            if (step?.rows && step.rowsDone >= step.rows) {
              const next = steps.findIndex((s, i) => i > p.currentStep && !s.done);
              if (next !== -1) {
                steps[p.currentStep] = { ...step, done: true };
                currentStep = next;
              }
            }
            return {
              ...resumeTimer(p),
              lastStitchAt: Date.now(),
              rowCount: p.rowCount + 1,
              steps,
              currentStep,
            };
          });
        },

        decrement: (id) =>
          edit(id, (p) => {
            const index = undoStepIndex(p);
            if (index === undefined) return {};
            unlogRow();
            return {
              rowCount: Math.max(0, p.rowCount - 1),
              currentStep: index === -1 ? p.currentStep : index,
              steps: p.steps.map((s, i) => (i === index ? { ...s, rowsDone: s.rowsDone - 1, done: false } : s)),
            };
          }),

        resetProgress: (id) =>
          edit(id, (p) => ({
            rowCount: 0,
            currentStep: 0,
            steps: p.steps.map((s) => ({ ...s, rowsDone: 0, done: false })),
          })),

        goToStep: (id, index) =>
          edit(id, (p) => {
            const to = clampIndex(index, p.steps.length);
            // Jumping ahead means the steps before it are knitted: tick them off. Jumping back changes nothing else.
            if (to <= p.currentStep) return { currentStep: to };
            return { currentStep: to, steps: p.steps.map((s, i) => (i < to && !s.done ? { ...s, done: true } : s)) };
          }),

        completeStep: (id) => {
          // Moving on means you're knitting: start the timer if it isn't running.
          logKnitting(0);
          edit(id, (p) => {
            const steps = p.steps.map((s, i) => (i === p.currentStep ? { ...s, done: true } : s));
            const next = steps.findIndex((s, i) => i > p.currentStep && !s.done);
            return {
              steps,
              currentStep: next === -1 ? p.currentStep : next,
              ...resumeTimer(p),
              lastStitchAt: Date.now(),
            };
          });
        },

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
          set((state) => {
            const now = Date.now();
            return { yarns: [{ ...yarn, id: newId(), createdAt: now, updatedAt: now }, ...state.yarns] };
          }),
        deleteYarn: (id) =>
          set((state) => ({
            yarns: state.yarns.filter((y) => y.id !== id),
            deleted: { ...state.deleted, [`yarn:${id}`]: { at: Date.now() } },
          })),
      };
    },
    {
      name: 'dropstitch-projects',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        yarns: state.yarns,
        seenWelcome: state.seenWelcome,
        stitchHelp: state.stitchHelp,
        seenTours: state.seenTours,
        knitterName: state.knitterName,
        knitLog: state.knitLog,
        profileUpdatedAt: state.profileUpdatedAt,
        deleted: state.deleted,
        sync: state.sync,
      }),
      // v1 projects had no box colour; later ones may have a colour the app has since retired.
      migrate: (persisted, version) => {
        const state = persisted as { projects?: Project[] };
        if (version < 2 && state.projects) {
          state.projects = state.projects.map((p, i) => ({
            ...p,
            color: p.color ?? ProjectColors[i % ProjectColors.length],
          }));
        }
        if (version < 4 && state.projects) {
          state.projects = state.projects.map((p) => ({ ...p, color: RetiredColors[p.color] ?? p.color }));
        }
        return state as ProjectsState;
      },
    }
  )
);

/** "Mariana Petropoulou" → "MP"; empty when no name is set. */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

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
