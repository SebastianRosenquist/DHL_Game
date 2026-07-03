"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { apiSend, fetcher } from "@/lib/fetcher";
import { formatDistance, formatDuration } from "@/lib/format";

type Team = { id: string; name: string; colorHex: string };
type Row = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  runs: number;
  totalM: number;
};
type Run = {
  id: string;
  distanceM: number;
  elapsedSec: number;
  localDate: string;
  source: string;
};

export default function UserManager() {
  const { data } = useSWR<{ users: Row[] }>("/api/users", fetcher);
  const { data: teamData } = useSWR<{ teams: Team[] }>("/api/teams", fetcher);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTeam, setEditTeam] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);

  const users = data?.users ?? [];
  const teams = teamData?.teams ?? [];

  function refresh() {
    mutate("/api/users");
    mutate("/api/standings");
  }

  function startEdit(r: Row) {
    setEditId(r.id);
    setEditName(r.name);
    setEditTeam(r.teamId);
    setError(null);
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await apiSend(`/api/users/${id}`, "PATCH", {
        name: editName.trim(),
        teamId: editTeam,
      });
      setEditId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function deleteUser(r: Row) {
    if (
      !confirm(
        `Delete ${r.name} and all ${r.runs} of their run(s)? This can't be undone.`,
      )
    )
      return;
    try {
      await apiSend(`/api/users/${r.id}`, "DELETE");
      if (expandedId === r.id) setExpandedId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleRuns(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const res = await fetch(`/api/users/${id}/activities`);
    const body = await res.json().catch(() => ({ activities: [] }));
    setRuns(body.activities ?? []);
  }

  async function deleteRun(runId: string, userId: string) {
    if (!confirm("Delete this run?")) return;
    await apiSend(`/api/activities/${runId}`, "DELETE");
    const res = await fetch(`/api/users/${userId}/activities`);
    const body = await res.json().catch(() => ({ activities: [] }));
    setRuns(body.activities ?? []);
    refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-bold">Runners</h2>
      <p className="mt-1 text-sm text-gray-500">
        Edit a runner&apos;s name or team, review their runs, or remove them and
        their data.
      </p>
      {error && <p className="mt-2 text-sm text-dhlRed">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-3 py-2 font-medium">Runs</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((r) => (
                <FragmentRow
                  key={r.id}
                  r={r}
                  teams={teams}
                  isEditing={editId === r.id}
                  editName={editName}
                  editTeam={editTeam}
                  onEditName={setEditName}
                  onEditTeam={setEditTeam}
                  onStartEdit={() => startEdit(r)}
                  onSave={() => saveEdit(r.id)}
                  onCancel={() => setEditId(null)}
                  onDelete={() => deleteUser(r)}
                  expanded={expandedId === r.id}
                  onToggleRuns={() => toggleRuns(r.id)}
                  runs={expandedId === r.id ? runs : []}
                  onDeleteRun={(runId) => deleteRun(runId, r.id)}
                />
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-gray-500">
                    No runners have joined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  r,
  teams,
  isEditing,
  editName,
  editTeam,
  onEditName,
  onEditTeam,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  expanded,
  onToggleRuns,
  runs,
  onDeleteRun,
}: {
  r: Row;
  teams: Team[];
  isEditing: boolean;
  editName: string;
  editTeam: string;
  onEditName: (v: string) => void;
  onEditTeam: (v: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  expanded: boolean;
  onToggleRuns: () => void;
  runs: Run[];
  onDeleteRun: (runId: string) => void;
}) {
  return (
    <>
      <tr className="border-t border-gray-100 align-middle">
        <td className="px-3 py-2">
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1"
              maxLength={40}
            />
          ) : (
            <span className="font-medium">{r.name}</span>
          )}
        </td>
        <td className="px-3 py-2">
          {isEditing ? (
            <select
              value={editTeam}
              onChange={(e) => onEditTeam(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: r.teamColor }}
              />
              {r.teamName}
            </span>
          )}
        </td>
        <td className="px-3 py-2 tabular-nums">{r.runs}</td>
        <td className="px-3 py-2 tabular-nums">{formatDistance(r.totalM)}</td>
        <td className="px-3 py-2 text-right">
          {isEditing ? (
            <span className="flex justify-end gap-2">
              <button onClick={onSave} className="font-medium text-emerald-600">
                Save
              </button>
              <button onClick={onCancel} className="text-gray-400">
                Cancel
              </button>
            </span>
          ) : (
            <span className="flex justify-end gap-3 text-gray-500">
              <button onClick={onToggleRuns} className="hover:text-ink">
                {expanded ? "Hide" : "Runs"}
              </button>
              <button onClick={onStartEdit} className="hover:text-ink">
                Edit
              </button>
              <button onClick={onDelete} className="text-dhlRed hover:underline">
                Delete
              </button>
            </span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-gray-100 bg-gray-50/60">
          <td colSpan={5} className="px-3 py-2">
            {runs.length === 0 ? (
              <span className="text-xs text-gray-500">No runs.</span>
            ) : (
              <ul className="space-y-1">
                {runs.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="tabular-nums text-gray-600">
                      {run.localDate} · {formatDistance(run.distanceM)} ·{" "}
                      {formatDuration(run.elapsedSec)} ·{" "}
                      <span className="uppercase text-gray-400">{run.source}</span>
                    </span>
                    <button
                      onClick={() => onDeleteRun(run.id)}
                      className="text-dhlRed hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
