"use client";

import { useState } from "react";
import { supabase } from "/workspaces/daily-reflection-journal/daily-reflection-journal/lib/subabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fn =
        mode === "login"
          ? supabase.auth.signInWithPassword
          : supabase.auth.signUp;

      const { error } = await fn({ email, password });
      if (error) throw error;

      router.push("/today");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold mb-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm opacity-70 mb-6">Private daily reflection.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            className="w-full rounded-xl border px-4 py-3 font-medium"
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button
          className="mt-4 text-sm underline opacity-80"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          type="button"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}