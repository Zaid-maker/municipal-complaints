import { useCallback, useEffect, useState } from "react";

import { apiRequest, fieldError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Button,
  Card,
  RoleBadge,
  SelectField,
  TextField
} from "../components/ui";

const EMPTY_FORM = { name: "", email: "", password: "", role: "officer" };

export default function StaffAccountsPage() {
  const { user, token, signOut } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [values, setValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const payload = await apiRequest("/api/admin/accounts", { token });

      setAccounts(payload.data.accounts);
    } catch (error) {
      if (error.status === 401) {
        signOut();
        return;
      }

      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [token, signOut]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError(null);
    setSuccess("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = await apiRequest("/api/admin/accounts", {
        method: "POST",
        token,
        body: {
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role
        }
      });

      const account = payload.data.account;

      setAccounts((current) => [account, ...current]);
      setSuccess(
        `${account.role === "admin" ? "Administrator" : "Officer"} account created for ${account.name}.`
      );
      setValues({ ...EMPTY_FORM, role: values.role });
    } catch (error) {
      if (error.status === 401) {
        signOut();
        return;
      }

      const errors = {
        name: fieldError(error, "name"),
        email: fieldError(error, "email"),
        password: fieldError(error, "password"),
        role: fieldError(error, "role")
      };

      setFieldErrors(errors);
      setFormError(Object.values(errors).some(Boolean) ? null : error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Municipal Complaints
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Staff accounts</h1>
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
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="order-2 overflow-hidden lg:order-1">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Officers and administrators</h2>
              <p className="text-sm text-slate-600">
                {loading ? "Loading…" : `${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
              </p>
            </div>

            <Button variant="secondary" onClick={loadAccounts} disabled={loading}>
              Refresh
            </Button>
          </div>

          {loadError && (
            <div className="px-5 py-4">
              <Alert>{loadError.message}</Alert>
            </div>
          )}

          {!loadError && !loading && accounts.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-600">
              No staff accounts yet. Create the first officer or administrator using
              the form.
            </p>
          )}

          {accounts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Name</th>
                    <th scope="col" className="px-5 py-3 font-medium">Email</th>
                    <th scope="col" className="px-5 py-3 font-medium">Role</th>
                    <th scope="col" className="px-5 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">{account.name}</td>
                      <td className="px-5 py-3 text-slate-600">{account.email}</td>
                      <td className="px-5 py-3"><RoleBadge role={account.role} /></td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(account.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="order-1 h-fit p-5 lg:order-2">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <h2 className="font-semibold text-slate-900">Create staff account</h2>
              <p className="mt-1 text-sm text-slate-600">
                The officer or administrator can sign in immediately with this
                password.
              </p>
            </div>

            {formError && <Alert>{formError.message}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <TextField
              id="account-name"
              label="Full name"
              name="name"
              autoComplete="off"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              error={fieldErrors.name}
              required
            />

            <TextField
              id="account-email"
              label="Email"
              type="email"
              name="email"
              autoComplete="off"
              placeholder="officer@city.gov.pk"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              error={fieldErrors.email}
              required
            />

            <TextField
              id="account-password"
              label="Temporary password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              error={fieldErrors.password}
              hint="Minimum 8 characters. Share it with the staff member securely."
              required
            />

            <SelectField
              id="account-role"
              label="Role"
              name="role"
              value={values.role}
              onChange={(event) => update("role", event.target.value)}
              error={fieldErrors.role}
            >
              <option value="officer">Officer</option>
              <option value="admin">Administrator</option>
            </SelectField>

            <Button type="submit" busy={submitting} className="w-full">
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
