"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Single-user app — only this email can sign in.
const ALLOWED_EMAIL = "jamalethan110@gmail.com";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      setError("This account isn't authorized.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) setError(error.message);
      else window.location.href = "/";
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
            SIGN IN
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#3a3a3a",
            }}
          >
            PRIVATE · INVITE ONLY
          </div>
        </div>

        <form onSubmit={handle} className="card">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div style={{ height: 10 }} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
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
          <div style={{ height: 14 }} />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={submitting}
          >
            {submitting ? "…" : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
