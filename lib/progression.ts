import type { Focus, ExerciseSet, Day } from "./types";
import { split } from "./workoutData";

// Upper-body focuses jump in smaller increments than lower-body.
const UPPER: Focus[] = ["BACK", "CHEST", "BICEPS", "TRICEPS", "SHOULDERS", "REAR DELT"];

export function incrementFor(focus: Focus): number {
  return UPPER.includes(focus) ? 5 : 10; // lb
}

// Parse a rep string like "8-10", "12-15", "6-10", "failure", "45-60s" into a numeric top.
// Returns null if it's not a normal numeric rep range (e.g. timed planks or failure sets).
export function parseTopReps(reps: string): number | null {
  const m = reps.match(/^\s*(\d+)\s*[\u2013\u2014-]\s*(\d+)/);
  if (!m) return null;
  return parseInt(m[2], 10);
}

export interface ProgressionSuggestion {
  dayIndex: number;
  exerciseIndex: number;
  exerciseName: string;
  focus: Focus;
  currentWeight: number;
  suggestedWeight: number;
  increment: number;
  consecutiveTopHits: number;
  lastPerformed: string;
}

// Days within the lookback window we still consider "recent" training.
const LOOKBACK_DAYS = 21;

// Look across all logged ExerciseSets and return a list of exercises the lifter
// is ready to add weight to. Rule: 2+ most-recent sessions for that exercise
// hit the top of the prescribed rep range at the same weight (or higher).
export function suggestProgressions(
  sets: ExerciseSet[],
  todayISO: string
): ProgressionSuggestion[] {
  if (!sets.length) return [];

  // Bucket sets by (day_index, exercise_index), most-recent first.
  const buckets = new Map<string, ExerciseSet[]>();
  for (const s of sets) {
    const key = `${s.day_index}-${s.exercise_index}`;
    const list = buckets.get(key) ?? [];
    list.push(s);
    buckets.set(key, list);
  }

  const today = new Date(todayISO);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const suggestions: ProgressionSuggestion[] = [];

  for (const [key, list] of buckets) {
    list.sort((a, b) => b.performed_on.localeCompare(a.performed_on));
    const [latest, prev] = list;
    if (!latest || !prev) continue;

    // Must be inside the lookback window so we don't nag about stale lifts.
    if (new Date(latest.performed_on) < cutoff) continue;

    if (!latest.hit_top || !prev.hit_top) continue;
    // Both sessions must be at >= the same weight (no regression).
    if (latest.weight < prev.weight) continue;

    const [dayIndexStr, exerciseIndexStr] = key.split("-");
    const dayIndex = parseInt(dayIndexStr, 10);
    const exerciseIndex = parseInt(exerciseIndexStr, 10);
    const day: Day | undefined = split[dayIndex];
    const ex = day?.exercises[exerciseIndex];
    if (!day || !ex) continue;

    // Skip non-numeric rep ranges (timed holds, drop sets to failure).
    const top = parseTopReps(ex.reps);
    if (top == null) continue;

    const inc = incrementFor(ex.focus);

    // Count consecutive top hits at >= current weight, working backward.
    let consec = 0;
    let baseWeight = latest.weight;
    for (const s of list) {
      if (s.hit_top && s.weight >= baseWeight) consec++;
      else break;
    }

    suggestions.push({
      dayIndex,
      exerciseIndex,
      exerciseName: ex.name,
      focus: ex.focus,
      currentWeight: latest.weight,
      suggestedWeight: latest.weight + inc,
      increment: inc,
      consecutiveTopHits: consec,
      lastPerformed: latest.performed_on,
    });
  }

  // Most recent first, then by how many consecutive top hits.
  suggestions.sort((a, b) => {
    if (a.lastPerformed !== b.lastPerformed)
      return b.lastPerformed.localeCompare(a.lastPerformed);
    return b.consecutiveTopHits - a.consecutiveTopHits;
  });

  return suggestions;
}

// Pull the most recent logged set for a given exercise (across all dates).
export function latestSet(
  sets: ExerciseSet[],
  dayIndex: number,
  exerciseIndex: number
): ExerciseSet | null {
  let best: ExerciseSet | null = null;
  for (const s of sets) {
    if (s.day_index !== dayIndex || s.exercise_index !== exerciseIndex) continue;
    if (!best || s.performed_on > best.performed_on) best = s;
  }
  return best;
}
