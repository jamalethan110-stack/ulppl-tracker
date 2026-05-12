"use client";

import { useEffect, useMemo, useState } from "react";
import {
  split,
  focusColors,
  weeklyVolume,
  defaultDayIndexForToday,
  todayISO,
} from "@/lib/workoutData";
import {
  suggestProgressions,
  suggestionMap,
  setsFor,
  lastSession,
  parseTopReps,
  incrementFor,
  type ProgressionSuggestion,
} from "@/lib/progression";
import type { ExerciseSet } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Tab = "exercises" | "abs" | "info";

export default function WorkoutTracker() {
  const supabase = useMemo(() => createClient(), []);
  const [activeDay, setActiveDay] = useState(0);
  const [absChecked, setAbsChecked] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<Tab>("exercises");
  const [loading, setLoading] = useState(true);
  const [date] = useState(todayISO());
  const [allSets, setAllSets] = useState<ExerciseSet[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveDay(defaultDayIndexForToday());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: comp } = await supabase
        .from("workout_completions")
        .select("day_index, exercise_index, kind")
        .eq("completed_on", date)
        .eq("kind", "abs");

      const since = new Date();
      since.setDate(since.getDate() - 60);
      const sinceISO = since.toISOString().slice(0, 10);
      const { data: setsData } = await supabase
        .from("exercise_sets")
        .select("*")
        .gte("performed_on", sinceISO);

      if (cancelled) return;

      const abs: Record<string, boolean> = {};
      for (const row of comp ?? []) {
        abs[`${row.day_index}-abs-${row.exercise_index}`] = true;
      }
      setAbsChecked(abs);
      setAllSets((setsData ?? []) as ExerciseSet[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, date]);

  const day = split[activeDay];
  const accent = day.accent;

  const toggleAbs = async (exIndex: number) => {
    const key = `${activeDay}-abs-${exIndex}`;
    const next = !absChecked[key];
    setAbsChecked((p) => ({ ...p, [key]: next }));
    if (next) {
      await supabase.from("workout_completions").upsert(
        {
          day_index: activeDay,
          exercise_index: exIndex,
          kind: "abs",
          completed_on: date,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
        { onConflict: "user_id,day_index,exercise_index,kind,completed_on" }
      );
    } else {
      await supabase
        .from("workout_completions")
        .delete()
        .eq("day_index", activeDay)
        .eq("exercise_index", exIndex)
        .eq("kind", "abs")
        .eq("completed_on", date);
    }
  };

  // Save a single set (insert or upsert by set_index).
  const saveSet = async (
    exIndex: number,
    setIndex: number,
    weight: number,
    reps: number,
    targetTop: number | null
  ): Promise<boolean> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return false;
    const hitTop = targetTop != null && reps >= targetTop;
    const row = {
      user_id: userId,
      day_index: activeDay,
      exercise_index: exIndex,
      set_index: setIndex,
      weight,
      top_reps: reps,
      hit_top: hitTop,
      performed_on: date,
    };
    const { error, data } = await supabase
      .from("exercise_sets")
      .upsert(row, {
        onConflict: "user_id,day_index,exercise_index,performed_on,set_index",
      })
      .select()
      .single();
    if (error) return false;
    setAllSets((prev) => {
      const filtered = prev.filter(
        (s) =>
          !(
            s.day_index === activeDay &&
            s.exercise_index === exIndex &&
            s.performed_on === date &&
            s.set_index === setIndex
          )
      );
      return [...filtered, data as ExerciseSet];
    });
    return true;
  };

  const deleteSet = async (
    exIndex: number,
    setIndex: number
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("exercise_sets")
      .delete()
      .eq("day_index", activeDay)
      .eq("exercise_index", exIndex)
      .eq("performed_on", date)
      .eq("set_index", setIndex);
    if (error) return false;
    setAllSets((prev) =>
      prev.filter(
        (s) =>
          !(
            s.day_index === activeDay &&
            s.exercise_index === exIndex &&
            s.performed_on === date &&
            s.set_index === setIndex
          )
      )
    );
    return true;
  };

  // For "X / Y done" header: an exercise counts as done when N sets are logged
  // (N = its prescribed set count).
  const isExerciseDone = (exIdx: number) => {
    const ex = day.exercises[exIdx];
    if (!ex) return false;
    const logged = setsFor(allSets, activeDay, exIdx, date).length;
    return logged >= ex.sets;
  };
  const done = day.exercises.reduce((n, _, i) => n + (isExerciseDone(i) ? 1 : 0), 0);
  const total = day.exercises.length;
  const pct = total ? (done / total) * 100 : 0;

  const armSets = day.exercises.filter((e) =>
    ["BICEPS", "TRICEPS"].includes(e.focus)
  ).length;
  const legSets = day.exercises.filter((e) =>
    ["QUADS", "HAMS", "CALVES", "GLUTES"].includes(e.focus)
  ).length;
  const abCount = day.abs ? day.abs.length : 0;

  const suggestionsAll: ProgressionSuggestion[] = useMemo(
    () => suggestProgressions(allSets, date),
    [allSets, date]
  );
  const sugMap = useMemo(() => suggestionMap(allSets, date), [allSets, date]);
  // Suggestions filtered to today's day.
  const todaySuggestions = suggestionsAll.filter((s) => s.dayIndex === activeDay);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e2e2e2" }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#080808",
          borderBottom: "1px solid #111",
        }}
      >
        <div style={{ padding: "22px 18px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: "#3a3a3a",
                  marginBottom: 3,
                }}
              >
                SCIENCE-BASED · ULPPL · TRAINING ONLY
              </div>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 24,
                  letterSpacing: "0.04em",
                  color: "#fff",
                }}
              >
                TODAY&apos;S TRAINING
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 30,
                  color: accent,
                  lineHeight: 1,
                }}
              >
                {done}/{total}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#333",
                  letterSpacing: "0.1em",
                }}
              >
                DONE
              </div>
            </div>
          </div>

          <div style={{ display: "flex" }}>
            {split.map((d, i) => {
              const active = i === activeDay;
              return (
                <button
                  key={i}
                  className="day-tab"
                  onClick={() => {
                    setActiveDay(i);
                    setTab("exercises");
                    setExpandedKey(null);
                  }}
                >
                  <div
                    className="day-tag"
                    style={{
                      background: active ? `${d.accent}20` : "#0f0f0f",
                      color: active ? d.accent : "#2e2e2e",
                      outline: active ? `1.5px solid ${d.accent}50` : "none",
                    }}
                  >
                    {d.tag}
                  </div>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: active ? d.accent : "#2e2e2e",
                    }}
                  >
                    D{i + 1}
                  </span>
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: "55%",
                        height: 2,
                        background: d.accent,
                        borderRadius: 2,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "16px 18px 52px",
          ...({ "--ac": accent } as React.CSSProperties),
        }}
      >
        <div style={{ marginBottom: 13 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 34,
                color: "#fff",
                letterSpacing: "0.03em",
              }}
            >
              {day.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: accent,
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              {day.sublabel}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 7, marginBottom: 13 }}>
          <Stat label="ARMS" n={armSets} color="#fb923c" />
          <Stat label="LEGS" n={legSets} color="#4ade80" />
          <Stat label="ABS" n={abCount} color="#e2e8f0" />
          <Stat label="TOTAL" n={total + abCount} color="#fff" />
        </div>

        <div
          style={{
            height: 2,
            background: "#141414",
            borderRadius: 2,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: accent,
              borderRadius: 2,
              transition: "width 0.4s",
            }}
          />
        </div>

        {/* Today's bumps summary (just this day's exercises). */}
        {todaySuggestions.length > 0 && (
          <div
            style={{
              background: "#0e0e0e",
              border: "1px solid #1a1a1a",
              borderLeft: "3px solid #fb923c",
              borderRadius: 10,
              padding: "11px 13px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "#fb923c",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              ⬆ TODAY · GO UP ON
            </div>
            <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
              {todaySuggestions
                .map((s) => `${s.exerciseName} → ${s.suggestedWeight} lb`)
                .join("  ·  ")}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            background: "#0e0e0e",
            border: "1px solid #1a1a1a",
            borderRadius: 10,
            padding: 3,
            marginBottom: 15,
            gap: 3,
          }}
        >
          {(["exercises", ...(day.abs ? ["abs"] : []), "info"] as Tab[]).map(
            (t) => (
              <button
                key={t}
                className="seg-btn"
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? accent + "22" : "transparent",
                  color: tab === t ? accent : "#333",
                  outline: tab === t ? `1px solid ${accent}40` : "none",
                }}
              >
                {t === "exercises" ? "EXERCISES" : t === "abs" ? "ABS" : "INFO"}
              </button>
            )
          )}
        </div>

        {loading && (
          <div style={{ color: "#333", fontSize: 12, padding: "10px 0" }}>
            Loading today&apos;s progress…
          </div>
        )}

        {!loading && tab === "exercises" && (
          <div>
            <div
              className="note-stripe"
              style={{ ...({ "--ac": accent } as React.CSSProperties) }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: accent,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  marginBottom: 5,
                }}
              >
                WHY THIS DAY
              </div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.65 }}>
                {day.note}
              </div>
            </div>
            {day.exercises.map((ex, i) => {
              const key = `${activeDay}-ex-${i}`;
              const sug = sugMap.get(`${activeDay}-${i}`);
              const sets = setsFor(allSets, activeDay, i, date);
              const isDone = sets.length >= ex.sets;
              const fc = focusColors[ex.focus] || "#555";
              const isOpen = expandedKey === key;
              const targetTop = parseTopReps(ex.reps);
              const lastSess = lastSession(allSets, activeDay, i, date);
              return (
                <ExerciseCard
                  key={i}
                  name={ex.name}
                  focus={ex.focus}
                  focusColor={fc}
                  prescribedSets={ex.sets}
                  prescribedReps={ex.reps}
                  targetTop={targetTop}
                  accent={accent}
                  isDone={isDone}
                  isOpen={isOpen}
                  todaySets={sets}
                  lastSessionSets={lastSess}
                  suggestion={sug}
                  onToggle={() => setExpandedKey(isOpen ? null : key)}
                  onSave={(setIdx, w, r) => saveSet(i, setIdx, w, r, targetTop)}
                  onDelete={(setIdx) => deleteSet(i, setIdx)}
                />
              );
            })}
          </div>
        )}

        {!loading && tab === "abs" && day.abs && (
          <div>
            <div
              className="note-stripe"
              style={{ ...({ "--ac": accent } as React.CSSProperties) }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: accent,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  marginBottom: 5,
                }}
              >
                ABS NOTE
              </div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.65 }}>
                Abs are trained 4× this week. Weighted movements like cable
                crunch build the muscle. Cardio reveals them.
              </div>
            </div>
            {day.abs.map((ex, i) => {
              const key = `${activeDay}-abs-${i}`;
              const isAbsDone = !!absChecked[key];
              return (
                <div
                  key={i}
                  className={`ex-row${isAbsDone ? " done" : ""}`}
                  onClick={() => toggleAbs(i)}
                >
                  <div
                    className={`chk${isAbsDone ? " on" : ""}`}
                    style={{ ...({ "--ac": accent } as React.CSSProperties) }}
                  >
                    {isAbsDone && (
                      <svg width="10" height="8" viewBox="0 0 10 8">
                        <path
                          d="M1 3.5L3.8 6.5L9 1"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: isAbsDone ? "#2a2a2a" : "#ddd",
                      }}
                    >
                      {ex.name}
                    </div>
                    <span
                      className="ftag"
                      style={{ background: "#e2e8f018", color: "#e2e8f0" }}
                    >
                      ABS
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isAbsDone ? "#2a2a2a" : accent,
                      }}
                    >
                      {ex.sets} × {ex.reps}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "info" && (
          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "12px 14px",
                background: "#0e0e0e",
                border: "1px solid #181818",
                borderRadius: 11,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 16 }}>💡</span>
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#383838",
                    letterSpacing: "0.13em",
                    marginBottom: 4,
                  }}
                >
                  PRO TIP
                </div>
                <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>
                  {day.tip}
                </div>
              </div>
            </div>

            {day.cardio && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  background: "#0e0e0e",
                  border: "1px solid #181818",
                  borderRadius: 11,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>🚶</span>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#383838",
                      letterSpacing: "0.13em",
                      marginBottom: 4,
                    }}
                  >
                    CARDIO
                  </div>
                  <div style={{ fontSize: 12, color: "#777" }}>{day.cardio}</div>
                </div>
              </div>
            )}

            <div
              style={{
                background: "#0c0c0c",
                border: "1px solid #181818",
                borderRadius: 12,
                padding: "15px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#333",
                  letterSpacing: "0.18em",
                  marginBottom: 14,
                }}
              >
                WEEKLY VOLUME — ALL MUSCLES
              </div>
              {weeklyVolume.map((m) => (
                <div
                  key={m.muscle}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 9,
                  }}
                >
                  <div
                    style={{
                      width: 82,
                      fontSize: 11,
                      color: "#555",
                      flexShrink: 0,
                    }}
                  >
                    {m.muscle}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: "#161616",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(m.sets / 22) * 100}%`,
                        background: m.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: m.color,
                      fontWeight: 700,
                      width: 26,
                      textAlign: "right",
                    }}
                  >
                    {m.sets}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 9, color: "#252525", marginTop: 10 }}>
                Sets per week · Science target: 10–20 for growth
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- subcomponents ----

function Stat({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="stat">
      <div
        style={{
          fontSize: 8,
          color: "#383838",
          letterSpacing: "0.12em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: 22,
          color: n > 0 ? color : "#1e1e1e",
        }}
      >
        {n}
      </div>
    </div>
  );
}

function ExerciseCard({
  name,
  focus,
  focusColor,
  prescribedSets,
  prescribedReps,
  targetTop,
  accent,
  isDone,
  isOpen,
  todaySets,
  lastSessionSets,
  suggestion,
  onToggle,
  onSave,
  onDelete,
}: {
  name: string;
  focus: string;
  focusColor: string;
  prescribedSets: number;
  prescribedReps: string;
  targetTop: number | null;
  accent: string;
  isDone: boolean;
  isOpen: boolean;
  todaySets: ExerciseSet[];
  lastSessionSets: ExerciseSet[] | null;
  suggestion: ProgressionSuggestion | undefined;
  onToggle: () => void;
  onSave: (setIndex: number, weight: number, reps: number) => Promise<boolean>;
  onDelete: (setIndex: number) => Promise<boolean>;
}) {
  return (
    <div
      style={{
        background: isDone ? "#0a0a0a" : "#0e0e0e",
        border: "1px solid #1a1a1a",
        borderLeft: isDone
          ? `3px solid ${accent}`
          : suggestion
          ? "3px solid #fb923c"
          : "3px solid transparent",
        borderRadius: 10,
        marginBottom: 10,
        overflow: "hidden",
        transition: "background 0.2s",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 13px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `1.5px solid ${isDone ? accent : "#222"}`,
            background: isDone ? accent : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isDone && (
            <svg width="10" height="8" viewBox="0 0 10 8">
              <path
                d="M1 3.5L3.8 6.5L9 1"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: isDone ? "#888" : "#eee",
              textDecoration: isDone ? "line-through" : "none",
              textDecorationColor: "#333",
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span
              className="ftag"
              style={{ background: `${focusColor}18`, color: focusColor }}
            >
              {focus}
            </span>
            <span style={{ fontSize: 11, color: "#555" }}>
              {prescribedSets} × {prescribedReps}
            </span>
            <span style={{ fontSize: 11, color: "#444" }}>
              · {todaySets.length}/{prescribedSets} logged
            </span>
          </div>
          {suggestion && (
            <div
              style={{
                marginTop: 5,
                fontSize: 11,
                color: "#fb923c",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              ⬆ GO UP TO {suggestion.suggestedWeight} LB
              <span style={{ color: "#666", fontWeight: 500, marginLeft: 6 }}>
                (was {suggestion.currentWeight})
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#666",
            transform: isOpen ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          ›
        </div>
      </div>

      {isOpen && (
        <SetLogBody
          prescribedSets={prescribedSets}
          targetTop={targetTop}
          accent={accent}
          todaySets={todaySets}
          lastSessionSets={lastSessionSets}
          suggestion={suggestion}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function SetLogBody({
  prescribedSets,
  targetTop,
  accent,
  todaySets,
  lastSessionSets,
  suggestion,
  onSave,
  onDelete,
}: {
  prescribedSets: number;
  targetTop: number | null;
  accent: string;
  todaySets: ExerciseSet[];
  lastSessionSets: ExerciseSet[] | null;
  suggestion: ProgressionSuggestion | undefined;
  onSave: (setIndex: number, weight: number, reps: number) => Promise<boolean>;
  onDelete: (setIndex: number) => Promise<boolean>;
}) {
  const nextSetIndex = todaySets.length
    ? Math.max(...todaySets.map((s) => s.set_index)) + 1
    : 1;
  const lastTodaySet = todaySets[todaySets.length - 1];
  const lastSessionTopWeight = lastSessionSets?.reduce(
    (m, s) => Math.max(m, s.weight),
    0
  );
  // Default starting weight: last weight you logged today, else the suggested
  // new weight, else last session's top weight, else blank.
  const defaultWeight =
    lastTodaySet?.weight ??
    suggestion?.suggestedWeight ??
    lastSessionTopWeight ??
    null;

  const [w, setW] = useState<string>(
    defaultWeight != null ? String(defaultWeight) : ""
  );
  const [r, setR] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const wn = parseFloat(w);
    const rn = parseInt(r, 10);
    if (Number.isNaN(wn) || Number.isNaN(rn) || rn <= 0) return;
    setSaving(true);
    const ok = await onSave(nextSetIndex, wn, rn);
    setSaving(false);
    if (ok) {
      setR("");
      // Keep weight prefilled with what they just used (lifters often repeat).
    }
  };

  return (
    <div
      style={{
        borderTop: "1px solid #161616",
        padding: "10px 13px 13px",
        background: "#0a0a0a",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Logged sets so far */}
      {todaySets.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {todaySets.map((s) => (
            <div
              key={s.set_index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid #131313",
                fontSize: 13,
              }}
            >
              <div style={{ width: 36, color: "#555", fontSize: 11 }}>
                SET {s.set_index}
              </div>
              <div style={{ flex: 1, color: "#ddd" }}>
                <span style={{ fontWeight: 700 }}>{s.weight}</span>
                <span style={{ color: "#555" }}> lb × </span>
                <span style={{ fontWeight: 700 }}>{s.top_reps}</span>
                {s.hit_top && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      color: "#4ade80",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    HIT TOP
                  </span>
                )}
              </div>
              <button
                onClick={() => onDelete(s.set_index)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#444",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "0 6px",
                }}
                aria-label="Delete set"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New-set input */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#666",
            letterSpacing: "0.1em",
            width: 42,
          }}
        >
          SET {nextSetIndex}
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={w}
          onChange={(e) => setW(e.target.value)}
          placeholder="lb"
          style={inputStyle}
        />
        <input
          type="number"
          inputMode="numeric"
          value={r}
          onChange={(e) => setR(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={targetTop != null ? `reps (goal ${targetTop})` : "reps"}
          style={inputStyle}
        />
        <button
          onClick={submit}
          disabled={saving}
          style={{
            background: accent,
            color: "#000",
            border: "none",
            padding: "9px 14px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            cursor: "pointer",
            opacity: saving ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "..." : "SAVE"}
        </button>
      </div>

      {/* Last session recap */}
      {lastSessionSets && lastSessionSets.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "#555",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: "#3a3a3a", letterSpacing: "0.1em", fontWeight: 700 }}>
            LAST ({lastSessionSets[0].performed_on}):{" "}
          </span>
          {lastSessionSets
            .map((s) => `${s.weight}×${s.top_reps}`)
            .join(", ")}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #1f1f1f",
  color: "#fff",
  padding: "9px 10px",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  minWidth: 0,
};
