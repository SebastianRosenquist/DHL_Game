"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { CHARACTERS, TEAM_COLORS, characterEmoji } from "@/lib/characters";
import { apiSend, fetcher } from "@/lib/fetcher";

type Team = { id: string; name: string; character: string; colorHex: string };

const blank = { name: "", character: CHARACTERS[0].key, colorHex: TEAM_COLORS[0] };

export default function TeamManager() {
  const { data } = useSWR<{ teams: Team[] }>("/api/teams", fetcher);
  const [form, setForm] = useState<{ name: string; character: string; colorHex: string }>(
    blank,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const teams = data?.teams ?? [];

  function refresh() {
    mutate("/api/teams");
    mutate("/api/standings");
  }

  async function save() {
    setError(null);
    try {
      if (editingId) {
        await apiSend(`/api/teams/${editingId}`, "PATCH", form);
      } else {
        await apiSend("/api/teams", "POST", form);
      }
      setForm(blank);
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this team? All its runs and members will be removed.")) return;
    try {
      await apiSend(`/api/teams/${id}`, "DELETE");
      if (editingId === id) {
        setEditingId(null);
        setForm(blank);
      }
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-bold">Teams</h2>

      {/* existing teams */}
      <div className="mt-4 space-y-2">
        {teams.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg ring-2 ring-white"
              style={{ background: t.colorHex }}
            >
              {characterEmoji(t.character)}
            </span>
            <span className="flex-1 font-medium">{t.name}</span>
            <button
              onClick={() => {
                setEditingId(t.id);
                setForm({ name: t.name, character: t.character, colorHex: t.colorHex });
              }}
              className="text-sm text-gray-500 hover:text-ink"
            >
              Edit
            </button>
            <button
              onClick={() => remove(t.id)}
              className="text-sm text-dhlRed hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {teams.length === 0 && (
          <p className="text-sm text-gray-500">No teams yet — create one below.</p>
        )}
      </div>

      {/* create / edit form */}
      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <h3 className="text-sm font-semibold">
          {editingId ? "Edit team" : "New team"}
        </h3>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Team name"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
          maxLength={40}
        />

        <div className="mt-3 text-xs font-medium text-gray-500">Character</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {CHARACTERS.map((c) => (
            <button
              key={c.key}
              onClick={() => setForm({ ...form, character: c.key })}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                form.character === c.key ? "bg-ink" : "bg-white hover:bg-gray-100"
              }`}
              title={c.label}
            >
              {c.emoji}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs font-medium text-gray-500">Color</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {TEAM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setForm({ ...form, colorHex: c })}
              className={`h-8 w-8 rounded-full ring-2 ${
                form.colorHex === c ? "ring-ink" : "ring-white"
              }`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={form.colorHex}
            onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
          />
        </div>

        {error && <p className="mt-3 text-sm text-dhlRed">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            {editingId ? "Save changes" : "Create team"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(blank);
              }}
              className="rounded-lg px-4 py-2 text-sm text-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
