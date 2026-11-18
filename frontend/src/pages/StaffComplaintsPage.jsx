import { useEffect, useState } from "react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";
import ComplaintCard from "../components/ComplaintCard";
import StaffComplaintControls from "../components/StaffComplaintControls";
import { Alert, Button, Card, SelectField, TextField } from "../components/ui";

const EMPTY_FILTERS = { area: "", category: "", priority: "", status: "" };
const PAGE_SIZE = 10;

const HEADINGS = {
  all: {
    title: "Complaints",
    description:
      "Everything citizens have reported. Assign work to an officer and keep the status current."
  },
  mine: {
    title: "My queue",
    description: "Complaints assigned to you. Update the status as work progresses."
  },
  unassigned: {
    title: "Unassigned complaints",
    description: "Claim a complaint to add it to your queue."
  }
};

export default function StaffComplaintsPage({ scope = "all" }) {
  const { user, token } = useAuth();
  const isAdmin = user.role === "admin";
  const heading = HEADINGS[scope] ?? HEADINGS.all;

  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    categories: [],
    statuses: [],
    priorities: []
  });
  const [staff, setStaff] = useState([]);

  const [feed, setFeed] = useState({
    key: null,
    complaints: [],
    pagination: null,
    error: null
  });

  // Derived loading keeps the fetch effect free of synchronous setState calls.
  const requestKey = [
    token,
    scope,
    page,
    query.area,
    query.category,
    query.priority,
    query.status
  ].join("|");

  const loading = feed.key !== requestKey;

  useEffect(() => {
    let cancelled = false;

    apiRequest("/api/complaints/meta")
      .then((payload) => {
        if (!cancelled) setMeta(payload.data);
      })
      .catch(() => {
        // Filters fall back to the current complaint values.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    apiRequest("/api/admin/accounts", { token })
      .then((payload) => {
        if (cancelled) return;

        setStaff(
          payload.data.accounts.filter((account) => account.role === "officer")
        );
      })
      .catch(() => {
        // Assignment still works; the current officer remains selectable.
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, token]);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE)
    });

    if (scope !== "all") params.set("assigned", scope);
    if (query.area) params.set("area", query.area);
    if (query.category) params.set("category", query.category);
    if (query.priority) params.set("priority", query.priority);
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
  }, [requestKey, scope, page, query, token]);

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

  function handleUpdated(updated) {
    setFeed((current) => {
      // A claimed complaint no longer belongs in the unassigned queue.
      if (scope === "unassigned" && updated.officer) {
        return {
          ...current,
          complaints: current.complaints.filter(
            (complaint) => complaint.id !== updated.id
          ),
          pagination: current.pagination
            ? {
                ...current.pagination,
                total: Math.max(0, current.pagination.total - 1)
              }
            : current.pagination
        };
      }

      return {
        ...current,
        complaints: current.complaints.map((complaint) =>
          complaint.id === updated.id ? updated : complaint
        )
      };
    });
  }

  const total = feed.pagination?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{heading.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{heading.description}</p>
        </div>

        <p className="text-sm text-slate-500">
          {loading
            ? "Loading…"
            : `${total} complaint${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TextField
            id="staff-filter-area"
            label="Area"
            value={draft.area}
            onChange={(event) =>
              setDraft((current) => ({ ...current, area: event.target.value }))
            }
            placeholder="Any area"
          />

          <SelectField
            id="staff-filter-category"
            label="Category"
            value={draft.category}
            onChange={(event) =>
              setDraft((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="">All categories</option>
            {meta.categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="staff-filter-priority"
            label="Priority"
            value={draft.priority}
            onChange={(event) =>
              setDraft((current) => ({ ...current, priority: event.target.value }))
            }
          >
            <option value="">Any priority</option>
            {meta.priorities.map((priority) => (
              <option key={priority.slug} value={priority.slug}>
                {priority.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="staff-filter-status"
            label="Status"
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="">Any status</option>
            {meta.statuses.map((status) => (
              <option key={status.slug} value={status.slug}>
                {status.label}
              </option>
            ))}
          </SelectField>

          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">
              Apply
            </Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {feed.error && <Alert>{feed.error.message}</Alert>}

      {loading && (
        <p className="py-6 text-center text-sm text-slate-500">Loading complaints…</p>
      )}

      {!loading && !feed.error && feed.complaints.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600">
            {scope === "mine"
              ? "Nothing is assigned to you right now."
              : scope === "unassigned"
                ? "No unassigned complaints match these filters."
                : "No complaints match these filters."}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {feed.complaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            onUpdated={handleUpdated}
            actions={
              <StaffComplaintControls
                complaint={complaint}
                staff={staff}
                statuses={meta.statuses}
                onUpdated={handleUpdated}
              />
            }
          />
        ))}
      </div>

      {feed.pagination && feed.pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>

          <p className="text-sm text-slate-600">
            Page {feed.pagination.page} of {feed.pagination.pages}
          </p>

          <Button
            variant="secondary"
            onClick={() =>
              setPage((current) =>
                Math.min(feed.pagination.pages, current + 1)
              )
            }
            disabled={page >= feed.pagination.pages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
