"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/workoutData";
import type { WeightEntry } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function WeightTracker() {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("weight_entries")
      .select("*")
      .order("entry_date", { ascending: true });
    if (data) setEntries(data as WeightEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || isNaN(w)) return;
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setSaving(false);
      return;
    }
    await supabase.from("weight_entries").upsert(
      {
        user_id: user.id,
        weight: w,
        unit,
        entry_date: date,
        note: note || null,
      },
      { onConflict: "user_id,entry_date" }
    );
    setWeight("");
    setNote("");
    await load();
    setSaving(false);
  };

  const remove = async (id: string) => {
    await supabase.from("weight_entries").delete().eq("id", id);
    await load();
  };

  const chartData = entries.map((e) => ({
    date: e.entry_date.slice(5),
    weight: Number(e.weight),
  }));

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const delta =
    latest && first ? Number(latest.weight) - Number(first.weight) : 0;
  const deltaSign = delta > 0 ? "+" : "";

  return (
    <div style={{ padding: "22px 18px 32px", minHeight: "100vh" }}>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "#3a3a3a",
            marginBottom: 3,
          }}
        >
          BODYWEIGHT
        </div>
        <div
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 28,
            letterSpacing: "0.04em",
            color: "#fff",
          }}
        >
          WEIGHT LOG
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
        <div className="stat">
          <div
            style={{
              fontSize: 8,
              color: "#383838",
              letterSpacing: "0.12em",
              marginBottom: 3,
            }}
          >
            CURRENT
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: "#fff",
            }}
          >
            {latest ? `${latest.weight}` : "—"}
            <span style={{ fontSize: 11, color: "#555", marginLeft: 4 }}>
              {latest?.unit}
            </span>
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
            CHANGE
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: delta < 0 ? "#4ade80" : delta > 0 ? "#fb923c" : "#fff",
            }}
          >
            {entries.length > 1 ? `${deltaSign}${delta.toFixed(1)}` : "—"}
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
            ENTRIES
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: "#fff",
            }}
          >
            {entries.length}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 18, height: 220 }}>
        {entries.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#333",
              fontSize: 12,
            }}
          >
            {loading ? "Loading…" : "Log your first weigh-in to see the chart."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#161616" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#444" fontSize={10} />
              <YAxis stroke="#444" fontSize={10} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "#0e0e0e",
                  border: "1px solid #222",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#00D4AA"
                strokeWidth={2}
                dot={{ r: 3, fill: "#00D4AA" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Entry form */}
      <form onSubmit={save} className="card" style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 9,
            color: "#383838",
            letterSpacing: "0.18em",
            marginBottom: 10,
          }}
        >
          NEW ENTRY
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}
        >
          <input
            inputMode="decimal"
            placeholder="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </div>
        <div style={{ height: 8 }} />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div style={{ height: 8 }} />
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div style={{ height: 12 }} />
        <button
          type="submit"
          className="btn-primary"
          disabled={saving || !weight}
          style={{ width: "100%" }}
        >
          {saving ? "SAVING…" : "LOG WEIGHT"}
        </button>
      </form>

      {/* History */}
      <div className="card">
        <div
          style={{
            fontSize: 9,
            color: "#383838",
            letterSpacing: "0.18em",
            marginBottom: 10,
          }}
        >
          HISTORY
        </div>
        {entries.length === 0 ? (
          <div style={{ color: "#444", fontSize: 12, padding: "10px 0" }}>
            No entries yet.
          </div>
        ) : (
          [...entries].reverse().map((e) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #141414",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#ddd" }}>
                  {e.weight}{" "}
                  <span style={{ fontSize: 11, color: "#555" }}>{e.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>
                  {e.entry_date}
                  {e.note ? ` · ${e.note}` : ""}
                </div>
              </div>
              <button className="btn-ghost" onClick={() => remove(e.id)}>
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
