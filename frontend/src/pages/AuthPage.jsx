import { useEffect, useState } from "react";

import { apiRequest, fieldError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, TextField } from "../components/ui";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [setupAvailable, setSetupAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiRequest("/api/auth/bootstrap-status")
      .then((payload) => {
        if (!cancelled) setSetupAvailable(Boolean(payload.data?.available));
      })
      .catch(() => {
        // A missing backend is reported by the sign-in form itself.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Municipal Complaints
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Staff console</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to manage municipal staff accounts.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {mode === "login" ? (
            <LoginForm
              setupAvailable={setupAvailable}
              onSetup={() => setMode("setup")}
            />
          ) : (
            <SetupForm onCancel={() => setMode("login")} />
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          Early alpha — expect rough edges.
        </p>
      </div>
    </main>
  );
}

function LoginForm({ setupAvailable, onSetup }) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-600">
          Officers and administrators use this console.
        </p>
      </div>

      {error && <Alert>{error.message}</Alert>}

      <TextField
        id="email"
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@city.gov.pk"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <TextField
        id="password"
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <Button type="submit" busy={submitting} className="w-full">
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      {setupAvailable && (
        <p className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          First time here?{" "}
          <button
            type="button"
            onClick={onSetup}
            className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
          >
            Create the first administrator
          </button>
        </p>
      )}
    </form>
  );
}

function SetupForm({ onCancel }) {
  const { bootstrap } = useAuth();

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    bootstrapKey: ""
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await bootstrap({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        bootstrapKey: values.bootstrapKey
      });
    } catch (requestError) {
      setError(requestError);
      setFieldErrors({
        name: fieldError(requestError, "name"),
        email: fieldError(requestError, "email"),
        password: fieldError(requestError, "password"),
        bootstrapKey: fieldError(requestError, "bootstrapKey")
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Initial setup</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create the first administrator using the bootstrap key from the server
          environment.
        </p>
      </div>

      {error && <Alert>{error.message}</Alert>}

      <TextField
        id="setup-name"
        label="Full name"
        name="name"
        autoComplete="name"
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
        error={fieldErrors.name}
        required
      />

      <TextField
        id="setup-email"
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={values.email}
        onChange={(event) => update("email", event.target.value)}
        error={fieldErrors.email}
        required
      />

      <TextField
        id="setup-password"
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => update("password", event.target.value)}
        error={fieldErrors.password}
        hint="At least 8 characters."
        required
      />

      <TextField
        id="setup-key"
        label="Bootstrap key"
        type="password"
        name="bootstrapKey"
        autoComplete="off"
        value={values.bootstrapKey}
        onChange={(event) => update("bootstrapKey", event.target.value)}
        error={fieldErrors.bootstrapKey}
        hint="Find this in ADMIN_BOOTSTRAP_KEY on the server."
        required
      />

      <div className="flex gap-3">
        <Button type="submit" busy={submitting} className="flex-1">
          {submitting ? "Creating…" : "Create administrator"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
