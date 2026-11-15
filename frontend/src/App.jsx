import { useAuth } from "./context/AuthContext";
import { Button } from "./components/ui";
import AuthPage from "./pages/AuthPage";
import StaffAccountsPage from "./pages/StaffAccountsPage";

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

  if (user.role !== "admin") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-lg font-semibold text-slate-900">Staff provisioning only</h1>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as {user.name} ({user.role}). Only administrators can manage
            staff accounts.
          </p>

          <Button className="mt-6" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  return <StaffAccountsPage />;
}
