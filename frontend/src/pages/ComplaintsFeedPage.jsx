import { useEffect, useState } from "react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";
import ComplaintCard from "../components/ComplaintCard";
import { Alert, Button, Card, SelectField, TextField } from "../components/ui";

const EMPTY_FILTERS = { area: "", category: "", status: "" };

export default function ComplaintsFeedPage({ mode, categories }) {
  const { token } = useAuth();

  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [feed, setFeed] = useState({
    key: null,
    complaints: [],
    pagination: null,
    error: null
  });

  const isMine = mode === "mine";

  // The request key identifies what this component is currently waiting for.
  // `loading` is derived from it, so the effect never calls setState directly.
  const requestKey = [
    token,
    isMine ? "mine" : "nearby",
    page,
    query.area,
    query.category,
    query.status
  ].join("|");

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({
      page: String(page),
      limit: "10"
    });

    if (isMine) params.set("mine", "true");
    if (query.area) params.set("area", query.area);
    if (query.category) params.set("category", query.category);
    if (query.status) params.set("status", query.status);

    apiRequest(`/api/complaints?${params.toString()}`, { token })
      .then((payload) => {
        if (cancelled) return;

        setFeed({
          key: requestKey,
          complaints: payload.data.complaints,
          pagination: payload.data.pagination,
          error: null
        });
      })
      .catch((requestError) => {
        if (cancelled) return;

        setFeed({
          key: requestKey,
          complaints: [],
          pagination: null,
          error: requestError
        });
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, isMine, page, query, token]);

  const { complaints, pagination, error } = feed;
  const loading = feed.key !== requestKey;

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setQuery({ ...draft, area: draft.area.trim() });
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setQuery(EMPTY_FILTERS);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {isMine ? "My reports" : "Complaints nearby"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {isMine
            ? "Everything you have reported, newest first."
            : "What other citizens are reporting around you. Reporters are shown with initials only."}
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-4">
          <TextField
            id="filter-area"
            label="Area"
            value={draft.area}
            onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}
            placeholder="Any area"
          />

          <SelectField
            id="filter-category"
            label="Category"
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="filter-status"
            label="Status"
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">Any status</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </SelectField>

          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">Apply</Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {error && <Alert>{error.message}</Alert>}

      {loading && <p className="py-6 text-center text-sm text-slate-500">Loading complaints…</p>}

      {!loading && !error && complaints.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600">
            {isMine
              ? "You have not reported anything yet."
              : "No complaints match these filters."}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {complaints.map((complaint) => (
          <ComplaintCard key={complaint.id} complaint={complaint} />
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>

          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.pages}
          </p>

          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
            disabled={page >= pagination.pages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
