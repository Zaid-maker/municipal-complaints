import { useState } from "react";

import { apiRequest, fieldError } from "../lib/api";
import { useAuth } from "../context/useAuth";
import { Alert, Button, Card, SelectField, TextArea, TextField } from "../components/ui";

const EMPTY_FORM = {
  category: "",
  title: "",
  description: "",
  area: "",
  address: "",
  priority: "normal"
};

const FIELD_NAMES = ["category", "title", "description", "area", "address", "priority"];

export default function ReportComplaintPage({ categories, onSubmitted }) {
  const { token } = useAuth();

  const [values, setValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

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
      const payload = await apiRequest("/api/complaints", {
        method: "POST",
        token,
        body: {
          category: values.category,
          title: values.title.trim(),
          description: values.description.trim(),
          area: values.area.trim(),
          address: values.address.trim() || undefined,
          priority: values.priority
        }
      });

      setCreated(payload.data.complaint);
      setValues(EMPTY_FORM);
    } catch (requestError) {
      const errors = Object.fromEntries(
        FIELD_NAMES.map((name) => [name, fieldError(requestError, name)])
      );

      setFieldErrors(errors);
      setError(Object.values(errors).some(Boolean) ? null : requestError);
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Complaint submitted</p>

        <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
          {created.reference}
        </p>

        <p className="mt-3 text-sm text-slate-600">
          Keep this reference to track progress. Municipal staff can now see your
          report.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onSubmitted}>View my reports</Button>
          <Button variant="secondary" onClick={() => setCreated(null)}>
            Report another issue
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Report an issue</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tell us what is wrong and where. Your name is shown to other citizens
            only as an initial.
          </p>
        </div>

        {error && <Alert>{error.message}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="complaint-category"
            label="Category"
            value={values.category}
            onChange={(event) => update("category", event.target.value)}
            error={fieldErrors.category}
            required
          >
            <option value="">Choose a category…</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="complaint-priority"
            label="How urgent is it?"
            value={values.priority}
            onChange={(event) => update("priority", event.target.value)}
            error={fieldErrors.priority}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </SelectField>
        </div>

        <TextField
          id="complaint-title"
          label="Title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Large pothole on Main Boulevard"
          error={fieldErrors.title}
          maxLength={120}
          required
        />

        <TextArea
          id="complaint-description"
          label="What is happening?"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Describe the problem, how long it has been there and anything that helps staff find it."
          error={fieldErrors.description}
          hint="Between 20 and 2000 characters."
          maxLength={2000}
          rows={6}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="complaint-area"
            label="Area"
            value={values.area}
            onChange={(event) => update("area", event.target.value)}
            placeholder="Gulberg"
            error={fieldErrors.area}
            hint="Neighbourhood or town. Used for nearby complaints."
            maxLength={80}
            required
          />

          <TextField
            id="complaint-address"
            label="Landmark / street (optional)"
            value={values.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Near Liberty Market"
            error={fieldErrors.address}
            maxLength={200}
          />
        </div>

        <Button type="submit" busy={submitting} className="w-full">
          {submitting ? "Submitting…" : "Submit complaint"}
        </Button>
      </form>
    </Card>
  );
}
