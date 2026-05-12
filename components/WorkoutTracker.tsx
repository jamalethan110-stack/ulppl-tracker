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
  latestSet,
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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [absChecked, setAbsChecked] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<Tab>("exercises");
  const [loading, setLoading] = useState(true);
  const [date] = useState(todayISO());
  const [allSets, setAllSets] = useState<ExerciseSet[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveDay(defaultDayIndexForToday());
  }, []);

  // Load today's completions + last 30 days of logged sets.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const { data: comp } = await supabase
        .from("workout_completions")
        .select("day_index, exercise_index, kind")
        .eq("completed_on", date);

      // Pull 30 days of sets so progression has plenty of history.
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceISO = since.toISOString().slice(0, 10);
      const { data: setsData } = await supabase
        .from("exercise_sets")
        .select("*")
        .gte("performed_on", sinceISO);

      if (cancelled) return;

      const mains: Record<string, boolean> = {};
      const abs: Record<string, boolean> = {};
      for (const row of comp ?? []) {
        const k = `${row.day_index}-ex-${row.exercise_index}`;
        if (row.kind === "abs") abs[k] = true;
        else mains[k] = true;
      }
      setChecked(mains);
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

  const toggle = async (exIndex: number) => {
    const key = `${activeDay}-ex-${exIndex}`;
    const next = !checked[key];
    setChecked((p) => ({ ...p, [key]: next }));
    if (next) {
      await supabase.from("workout_completions").upsert(
        {
          day_index: activeDay,
          exercise_index: exIndex,
          kind: "main",
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
        .eq("kind", "main")
        .eq("completed_on", date);
    }
  };

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

  const saveSet = async (
    exIndex: number,
    weight: number,
    topReps: number,
    targetTop: number | null
  ) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const hitTop = targetTop == null ? false : topReps >= targetTop;
    const row = {
      user_id: userId,
      day_index: activeDay,
      exercise_index: exIndex,
      weight,
      top_reps: topReps,
      hit_top: hitTop,
      performed_on: date,
    };
    await supabase
      .from("exercise_sets")
      .upsert(row, { onConflict: "user_id,day_index,exercise_index,performed_on" });
    setAllSets((prev) => {
      const filtered = prev.filter(
        (s) =>
          !(
            s.day_index === activeDay &&
            s.exercise_index === exIndex &&
            s.performed_on === date
          )
      );
      // We don't have the real DB-assigned id here, but we don't use it on the UI.
      return [...filtered, { id: "local", ...row } as ExerciseSet];
    });
  };

  const done = day.exercises.filter((_, i) => checked[`${activeDay}-ex-${i}`])
    .length;
  const total = day.exercises.length;
  const pct = (done / total) * 100;

  const armSets = day.exercises.filter((e) =>
    ["BICEPS", "TRICEPS"].includes(e.focus)
  ).length;
  const legSets = day.exercises.filter((e) =>
    ["QUADS", "HAMS", "CALVES", "GLUTES"].includes(e.focus)
  ).length;
  const abCount = day.abs ? day.abs.length : 0;

  const suggestions: ProgressionSuggestion[] = useMemo(
    () => suggestProgressions(allSets, date),
    [allSets, date]
  );

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
                  transition: "color 0.3s",
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
          <div className="stat">
            <div
              style={{
                fontSize: 8,
                color: "#383838",
                letterSpacing: "0.12em",
                marginBottom: 3,
              }}
            >
              ARMS
            </div>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22,
                color: armSets > 0 ? "#fb923c" : "#1e1e1e",
              }}
            >
              {armSets}
            </div>
          </div>
          <div className="stat">
            <div
              style={{
                fontSize: 8,
                color: "#383838",
                letterSpacing: "0.12em",
                marginBottom: 3,
              }}
            >
              LEGS
            </div>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22,
                color: legSets > 0 ? "#4ade80" : "#1e1e1e",
              }}
            >
              {legSets}
            </div>
          </div>
          <div className="stat">
            <div
              style={{
                fontSize: 8,
                color: "#383838",
                letterSpacing: "0.12em",
                marginBottom: 3,
              }}
            >
              ABS
            </div>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22,
                color: abCount > 0 ? "#e2e8f0" : "#1e1e1e",
              }}
            >
              {abCount}
            </div>
          </div>
          <div className="stat">
            <div
              style={{
                fontSize: 8,
                color: "#383838",
                letterSpacing: "0.12em",
                marginBottom: 3,
              }}
            >
              TOTAL
            </div>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22,
                color: "#fff",
              }}
            >
              {total + abCount}
            </div>
          </div>
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
              transition: "width 0.4s, background 0.3s",
            }}
          />
        </div>

        {/* Progression suggestions — only show when we have data */}
        {suggestions.length > 0 && (
          <div
            style={{
              background: "#0e0e0e",
              border: "1px solid #1a1a1a",
              borderRadius: 11,
              padding: "13px 14px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "#fb923c",
                fontWeight: 700,
                marginBottom: 9,
              }}
            >
              ⬆ READY TO ADD WEIGHT
            </div>
            {suggestions.slice(0, 5).map((s) => (
              <div
                key={`${s.dayIndex}-${s.exerciseIndex}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 0",
                  borderBottom: "1px solid #141414",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: "#ddd", fontWeight: 500 }}>
                    {s.exerciseName}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#555",
                      letterSpacing: "0.05em",
                      marginTop: 2,
                    }}
                  >
                    D{s.dayIndex + 1} · hit top {s.consecutiveTopHits}× in a row
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#fb923c",
                      fontWeight: 700,
                    }}
                  >
                    {s.currentWeight} → {s.suggestedWeight} lb
                  </div>
                  <div style={{ fontSize: 10, color: "#555" }}>+{s.increment} lb</div>
                </div>
              </div>
            ))}
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
              const isDone = !!checked[key];
              const fc = focusColors[ex.focus] || "#555";
              const last = latestSet(allSets, activeDay, i);
              const targetTop = parseTopReps(ex.reps);
              const isEditing = editingKey === key;
              return (
                <div key={i}>
                  <div
                    className={`ex-row${isDone ? " done" : ""}`}
                    onClick={() => toggle(i)}
                  >
                    <div
                      className={`chk${isDone ? " on" : ""}`}
                      style={{ ...({ "--ac": accent } as React.CSSProperties) }}
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
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isDone ? "#2a2a2a" : "#ddd",
                        }}
                      >
                        {ex.name}
                      </div>
                      <span
                        className="ftag"
                        style={{ background: `${fc}18`, color: fc }}
                      >
                        {ex.focus}
                      </span>
                      {last && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            color: last.hit_top ? "#4ade80" : "#666",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          LAST · {last.weight} lb × {last.top_reps}
                          {last.hit_top ? " ✓" : ""}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isDone ? "#2a2a2a" : accent,
                        }}
                      >
                        {ex.sets} × {ex.reps}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingKey(isEditing ? null : key);
                        }}
                        style={{
                          marginTop: 4,
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          color: "#fb923c",
                          background: "transparent",
                          border: "1px solid #2a1a0a",
                          padding: "3px 7px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        {isEditing ? "CLOSE" : "LOG"}
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <LogSetForm
                      exerciseIndex={i}
                      targetTop={targetTop}
                      initialWeight={last?.weight ?? null}
                      initialReps={last?.top_reps ?? null}
                      accent={accent}
                      onSave={async (w, r) => {
                        await saveSet(i, w, r, targetTop);
                        setEditingKey(null);
                      }}
                      incrementHint={incrementFor(ex.focus)}
                    />
                  )}
                </div>
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
                Abs are trained 4× this week. For them to POP on a cut, weighted
                movements like cable crunch matter more than crunches — they
                build the actual muscle. Cardio reveals them, training builds them.
              </div>
            </div>
            {day.abs.map((ex, i) => {
              const key = `${activeDay}-abs-${i}`;
              const isDone = !!absChecked[key];
              return (
                <div
                  key={i}
                  className={`ex-row${isDone ? " done" : ""}`}
                  onClick={() => toggleAbs(i)}
                >
                  <div
                    className={`chk${isDone ? " on" : ""}`}
                    style={{ ...({ "--ac": accent } as React.CSSProperties) }}
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
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: isDone ? "#2a2a2a" : "#ddd",
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
                        color: isDone ? "#2a2a2a" : accent,
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
              <div
                style={{
                  fontSize: 9,
                  color: "#252525",
                  marginTop: 10,
                }}
              >
                Sets per week · Science target: 10–20 for growth
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline "log this set" form. Two fields: weight + top reps. Saves on Enter or Save tap.
function LogSetForm({
  exerciseIndex,
  targetTop,
  initialWeight,
  initialReps,
  accent,
  onSave,
  incrementHint,
}: {
  exerciseIndex: number;
  targetTop: number | null;
  initialWeight: number | null;
  initialReps: number | null;
  accent: string;
  onSave: (weight: number, reps: number) => Promise<void>;
  incrementHint: number;
}) {
  const [weight, setWeight] = useState<string>(
    initialWeight != null ? String(initialWeight) : ""
  );
  const [reps, setReps] = useState<string>(
    initialReps != null ? String(initialReps) : ""
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (Number.isNaN(w) || Number.isNaN(r)) return;
    setSaving(true);
    await onSave(w, r);
    setSaving(false);
  };

  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #181818",
        borderRadius: 10,
        padding: "10px 12px",
        marginTop: -2,
        marginBottom: 8,
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: 8,
        alignItems: "end",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <label style={{ fontSize: 9, letterSpacing: "0.12em", color: "#555" }}>
        WEIGHT (LB)
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            background: "#111",
            border: "1px solid #1f1f1f",
            color: "#fff",
            padding: "8px 9px",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </label>
      <label style={{ fontSize: 9, letterSpacing: "0.12em", color: "#555" }}>
        TOP REPS
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={targetTop != null ? `goal ${targetTop}` : ""}
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            background: "#111",
            border: "1px solid #1f1f1f",
            color: "#fff",
            padding: "8px 9px",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </label>
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
        }}
      >
        {saving ? "..." : "SAVE"}
      </button>
      {targetTop != null && (
        <div
          style={{
            gridColumn: "1 / -1",
            fontSize: 10,
            color: "#444",
            letterSpacing: "0.04em",
            marginTop: -2,
          }}
        >
          Hit {targetTop} reps two sessions in a row → app will tell you to add{" "}
          {incrementHint} lb. Exercise #{exerciseIndex + 1}.
        </div>
      )}
    </div>
  );
}
