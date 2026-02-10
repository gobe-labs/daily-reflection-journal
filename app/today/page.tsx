"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "/workspaces/daily-reflection-journal/daily-reflection-journal/lib/subabaseClient";

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

function todayISODate() {
  // store as YYYY-MM-DD (matches Postgres date)
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TodayPage() {
  const router = useRouter();
  const date = useMemo(() => todayISODate(), []);

  const [mood, setMood] = useState<number>(3);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setStatus(null);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // Load today's entry if it exists
      const { data, error } = await supabase
        .from("journal_entries")
        .select("mood, content")
        .eq("user_id", user.id)
        .eq("entry_date", date)
        .maybeSingle();

      if (!error && data) {
        setMood(data.mood ?? 3);
        setContent(data.content ?? "");
      }

      setLoading(false);
    })();
  }, [router, date]);

  async function save() {
    setSaving(true);
    setStatus(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("journal_entries").upsert(
      {
        user_id: user.id,
        entry_date: date,
        mood,
        content,
      },
      { onConflict: "user_id,entry_date" }
    );

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Saved ✅");
    }

    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Today</h1>
            <p className="text-sm opacity-70">{date}</p>
          </div>
          <button className="text-sm underline opacity-80" onClick={logout}>
            Log out
          </button>
        </header>

        <section className="rounded-2xl border p-5 space-y-4">
          <div>
            <div className="text-sm opacity-70 mb-2">Mood</div>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`rounded-xl border px-3 py-2 text-xl ${
                    mood === m.value ? "opacity-100" : "opacity-60"
                  }`}
                  title={m.label}
                  type="button"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm opacity-70 mb-2">Reflection</div>
            <textarea
              className="w-full rounded-xl border p-4 min-h-[180px]"
              placeholder="Write a few sentences…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              className="rounded-xl border px-4 py-3 font-medium"
              disabled={saving}
              type="button"
            >
              {saving ? "Saving…" : "Save reflection"}
            </button>
            {status && <div className="text-sm opacity-80">{status}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
