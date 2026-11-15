import { useAuth } from "./context/useAuth";
import { Button } from "./components/ui";
import AuthPage from "./pages/AuthPage";
import CitizenApp from "./pages/CitizenApp";
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

  if (user.role === "admin") {
    return <StaffAccountsPage />;
  }

  if (user.role === "officer") {
    return <OfficerNotice user={user} onSignOut={signOut} />;
  }

  return <CitizenApp />;
}

function OfficerNotice({ user, onSignOut }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Officer tools are next</h1>

        <p className="mt-2 text-sm text-slate-600">
          Signed in as {user.name}. The officer queue, assignment and status
          workflow are the next piece of the build — for now your account is ready.
        </p>

        <Button className="mt-6" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
