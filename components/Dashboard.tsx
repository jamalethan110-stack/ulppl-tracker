"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { split, defaultDayIndexForToday, todayISO } from "@/lib/workoutData";

export default function Dashboard() {
  const supabase = useMemo(() => createClient(), []);
  const today = todayISO();
  const dayIdx = defaultDayIndexForToday();
  const day = split[dayIdx];

  const [email, setEmail] = useState<string>("");
  const [doneCount, setDoneCount] = useState(0);
  const [latestWeight, setLatestWeight] = useState<{ w: number; u: string } | null>(
    null
  );
  const [todayCals, setTodayCals] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);

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

      const { data: we } = await supabase
        .from("weight_entries")
        .select("weight, unit")
        .order("entry_date", { ascending: false })
        .limit(1);
      if (we && we[0])
        setLatestWeight({ w: Number(we[0].weight), u: we[0].unit });

      const { data: fe } = await supabase
        .from("food_entries")
        .select("calories, protein, servings")
        .eq("entry_date", today);
      if (fe) {
        let c = 0;
        let p = 0;
        for (const r of fe) {
          c += Number(r.calories) * Number(r.servings);
          p += Number(r.protein) * Number(r.servings);
        }
        setTodayCals(Math.round(c));
        setTodayProtein(Math.round(p));
      }
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

      {/* Weight + food */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Link
          href="/weight"
          className="card"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#383838",
              letterSpacing: "0.18em",
              marginBottom: 4,
            }}
          >
            WEIGHT
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 26,
              color: "#fff",
            }}
          >
            {latestWeight ? latestWeight.w : "—"}
            {latestWeight && (
              <span
                style={{ fontSize: 12, color: "#555", marginLeft: 4 }}
              >
                {latestWeight.u}
              </span>
            )}
          </div>
        </Link>
        <Link
          href="/food"
          className="card"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#383838",
              letterSpacing: "0.18em",
              marginBottom: 4,
            }}
          >
            TODAY · CAL / PROTEIN
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 26,
              color: "#fff",
            }}
          >
            {todayCals}
            <span style={{ fontSize: 12, color: "#555", marginLeft: 4 }}>
              cal
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#fb923c", marginTop: 2 }}>
            {todayProtein}g protein
          </div>
        </Link>
      </div>

      {/* Quick links */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <Link
          href="/workout"
          className="btn-primary"
          style={{
            width: "auto",
            justifyContent: "center",
            padding: "14px",
          }}
        >
          START WORKOUT
        </Link>
        <Link
          href="/food"
          className="btn-primary"
          style={{
            width: "auto",
            justifyContent: "center",
            padding: "14px",
            background: "#1a1a1a",
            color: "#fff",
          }}
        >
          LOG FOOD
        </Link>
      </div>
    </div>
  );
}
