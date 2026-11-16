import { useState } from "react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";
import ComplaintCard from "../components/ComplaintCard";
import LocationPicker from "../components/LocationPicker";
import { Alert, Button, Card, TextField } from "../components/ui";
import { formatDate } from "../lib/format";

export default function TrackComplaintPage() {
  const { token } = useAuth();

  const [reference, setReference] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = reference.trim().toUpperCase();

    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setComplaint(null);

    try {
      const payload = await apiRequest(
        `/api/complaints/${encodeURIComponent(trimmed)}`,
        { token }
      );

      setComplaint(payload.data.complaint);
    } catch (requestError) {
      setError(
        requestError.status === 404
          ? new Error("No complaint found with that reference.")
          : requestError
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Track a complaint</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the reference you received when you submitted the issue, for example
          MUN-2026-000042.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              id="track-reference"
              label="Reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="MUN-2026-000042"
              autoComplete="off"
            />
          </div>

          <Button type="submit" busy={loading}>
            {loading ? "Searching…" : "Track"}
          </Button>
        </form>
      </Card>

      {error && <Alert>{error.message}</Alert>}

      {complaint && (
        <div className="space-y-3">
          <ComplaintCard complaint={complaint} />

          <Card className="p-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1 font-medium text-slate-900">{complaint.statusLabel}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Category</dt>
                <dd className="mt-1 font-medium text-slate-900">{complaint.categoryLabel}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Area</dt>
                <dd className="mt-1 font-medium text-slate-900">{complaint.area}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
                <dd className="mt-1 font-medium text-slate-900">{formatDate(complaint.createdAt)}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Address</dt>
                <dd className="mt-1 font-medium text-slate-900">{complaint.address || "Not provided"}</dd>
              </div>
            </dl>
          </Card>

          {complaint.location && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">Location</h3>

              <div className="mt-3">
                <LocationPicker value={complaint.location} readOnly heightClass="h-56" />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
