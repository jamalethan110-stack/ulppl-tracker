"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(error.message);
        else window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback`
                : undefined,
          },
        });
        if (error) setError(error.message);
        else
          setInfo(
            "Account created. Check your email to confirm — or sign in if confirmation is disabled."
          );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              color: "#3a3a3a",
              marginBottom: 6,
            }}
          >
            ULPPL · TRACKER
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 34,
              letterSpacing: "0.04em",
              color: "#fff",
            }}
          >
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </div>
        </div>

        <form onSubmit={handle} className="card">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div style={{ height: 10 }} />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}
          {info && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#4ade80",
              }}
            >
              {info}
            </div>
          )}
          <div style={{ height: 14 }} />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={submitting}
          >
            {submitting
              ? "…"
              : mode === "signin"
              ? "SIGN IN"
              : "CREATE ACCOUNT"}
          </button>
          <div style={{ height: 12 }} />
          <button
            type="button"
            className="btn-ghost"
            style={{ width: "100%", textAlign: "center" }}
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
