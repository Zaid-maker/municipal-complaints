import { useAuth } from "./context/useAuth";
import { Button } from "./components/ui";
import AuthPage from "./pages/AuthPage";
import CitizenApp from "./pages/CitizenApp";
import AdminApp from "./pages/AdminApp";
import OfficerApp from "./pages/OfficerApp";

// `bun run build:citizen` / `bun run dev:citizen` use Vite's citizen mode.
// The Android wrapper runs mode `android`, which sets VITE_CITIZEN_ONLY.
const CITIZEN_ONLY =
  import.meta.env.MODE === "citizen" || import.meta.env.VITE_CITIZEN_ONLY === "true";

export default function App() {
  const { status, user, signOut } = useAuth();

  if (status === "restoring") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">
        Restoring your session…
      </main>
    );
  }

  if (status !== "authenticated") {
    return <AuthPage />;
  }

  if (CITIZEN_ONLY && user.role !== "citizen") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-lg font-semibold text-slate-900">
            This app is for citizens
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Officer and administrator accounts use the staff console on the web.
          </p>

          <Button className="mt-5" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  if (user.role === "admin") {
    return <AdminApp />;
  }

  if (user.role === "officer") {
    return <OfficerApp />;
  }

  return <CitizenApp />;
}
