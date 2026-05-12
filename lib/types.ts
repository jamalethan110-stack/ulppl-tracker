export type Focus =
  | "BACK"
  | "CHEST"
  | "BICEPS"
  | "TRICEPS"
  | "SHOULDERS"
  | "QUADS"
  | "HAMS"
  | "CALVES"
  | "GLUTES"
  | "REAR DELT";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;          // e.g. "8-10", "12-15", "6-10"
  focus: Focus;
}

export interface AbExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface Day {
  day: number;
  label: string;
  sublabel: string;
  tag: string;
  accent: string;
  emoji: string;
  note: string;
  exercises: Exercise[];
  abs: AbExercise[] | null;
  cardio: string | null;
  tip: string;
}

export interface WorkoutCompletion {
  id: string;
  day_index: number;
  exercise_index: number;
  kind: "main" | "abs";
  completed_on: string;
}

// One row per individual working set. Lifter can bump weight across sets
// (e.g. 135x8 → 155x6 → 165x6) and each is its own row.
// Unique on (user, day_index, exercise_index, performed_on, set_index).
export interface ExerciseSet {
  id: string;
  user_id: string;
  day_index: number;
  exercise_index: number;
  set_index: number;       // 1-based set number within the session
  weight: number;          // in lb
  top_reps: number;        // reps performed on this set
  hit_top: boolean;        // did this set hit the top of the target rep range?
  performed_on: string;    // YYYY-MM-DD
}
