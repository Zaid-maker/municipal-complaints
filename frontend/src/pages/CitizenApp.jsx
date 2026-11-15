import { useEffect, useState } from "react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";
import { Button, RoleBadge } from "../components/ui";
import ReportComplaintPage from "./ReportComplaintPage";
import ComplaintsFeedPage from "./ComplaintsFeedPage";
import TrackComplaintPage from "./TrackComplaintPage";

const TABS = [
  { id: "report", label: "Report an issue" },
  { id: "nearby", label: "Nearby" },
  { id: "mine", label: "My reports" },
  { id: "track", label: "Track" }
];

export default function CitizenApp() {
  const { user, token, signOut } = useAuth();

  const [tab, setTab] = useState("report");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    apiRequest("/api/complaints/meta", { token })
      .then((payload) => {
        if (!cancelled) setCategories(payload.data.categories);
      })
      .catch(() => {
        // The report form shows its own error if submitting fails.
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Municipal Complaints
              </p>
              <h1 className="text-lg font-semibold text-slate-900">Citizen portal</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              <RoleBadge role={user.role} />

              <Button variant="secondary" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === item.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {tab === "report" && (
          <ReportComplaintPage
            categories={categories}
            onSubmitted={() => setTab("mine")}
          />
        )}

        {tab === "nearby" && (
          <ComplaintsFeedPage mode="nearby" categories={categories} />
        )}

        {tab === "mine" && (
          <ComplaintsFeedPage mode="mine" categories={categories} />
        )}

        {tab === "track" && <TrackComplaintPage />}
      </main>
    </div>
  );
}
