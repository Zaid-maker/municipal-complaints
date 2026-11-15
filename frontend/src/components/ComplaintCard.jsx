import { StatusBadge } from "./ui";
import { timeAgo } from "../lib/format";

export default function ComplaintCard({ complaint }) {
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-slate-500">{complaint.reference}</span>

        <StatusBadge status={complaint.status} label={complaint.statusLabel} />

        {complaint.isMine && (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
            Mine
          </span>
        )}

        <span className="ml-auto text-xs text-slate-500">{timeAgo(complaint.createdAt)}</span>
      </div>

      <h3 className="mt-2 font-semibold text-slate-900">{complaint.title}</h3>

      <p className="mt-1 line-clamp-3 text-sm text-slate-600">{complaint.description}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{complaint.categoryLabel}</span>
        <span>
          {complaint.area}
          {complaint.address ? ` · ${complaint.address}` : ""}
        </span>
        <span>Reported by {complaint.reporter?.displayName ?? "Citizen"}</span>
        <span>{complaint.priorityLabel} priority</span>
      </div>
    </article>
  );
}
