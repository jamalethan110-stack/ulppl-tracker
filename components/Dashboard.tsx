"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { split, defaultDayIndexForToday, todayISO } from "@/lib/workoutData";
import { suggestProgressions, type ProgressionSuggestion } from "@/lib/progression";
import type { ExerciseSet } from "@/lib/types";

export default function Dashboard() {
  const supabase = useMemo(() => createClient(), []);
  const today = todayISO();
  const dayIdx = defaultDayIndexForToday();
  const day = split[dayIdx];

  const [email, setEmail] = useState<string>("");
  const [doneCount, setDoneCount] = useState(0);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user?.email) setEmail(u.user.email);

      const { data: wc } = await supabase
        .from("workout_completions")
        .select("exercise_index")
        .eq("completed_on", today)
        .eq("day_index", dayIdx)
        .eq("kind", "main");
      setDoneCount(wc?.length ?? 0);

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceISO = since.toISOString().slice(0, 10);
      const { data: setsData } = await supabase
        .from("exercise_sets")
        .select("*")
        .gte("performed_on", sinceISO);
      setSuggestions(
        suggestProgressions((setsData ?? []) as ExerciseSet[], today)
      );
    })();
  }, [supabase, today, dayIdx]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const totalEx = day.exercises.length;
  const pct = totalEx ? Math.round((doneCount / totalEx) * 100) : 0;

  return (
    <div style={{ padding: "22px 18px 32px", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
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
            {email.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 28,
              letterSpacing: "0.04em",
              color: "#fff",
            }}
          >
            TODAY
          </div>
        </div>
        <button className="btn-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>

      {/* Today's workout */}
      <Link
        href="/workout"
        className="card"
        style={{
          display: "block",
          marginBottom: 12,
          textDecoration: "none",
          color: "inherit",
          borderLeft: `3px solid ${day.accent}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: day.accent,
                letterSpacing: "0.18em",
                marginBottom: 4,
                fontWeight: 700,
              }}
            >
              WORKOUT · {day.sublabel}
            </div>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 28,
                color: "#fff",
              }}
            >
              {day.label}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22,
                color: day.accent,
              }}
            >
              {doneCount}/{totalEx}
            </div>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.1em" }}>
              {pct}% DONE
            </div>
          </div>
        </div>
        <div
          style={{
            height: 2,
            background: "#141414",
            borderRadius: 2,
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: day.accent,
              transition: "width 0.4s",
            }}
          />
        </div>
      </Link>

      {/* Progression — exercises ready for a weight bump */}
      <Link
        href="/workout"
        className="card"
        style={{
          display: "block",
          marginBottom: 12,
          textDecoration: "none",
          color: "inherit",
          borderLeft: "3px solid #fb923c",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#fb923c",
            letterSpacing: "0.18em",
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          ⬆ PROGRESSION
        </div>
        {suggestions.length === 0 ? (
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.55 }}>
            Log a weight on each exercise as you train. After you hit the top of
            the rep range two sessions in a row, this card will tell you exactly
            which lifts to bump up and by how much.
          </div>
        ) : (
          <div>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 26,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              {suggestions.length} {suggestions.length === 1 ? "LIFT" : "LIFTS"} READY
            </div>
            {suggestions.slice(0, 3).map((s) => (
              <div
                key={`${s.dayIndex}-${s.exerciseIndex}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#bbb",
                  padding: "4px 0",
                  borderBottom: "1px solid #141414",
                }}
              >
                <span>{s.exerciseName}</span>
                <span style={{ color: "#fb923c", fontWeight: 700 }}>
                  +{s.increment} lb
                </span>
              </div>
            ))}
            {suggestions.length > 3 && (
              <div
                style={{
                  fontSize: 10,
                  color: "#555",
                  marginTop: 6,
                  letterSpacing: "0.05em",
                }}
              >
                + {suggestions.length - 3} more — see Train tab
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Quick link */}
      <Link
        href="/workout"
        className="btn-primary"
        style={{
          width: "auto",
          justifyContent: "center",
          padding: "14px",
          display: "flex",
        }}
      >
        START WORKOUT
      </Link>
    </div>
  );
}
