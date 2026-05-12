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

// Logged weight + top rep count for a given exercise on a given day.
// One row per (user, day_index, exercise_index, performed_on).
export interface ExerciseSet {
  id: string;
  user_id: string;
  day_index: number;
  exercise_index: number;
  weight: number;          // in lb
  top_reps: number;        // highest reps achieved across the working sets
  hit_top: boolean;        // did they hit the top of the target rep range?
  performed_on: string;    // YYYY-MM-DD
}
