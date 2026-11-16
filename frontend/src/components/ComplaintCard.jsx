import { StatusBadge } from "./ui";
import { timeAgo } from "../lib/format";

export default function ComplaintCard({ complaint, actions }) {
  const reporterLabel =
    complaint.reporter?.name ?? complaint.reporter?.displayName ?? "Citizen";

  const mapHref = complaint.location
    ? `https://www.openstreetmap.org/?mlat=${complaint.location.lat}&mlon=${complaint.location.lng}#map=17/${complaint.location.lat}/${complaint.location.lng}`
    : null;

  const directionsHref = complaint.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${complaint.location.lat},${complaint.location.lng}`
    : null;

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
        <span>Reported by {reporterLabel}</span>
        <span>{complaint.priorityLabel} priority</span>

        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            View on map
          </a>
        )}

        {directionsHref && (
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            Directions
          </a>
        )}
      </div>

      {actions && (
        <div className="mt-4 border-t border-slate-100 pt-4">{actions}</div>
      )}
    </article>
  );
}
