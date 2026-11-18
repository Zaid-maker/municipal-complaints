import { useEffect, useMemo, useState } from "react";

import { apiUpload } from "../lib/api";
import { useAuth } from "../context/useAuth";
import { Alert, Button } from "./ui";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ComplaintPhotoUpload({ complaint, onUpdated }) {
  const { token } = useAuth();

  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  function addFiles(selected) {
    setSaved(false);

    if (selected.length === 0) return;

    const next = [...files];
    let problem = null;

    for (const file of selected) {
      if (next.length >= MAX_PHOTOS) {
        problem = `Attach at most ${MAX_PHOTOS} photos at a time`;
        break;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        problem = "Only JPEG, PNG or WebP photos are allowed";
        continue;
      }

      if (file.size > MAX_BYTES) {
        problem = `${file.name} is larger than 5 MB`;
        continue;
      }

      next.push(file);
    }

    setFiles(next);
    setError(problem);
  }

  function handleChange(event) {
    addFiles([...(event.target.files ?? [])]);
    event.target.value = "";
  }

  function removeFile(index) {
    setSaved(false);
    setFiles((current) => current.filter((_, position) => position !== index));
  }

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setSaved(false);

    const form = new FormData();
    files.forEach((file) => form.append("photos", file));

    try {
      const payload = await apiUpload(
        `/api/complaints/${encodeURIComponent(complaint.reference)}/attachments`,
        { token, body: form }
      );

      setFiles([]);
      setSaved(true);
      onUpdated(payload.data.complaint);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Photos</p>
          <p className="text-xs text-slate-500">
            JPEG, PNG or WebP · up to 5 at a time, 5 MB each.
          </p>
        </div>

        <label className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
          Choose photos
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              className="relative overflow-hidden rounded-lg ring-1 ring-slate-200"
            >
              <img
                src={preview.url}
                alt={preview.file.name}
                className="aspect-[4/3] w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${preview.file.name}`}
                className="absolute right-1 top-1 rounded-full bg-slate-900/80 px-1.5 text-xs font-semibold leading-5 text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          busy={uploading}
          disabled={files.length === 0}
          onClick={handleUpload}
        >
          {files.length > 1 ? `Upload ${files.length} photos` : "Upload photo"}
        </Button>

        {saved && (
          <span className="text-xs font-medium text-emerald-700">
            Photos added
          </span>
        )}
      </div>
    </div>
  );
}
