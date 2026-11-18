import { useState } from "react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../context/useAuth";
import AttachmentGrid from "./AttachmentGrid";
import { Alert } from "./ui";

export default function ComplaintAttachments({ complaint, onUpdated }) {
  const { user, token } = useAuth();

  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const canManage =
    Boolean(onUpdated) &&
    (user.role === "admin" || complaint.officer?.id === user.id);

  const attachments = complaint.attachments ?? [];

  if (attachments.length === 0 && !error) return null;

  async function handleDelete(attachment) {
    if (!window.confirm(`Remove the photo "${attachment.name}"?`)) return;

    setDeletingId(attachment.id);
    setError(null);

    try {
      const payload = await apiRequest(
        `/api/complaints/${encodeURIComponent(complaint.reference)}/attachments/${attachment.id}`,
        { method: "DELETE", token }
      );

      onUpdated(payload.data.complaint);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <AttachmentGrid
        attachments={attachments}
        onDelete={canManage ? handleDelete : undefined}
        deletingId={deletingId}
      />

      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
