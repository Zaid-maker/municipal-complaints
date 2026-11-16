import { useState } from "react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";
import { Alert, Button, SelectField, TextField } from "../components/ui";

export default function StaffComplaintControls({
  complaint,
  staff,
  statuses,
  onUpdated
}) {
  const { user, token } = useAuth();

  const isAdmin = user.role === "admin";
  const isMine = complaint.officer?.id === user.id;
  const isUnassigned = !complaint.officer;
  const canUpdate = isAdmin || isMine;

  const [assignedTo, setAssignedTo] = useState(complaint.officer?.id ?? "");
  const [status, setStatus] = useState(complaint.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const assignmentChanged =
    isAdmin && assignedTo !== (complaint.officer?.id ?? "");
  const statusChanged = status !== complaint.status;
  const dirty = assignmentChanged || statusChanged || Boolean(note.trim());

  const officerOptions =
    complaint.officer && !staff.some((account) => account.id === complaint.officer.id)
      ? [complaint.officer, ...staff]
      : staff;

  async function send(body) {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload = await apiRequest(
        `/api/complaints/${encodeURIComponent(complaint.reference)}`,
        { method: "PATCH", token, body }
      );

      setSaved(true);
      setNote("");
      onUpdated(payload.data.complaint);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    send({
      assignedTo: assignmentChanged ? assignedTo || null : undefined,
      status: statusChanged ? status : undefined,
      note: note.trim() || undefined
    });
  }

  const reporterLabel = complaint.reporter?.name ?? complaint.reporter?.displayName ?? "Citizen";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Reported by {reporterLabel}
          {complaint.reporter?.email ? ` · ${complaint.reporter.email}` : ""}
        </span>

        <span>
          {complaint.officer
            ? `Assigned to ${complaint.officer.name}`
            : "Unassigned"}
        </span>
      </div>

      {error && <Alert>{error.message}</Alert>}

      {isUnassigned && !isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Claim this complaint to work on it.
          </p>

          <Button
            type="button"
            busy={saving}
            onClick={() => send({ assignedTo: user.id })}
          >
            Claim complaint
          </Button>
        </div>
      )}

      {!isAdmin && !isUnassigned && !isMine && (
        <p className="text-xs text-slate-500">
          Only {complaint.officer?.name ?? "the assigned officer"} or an
          administrator can update this complaint.
        </p>
      )}

      {canUpdate && !(isUnassigned && !isAdmin) && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className={isAdmin ? "grid gap-3 sm:grid-cols-2" : ""}>
            {isAdmin && (
              <SelectField
                id={`assign-${complaint.id}`}
                label="Assign to"
                value={assignedTo}
                onChange={(event) => {
                  setAssignedTo(event.target.value);
                  setSaved(false);
                }}
              >
                <option value="">Unassigned</option>
                {officerOptions.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </SelectField>
            )}

            <SelectField
              id={`status-${complaint.id}`}
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setSaved(false);
              }}
            >
              {statuses.length > 0 ? (
                statuses.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.label}
                  </option>
                ))
              ) : (
                <option value={complaint.status}>{complaint.statusLabel}</option>
              )}
            </SelectField>
          </div>

          <TextField
            id={`note-${complaint.id}`}
            label="Note (optional)"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            placeholder="What did you tell the officer, or what changed on site?"
            maxLength={500}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" busy={saving} disabled={!dirty || saving}>
              Save changes
            </Button>

            {saved && (
              <span className="text-xs font-medium text-emerald-700">Saved</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
