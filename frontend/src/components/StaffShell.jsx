import { useAuth } from "../context/useAuth";
import { Button, RoleBadge } from "../components/ui";

export default function StaffShell({ title, tabs, active, onChange, children }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Municipal Complaints
              </p>
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
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

          {tabs && (
            <nav className="mt-4 flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange(tab.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active === tab.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
