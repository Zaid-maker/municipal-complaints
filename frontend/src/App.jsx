import { useAuth } from "./context/useAuth";
import AuthPage from "./pages/AuthPage";
import CitizenApp from "./pages/CitizenApp";
import AdminApp from "./pages/AdminApp";
import OfficerApp from "./pages/OfficerApp";

export default function App() {
  const { status, user } = useAuth();

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
    return <AdminApp />;
  }

  if (user.role === "officer") {
    return <OfficerApp />;
  }

  return <CitizenApp />;
}
