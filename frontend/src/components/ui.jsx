const inputClasses =
  "mt-1.5 w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900";

export function Card({ className = "", children }) {
  return (
    <section className={`rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {children}
    </section>
  );
}

export function Button({ variant = "primary", busy = false, className = "", children, ...props }) {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
  };

  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {busy && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

export function TextField({ id, label, error, hint, ...props }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClasses}
      />

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({ id, label, error, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`${inputClasses} cursor-pointer`}
      >
        {children}
      </select>

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export function Alert({ variant = "error", children }) {
  const variants = {
    error: "bg-red-50 text-red-700 ring-red-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200"
  };

  return (
    <p role="status" className={`rounded-lg px-3 py-2 text-sm ring-1 ${variants[variant]}`}>
      {children}
    </p>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    admin: "bg-slate-900 text-white",
    officer: "bg-sky-100 text-sky-800",
    citizen: "bg-slate-100 text-slate-700"
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[role] ?? styles.citizen}`}>
      {role}
    </span>
  );
}
