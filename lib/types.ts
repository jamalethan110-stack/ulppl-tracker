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
  reps: string;
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

export interface WeightEntry {
  id: string;
  weight: number;
  unit: "lb" | "kg";
  entry_date: string;
  note: string | null;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  entry_date: string;
}

export interface FoodFavorite {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_label: string | null;
}

export interface WorkoutCompletion {
  id: string;
  day_index: number;
  exercise_index: number;
  kind: "main" | "abs";
  completed_on: string;
}
