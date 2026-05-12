"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/workoutData";
import type { FoodEntry, FoodFavorite } from "@/lib/types";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";
const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export default function FoodTracker() {
  const supabase = useMemo(() => createClient(), []);
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [favorites, setFavorites] = useState<FoodFavorite[]>([]);
  const [tab, setTab] = useState<"log" | "favorites">("log");
  const [loading, setLoading] = useState(true);

  // form
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servings, setServings] = useState("1");
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [saveAsFav, setSaveAsFav] = useState(false);
  const [servingLabel, setServingLabel] = useState("");

  // favorite editor
  const [favName, setFavName] = useState("");
  const [favCal, setFavCal] = useState("");
  const [favP, setFavP] = useState("");
  const [favC, setFavC] = useState("");
  const [favF, setFavF] = useState("");
  const [favLabel, setFavLabel] = useState("");

  const loadEntries = async () => {
    const { data } = await supabase
      .from("food_entries")
      .select("*")
      .eq("entry_date", date)
      .order("created_at", { ascending: true });
    if (data) setEntries(data as FoodEntry[]);
  };

  const loadFavorites = async () => {
    const { data } = await supabase
      .from("food_favorites")
      .select("*")
      .order("name", { ascending: true });
    if (data) setFavorites(data as FoodFavorite[]);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEntries(), loadFavorites()]).then(() =>
      setLoading(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const totals = entries.reduce(
    (acc, e) => {
      const m = Number(e.servings);
      acc.cal += Number(e.calories) * m;
      acc.p += Number(e.protein) * m;
      acc.c += Number(e.carbs) * m;
      acc.f += Number(e.fat) * m;
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setServings("1");
    setSaveAsFav(false);
    setServingLabel("");
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const payload = {
      user_id: user.id,
      name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      servings: parseFloat(servings) || 1,
      meal,
      entry_date: date,
    };
    await supabase.from("food_entries").insert(payload);
    if (saveAsFav) {
      await supabase.from("food_favorites").upsert(
        {
          user_id: user.id,
          name,
          calories: parseFloat(calories) || 0,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
          serving_label: servingLabel || null,
        },
        { onConflict: "user_id,name" }
      );
      await loadFavorites();
    }
    resetForm();
    await loadEntries();
  };

  const removeEntry = async (id: string) => {
    await supabase.from("food_entries").delete().eq("id", id);
    await loadEntries();
  };

  const useFavorite = async (f: FoodFavorite, asMeal: Meal) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("food_entries").insert({
      user_id: user.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      servings: 1,
      meal: asMeal,
      entry_date: date,
    });
    await loadEntries();
    setTab("log");
  };

  const addFavorite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!favName) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("food_favorites").upsert(
      {
        user_id: user.id,
        name: favName,
        calories: parseFloat(favCal) || 0,
        protein: parseFloat(favP) || 0,
        carbs: parseFloat(favC) || 0,
        fat: parseFloat(favF) || 0,
        serving_label: favLabel || null,
      },
      { onConflict: "user_id,name" }
    );
    setFavName("");
    setFavCal("");
    setFavP("");
    setFavC("");
    setFavF("");
    setFavLabel("");
    await loadFavorites();
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("food_favorites").delete().eq("id", id);
    await loadFavorites();
  };

  return (
    <div style={{ padding: "22px 18px 32px", minHeight: "100vh" }}>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "#3a3a3a",
            marginBottom: 3,
          }}
        >
          NUTRITION
        </div>
        <div
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 28,
            letterSpacing: "0.04em",
            color: "#fff",
          }}
        >
          FOOD LOG
        </div>
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {/* Totals */}
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        <div className="stat">
          <div
            style={{
              fontSize: 8,
              color: "#383838",
              letterSpacing: "0.12em",
              marginBottom: 3,
            }}
          >
            CALORIES
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: "#fff",
            }}
          >
            {Math.round(totals.cal)}
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
            PROTEIN
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: "#fb923c",
            }}
          >
            {Math.round(totals.p)}
            <span style={{ fontSize: 10, color: "#555", marginLeft: 2 }}>
              g
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
            CARBS
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: "#facc15",
            }}
          >
            {Math.round(totals.c)}
            <span style={{ fontSize: 10, color: "#555", marginLeft: 2 }}>
              g
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
            FAT
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 22,
              color: "#a78bfa",
            }}
          >
            {Math.round(totals.f)}
            <span style={{ fontSize: 10, color: "#555", marginLeft: 2 }}>
              g
            </span>
          </div>
        </div>
      </div>

      {/* Segment */}
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
        {(["log", "favorites"] as const).map((t) => (
          <button
            key={t}
            className="seg-btn"
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? "#fff2" : "transparent",
              color: tab === t ? "#fff" : "#333",
              outline: tab === t ? "1px solid #fff3" : "none",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <>
          {/* Add form */}
          <form onSubmit={addEntry} className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 9,
                color: "#383838",
                letterSpacing: "0.18em",
                marginBottom: 10,
              }}
            >
              ADD FOOD
            </div>
            <input
              placeholder="Food name (e.g. Chicken breast)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div style={{ height: 8 }} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <input
                inputMode="decimal"
                placeholder="Calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Protein (g)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Carbs (g)"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Fat (g)"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Servings"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
              <select
                value={meal}
                onChange={(e) => setMeal(e.target.value as Meal)}
              >
                {MEALS.map((m) => (
                  <option key={m} value={m}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
                color: "#888",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={saveAsFav}
                onChange={(e) => setSaveAsFav(e.target.checked)}
                style={{ width: "auto" }}
              />
              Save as favorite
            </label>
            {saveAsFav && (
              <>
                <div style={{ height: 8 }} />
                <input
                  placeholder='Serving label (e.g. "1 scoop", "100g")'
                  value={servingLabel}
                  onChange={(e) => setServingLabel(e.target.value)}
                />
              </>
            )}
            <div style={{ height: 12 }} />
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={!name}
            >
              ADD TO {meal.toUpperCase()}
            </button>
          </form>

          {/* Quick add from favorites */}
          {favorites.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 9,
                  color: "#383838",
                  letterSpacing: "0.18em",
                  marginBottom: 10,
                }}
              >
                QUICK ADD FROM FAVORITES → {meal.toUpperCase()}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {favorites.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => useFavorite(f, meal)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      background: "#141414",
                      border: "1px solid #222",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      color: "#ddd",
                    }}
                  >
                    + {f.name}{" "}
                    <span style={{ color: "#555", fontSize: 10 }}>
                      {Math.round(Number(f.calories))}c · {Math.round(Number(f.protein))}p
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meals */}
          {MEALS.map((m) => {
            const items = entries.filter((e) => e.meal === m);
            if (items.length === 0) return null;
            const mealCal = items.reduce(
              (s, e) => s + Number(e.calories) * Number(e.servings),
              0
            );
            return (
              <div className="card" key={m} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#ccc",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {m}
                  </div>
                  <div style={{ fontSize: 11, color: "#666" }}>
                    {Math.round(mealCal)} cal
                  </div>
                </div>
                {items.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #141414",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#ddd" }}>
                        {e.name}{" "}
                        {Number(e.servings) !== 1 && (
                          <span style={{ color: "#555", fontSize: 11 }}>
                            × {e.servings}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#555" }}>
                        {Math.round(Number(e.calories) * Number(e.servings))}c ·{" "}
                        {Math.round(Number(e.protein) * Number(e.servings))}p ·{" "}
                        {Math.round(Number(e.carbs) * Number(e.servings))}c ·{" "}
                        {Math.round(Number(e.fat) * Number(e.servings))}f
                      </div>
                    </div>
                    <button
                      className="btn-ghost"
                      onClick={() => removeEntry(e.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          {!loading && entries.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#333",
                fontSize: 12,
                padding: "30px 10px",
              }}
            >
              No food logged for this date.
            </div>
          )}
        </>
      )}

      {tab === "favorites" && (
        <>
          <form onSubmit={addFavorite} className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 9,
                color: "#383838",
                letterSpacing: "0.18em",
                marginBottom: 10,
              }}
            >
              NEW FAVORITE
            </div>
            <input
              placeholder="Food name"
              value={favName}
              onChange={(e) => setFavName(e.target.value)}
            />
            <div style={{ height: 8 }} />
            <input
              placeholder='Serving label (e.g. "1 cup")'
              value={favLabel}
              onChange={(e) => setFavLabel(e.target.value)}
            />
            <div style={{ height: 8 }} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <input
                inputMode="decimal"
                placeholder="Calories"
                value={favCal}
                onChange={(e) => setFavCal(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Protein (g)"
                value={favP}
                onChange={(e) => setFavP(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Carbs (g)"
                value={favC}
                onChange={(e) => setFavC(e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="Fat (g)"
                value={favF}
                onChange={(e) => setFavF(e.target.value)}
              />
            </div>
            <div style={{ height: 12 }} />
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={!favName}
            >
              SAVE FAVORITE
            </button>
          </form>

          <div className="card">
            <div
              style={{
                fontSize: 9,
                color: "#383838",
                letterSpacing: "0.18em",
                marginBottom: 10,
              }}
            >
              YOUR FAVORITES
            </div>
            {favorites.length === 0 ? (
              <div style={{ color: "#444", fontSize: 12, padding: "10px 0" }}>
                No favorites yet. Add foods you eat often for one-tap logging.
              </div>
            ) : (
              favorites.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #141414",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#ddd" }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>
                      {f.serving_label ? `${f.serving_label} · ` : ""}
                      {Math.round(Number(f.calories))}c ·{" "}
                      {Math.round(Number(f.protein))}p ·{" "}
                      {Math.round(Number(f.carbs))}c ·{" "}
                      {Math.round(Number(f.fat))}f
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => removeFavorite(f.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
