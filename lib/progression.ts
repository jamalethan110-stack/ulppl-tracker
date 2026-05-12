import type { Focus, ExerciseSet, Day } from "./types";
import { split } from "./workoutData";

// Upper-body focuses jump in smaller increments than lower-body.
const UPPER: Focus[] = ["BACK", "CHEST", "BICEPS", "TRICEPS", "SHOULDERS", "REAR DELT"];

export function incrementFor(focus: Focus): number {
  return UPPER.includes(focus) ? 5 : 10; // lb
}

// Parse a rep string like "8-10", "12-15", "6-10", "failure", "45-60s" into a numeric top.
// Returns null if it's not a normal numeric rep range (timed planks or failure sets).
export function parseTopReps(reps: string): number | null {
  const m = reps.match(/^\s*(\d+)\s*[\u2013\u2014-]\s*(\d+)/);
  if (!m) return null;
  return parseInt(m[2], 10);
}

// A "session" is everything one lifter did for one exercise on one date.
export interface SessionSummary {
  performed_on: string;
  sets: ExerciseSet[];        // sorted by set_index
  topWeight: number;          // the heaviest weight they used that session
  repsAtTopWeight: number[];  // reps achieved on each set at topWeight
  hitTop: boolean;            // every set at topWeight hit the target top reps
}

function summarizeSession(sets: ExerciseSet[], targetTopReps: number | null): SessionSummary {
  const sorted = [...sets].sort((a, b) => a.set_index - b.set_index);
  const topWeight = sorted.reduce((m, s) => Math.max(m, s.weight), 0);
  const atTop = sorted.filter((s) => s.weight === topWeight);
  const repsAtTopWeight = atTop.map((s) => s.top_reps);
  const hitTop =
    targetTopReps != null &&
    atTop.length > 0 &&
    atTop.every((s) => s.top_reps >= targetTopReps);
  return {
    performed_on: sorted[0].performed_on,
    sets: sorted,
    topWeight,
    repsAtTopWeight,
    hitTop,
  };
}

export interface ProgressionSuggestion {
  dayIndex: number;
  exerciseIndex: number;
  exerciseName: string;
  focus: Focus;
  currentWeight: number;    // top weight from the latest session
  suggestedWeight: number;
  increment: number;
  consecutiveTopHits: number;
  lastPerformed: string;
}

const LOOKBACK_DAYS = 21;

// Group every ExerciseSet by (day_index, exercise_index, performed_on) into sessions.
function buildSessions(sets: ExerciseSet[]): Map<string, SessionSummary[]> {
  const sessions = new Map<string, Map<string, ExerciseSet[]>>();
  for (const s of sets) {
    const liftKey = `${s.day_index}-${s.exercise_index}`;
    let lift = sessions.get(liftKey);
    if (!lift) {
      lift = new Map();
      sessions.set(liftKey, lift);
    }
    const list = lift.get(s.performed_on) ?? [];
    list.push(s);
    lift.set(s.performed_on, list);
  }
  const out = new Map<string, SessionSummary[]>();
  for (const [liftKey, byDate] of sessions) {
    const [dayIdx, exIdx] = liftKey.split("-").map((n) => parseInt(n, 10));
    const day = split[dayIdx];
    const ex = day?.exercises[exIdx];
    const targetTop = ex ? parseTopReps(ex.reps) : null;
    const summaries: SessionSummary[] = [];
    for (const [, ss] of byDate) summaries.push(summarizeSession(ss, targetTop));
    summaries.sort((a, b) => b.performed_on.localeCompare(a.performed_on));
    out.set(liftKey, summaries);
  }
  return out;
}

// Scan all sets and return exercises ready for a weight bump.
// Rule: 2+ most-recent sessions hit the top of the rep range at the same
// top weight (or higher) within the last ~3 weeks.
export function suggestProgressions(
  sets: ExerciseSet[],
  todayISO: string
): ProgressionSuggestion[] {
  if (!sets.length) return [];

  const today = new Date(todayISO);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const liftSessions = buildSessions(sets);
  const suggestions: ProgressionSuggestion[] = [];

  for (const [liftKey, sessions] of liftSessions) {
    const [dayIndex, exerciseIndex] = liftKey.split("-").map((n) => parseInt(n, 10));
    const day: Day | undefined = split[dayIndex];
    const ex = day?.exercises[exerciseIndex];
    if (!day || !ex) continue;
    if (parseTopReps(ex.reps) == null) continue;

    const [latest, prev] = sessions;
    if (!latest || !prev) continue;
    if (new Date(latest.performed_on) < cutoff) continue;
    if (!latest.hitTop || !prev.hitTop) continue;
    if (latest.topWeight < prev.topWeight) continue;

    let consec = 0;
    const baseWeight = latest.topWeight;
    for (const s of sessions) {
      if (s.hitTop && s.topWeight >= baseWeight) consec++;
      else break;
    }

    const inc = incrementFor(ex.focus);
    suggestions.push({
      dayIndex,
      exerciseIndex,
      exerciseName: ex.name,
      focus: ex.focus,
      currentWeight: latest.topWeight,
      suggestedWeight: latest.topWeight + inc,
      increment: inc,
      consecutiveTopHits: consec,
      lastPerformed: latest.performed_on,
    });
  }

  suggestions.sort((a, b) => {
    if (a.lastPerformed !== b.lastPerformed)
      return b.lastPerformed.localeCompare(a.lastPerformed);
    return b.consecutiveTopHits - a.consecutiveTopHits;
  });

  return suggestions;
}

// Build a quick lookup: { "<day>-<ex>": ProgressionSuggestion }
export function suggestionMap(
  sets: ExerciseSet[],
  todayISO: string
): Map<string, ProgressionSuggestion> {
  const m = new Map<string, ProgressionSuggestion>();
  for (const s of suggestProgressions(sets, todayISO)) {
    m.set(`${s.dayIndex}-${s.exerciseIndex}`, s);
  }
  return m;
}

// All sets for a given exercise on a given date, sorted by set_index.
export function setsFor(
  sets: ExerciseSet[],
  dayIndex: number,
  exerciseIndex: number,
  date: string
): ExerciseSet[] {
  return sets
    .filter(
      (s) =>
        s.day_index === dayIndex &&
        s.exercise_index === exerciseIndex &&
        s.performed_on === date
    )
    .sort((a, b) => a.set_index - b.set_index);
}

// Most recent prior session for a given exercise (excluding today). Returns sorted sets or null.
export function lastSession(
  sets: ExerciseSet[],
  dayIndex: number,
  exerciseIndex: number,
  excludingDate: string
): ExerciseSet[] | null {
  const candidates = sets.filter(
    (s) =>
      s.day_index === dayIndex &&
      s.exercise_index === exerciseIndex &&
      s.performed_on !== excludingDate
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.performed_on.localeCompare(a.performed_on));
  const last = candidates[0].performed_on;
  return candidates
    .filter((s) => s.performed_on === last)
    .sort((a, b) => a.set_index - b.set_index);
}
