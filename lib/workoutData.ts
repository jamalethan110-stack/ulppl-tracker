import type { Day, Focus } from "./types";

export const split: Day[] = [
  {
    day: 1,
    label: "UPPER",
    sublabel: "STRENGTH",
    tag: "U",
    accent: "#FF6B35",
    emoji: "🏋️",
    note: "Heavy compounds first. Arms get direct volume at the end — first arm session of the week. Abs at the end when core is still fresh enough to train hard.",
    exercises: [
      { name: "Barbell Row", sets: 4, reps: "4–6", focus: "BACK" },
      { name: "Bench Press", sets: 4, reps: "4–6", focus: "CHEST" },
      { name: "Weighted Pull-Up / Lat Pulldown", sets: 3, reps: "6–8", focus: "BACK" },
      { name: "Incline DB Press", sets: 3, reps: "8–10", focus: "CHEST" },
      { name: "EZ Bar Curl", sets: 4, reps: "8–10", focus: "BICEPS" },
      { name: "Skull Crushers", sets: 4, reps: "8–10", focus: "TRICEPS" },
      { name: "Face Pulls", sets: 3, reps: "12–15", focus: "REAR DELT" },
    ],
    abs: [
      { name: "Hanging Leg Raises", sets: 3, reps: "12–15" },
      { name: "Cable Crunch", sets: 3, reps: "12–15" },
    ],
    cardio: null,
    tip: "Rest 2–3 min on compounds, 60–90s on arms and abs.",
  },
  {
    day: 2,
    label: "LOWER",
    sublabel: "QUAD FOCUS",
    tag: "L",
    accent: "#00D4AA",
    emoji: "🦵",
    note: "Quad-dominant day. Squat leads heavy, then Bulgarian split squat for unilateral quad overload — this is the exercise most people skip that builds the most leg size. Hamstrings get hit too but quads are the star today.",
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: "4–6", focus: "QUADS" },
      { name: "Bulgarian Split Squat", sets: 3, reps: "8–10", focus: "QUADS" },
      { name: "Hack Squat / Leg Press", sets: 3, reps: "10–12", focus: "QUADS" },
      { name: "Leg Extension", sets: 4, reps: "12–15", focus: "QUADS" },
      { name: "Romanian Deadlift", sets: 3, reps: "8–10", focus: "HAMS" },
      { name: "Lying Leg Curl", sets: 3, reps: "10–12", focus: "HAMS" },
      { name: "Standing Calf Raise", sets: 4, reps: "10–15", focus: "CALVES" },
      { name: "Seated Calf Raise", sets: 3, reps: "15–20", focus: "CALVES" },
    ],
    abs: null,
    cardio: null,
    tip: "Bulgarian split squat will humble you. Start light, go slow on the way down. This single exercise will change your quads.",
  },
  {
    day: 3,
    label: "PUSH",
    sublabel: "SHOULDERS + TRIS",
    tag: "P",
    accent: "#FFD700",
    emoji: "💪",
    note: "Shoulders lead, chest maintains, triceps get serious dedicated volume. This is tricep day disguised as a push day — 6 sets of direct tricep work.",
    exercises: [
      { name: "Overhead Press (BB or DB)", sets: 4, reps: "6–10", focus: "SHOULDERS" },
      { name: "Incline DB Press", sets: 3, reps: "10–12", focus: "CHEST" },
      { name: "Lateral Raises", sets: 5, reps: "12–15", focus: "SHOULDERS" },
      { name: "Cable Chest Fly", sets: 3, reps: "12–15", focus: "CHEST" },
      { name: "Overhead Tricep Extension (Cable)", sets: 4, reps: "10–15", focus: "TRICEPS" },
      { name: "Tricep Pushdown (rope)", sets: 3, reps: "12–15", focus: "TRICEPS" },
      { name: "Single Arm Tricep Pushdown", sets: 3, reps: "12–15", focus: "TRICEPS" },
      { name: "Lateral Raises (drop set)", sets: 2, reps: "failure", focus: "SHOULDERS" },
    ],
    abs: [
      { name: "Ab Wheel Rollout", sets: 3, reps: "8–12" },
      { name: "Plank", sets: 3, reps: "45–60s" },
    ],
    cardio: "20–25 min incline walk after",
    tip: "Overhead cable extension hits the long head of the tricep — the part that makes arms look big from the side. Never skip it.",
  },
  {
    day: 4,
    label: "PULL",
    sublabel: "BACK + BICEPS",
    tag: "P",
    accent: "#A78BFA",
    emoji: "🔄",
    note: "Back thickness and width. Biceps get their biggest session here — 3 movements, full focus. Incline DB curl is non-negotiable, it stretches the bicep at the bottom which research shows maximizes growth.",
    exercises: [
      { name: "Seated Cable Row", sets: 4, reps: "8–12", focus: "BACK" },
      { name: "Lat Pulldown (wide grip)", sets: 4, reps: "8–12", focus: "BACK" },
      { name: "Single Arm DB Row", sets: 3, reps: "10–12", focus: "BACK" },
      { name: "Chest Supported Row", sets: 3, reps: "10–12", focus: "BACK" },
      { name: "Incline DB Curl", sets: 4, reps: "10–12", focus: "BICEPS" },
      { name: "Hammer Curl", sets: 3, reps: "10–12", focus: "BICEPS" },
      { name: "Cable Curl (single arm)", sets: 3, reps: "12–15", focus: "BICEPS" },
      { name: "Face Pulls", sets: 3, reps: "15", focus: "REAR DELT" },
    ],
    abs: [
      { name: "Hanging Leg Raises", sets: 3, reps: "15–20" },
      { name: "Cable Crunch", sets: 3, reps: "15–20" },
      { name: "Bicycle Crunch", sets: 2, reps: "20–25" },
    ],
    cardio: "20–25 min incline walk after",
    tip: "For biceps: slow down the negative (lowering phase). 3 seconds down. This alone will add size faster than adding more sets.",
  },
  {
    day: 5,
    label: "LEGS",
    sublabel: "HAM + GLUTE FOCUS",
    tag: "L",
    accent: "#00D4AA",
    emoji: "🦵",
    note: "Hip hinge and hamstring focus today. Two leg curl variations because lying hits the belly of the muscle and seated hits the insertion — you need both for complete hamstring development.",
    exercises: [
      { name: "Romanian Deadlift", sets: 4, reps: "6–10", focus: "HAMS" },
      { name: "Hip Thrust", sets: 4, reps: "10–12", focus: "GLUTES" },
      { name: "Lying Leg Curl", sets: 4, reps: "10–12", focus: "HAMS" },
      { name: "Seated Leg Curl", sets: 3, reps: "12–15", focus: "HAMS" },
      { name: "Hack Squat / Leg Press", sets: 3, reps: "12–15", focus: "QUADS" },
      { name: "Leg Extension", sets: 3, reps: "15–20", focus: "QUADS" },
      { name: "Seated Calf Raise", sets: 4, reps: "15–20", focus: "CALVES" },
      { name: "Donkey Calf Raise / Standing", sets: 3, reps: "12–15", focus: "CALVES" },
    ],
    abs: [
      { name: "Ab Wheel Rollout", sets: 3, reps: "10–12" },
      { name: "Reverse Crunch", sets: 3, reps: "15–20" },
    ],
    cardio: null,
    tip: "RDL — push your hips BACK not down. Feel the hamstring stretch at the bottom. If you don't feel it in your hamstrings, you're squatting it.",
  },
];

export const focusColors: Record<Focus, string> = {
  BACK: "#60a5fa",
  CHEST: "#f87171",
  BICEPS: "#fb923c",
  TRICEPS: "#f97316",
  SHOULDERS: "#facc15",
  QUADS: "#4ade80",
  HAMS: "#34d399",
  CALVES: "#2dd4bf",
  GLUTES: "#a78bfa",
  "REAR DELT": "#f472b6",
};

export const weeklyVolume = [
  { muscle: "Biceps", sets: 17, color: "#fb923c" },
  { muscle: "Triceps", sets: 17, color: "#f97316" },
  { muscle: "Quads", sets: 20, color: "#4ade80" },
  { muscle: "Hamstrings", sets: 18, color: "#34d399" },
  { muscle: "Calves", sets: 17, color: "#2dd4bf" },
  { muscle: "Back", sets: 18, color: "#60a5fa" },
  { muscle: "Chest", sets: 12, color: "#f87171" },
  { muscle: "Shoulders", sets: 14, color: "#facc15" },
  { muscle: "Abs", sets: 14, color: "#e2e8f0" },
];

// Default day index based on JS weekday (Sun=0..Sat=6).
// Mon=Upper, Tue=Lower, Wed=Push, Thu=Pull, Fri=Legs, Sat/Sun=Upper to start the week again.
export function defaultDayIndexForToday(d = new Date()): number {
  const w = d.getDay();
  switch (w) {
    case 1: return 0; // Mon
    case 2: return 1; // Tue
    case 3: return 2; // Wed
    case 4: return 3; // Thu
    case 5: return 4; // Fri
    default: return 0; // Sat, Sun, fallback
  }
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
