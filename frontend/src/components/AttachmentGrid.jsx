import { mediaUrl } from "../lib/api";

export default function AttachmentGrid({ attachments = [], onDelete, deletingId }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-slate-500">
        {attachments.length} photo{attachments.length === 1 ? "" : "s"}
      </p>

      <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative overflow-hidden rounded-lg ring-1 ring-slate-200"
          >
            <a
              href={mediaUrl(attachment.url)}
              target="_blank"
              rel="noreferrer"
              title={attachment.name}
              className="group block"
            >
              <img
                src={mediaUrl(attachment.url)}
                alt={attachment.name}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition group-hover:scale-105"
              />
            </a>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(attachment)}
                disabled={deletingId === attachment.id}
                aria-label={`Remove ${attachment.name}`}
                className="absolute right-1 top-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {deletingId === attachment.id ? "…" : "Remove"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
