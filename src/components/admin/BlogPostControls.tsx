"use client";

import { useState, useTransition } from "react";
import {
  deleteBlogPostAction,
  returnBlogPostAction,
  unpublishBlogPostAction,
  withdrawBlogPostAction,
} from "@/app/actions/blog";
import { AdminIcon, INPUT_CLASSES, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/admin/ui";

/**
 * Review and lifecycle buttons for one post. Which ones show is worked out on
 * the server; each action re-checks the person's role and the post's status.
 */
export function BlogPostControls({
  postId,
  canWithdraw,
  canReturn,
  canUnpublish,
  canDelete,
}: {
  postId: string;
  canWithdraw: boolean;
  canReturn: boolean;
  canUnpublish: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (fn: () => Promise<{ ok: false; message: string } | void>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await fn();
      if (result && !result.ok) setError(result.message);
      else {
        setReturning(false);
        setNote("");
      }
    });

  if (!canWithdraw && !canReturn && !canUnpublish && !canDelete) return null;

  return (
    <div className="flex flex-col gap-3">
      {canReturn &&
        (returning ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="review-note" className="text-xs font-semibold text-admin-muted">
              What should the writer change?
            </label>
            <textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={1000}
              className={`${INPUT_CLASSES} h-auto py-2`}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending} onClick={() => run(() => returnBlogPostAction(postId, note))} className={PRIMARY_BUTTON}>
                {pending ? "Sending…" : "Send back to writer"}
              </button>
              <button type="button" onClick={() => setReturning(false)} className={SECONDARY_BUTTON}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setReturning(true)} className={SECONDARY_BUTTON}>
            Send back with notes
          </button>
        ))}

      {canWithdraw && (
        <button type="button" disabled={pending} onClick={() => run(() => withdrawBlogPostAction(postId))} className={SECONDARY_BUTTON}>
          Withdraw to keep editing
        </button>
      )}

      {canUnpublish && (
        <button type="button" disabled={pending} onClick={() => run(() => unpublishBlogPostAction(postId))} className={SECONDARY_BUTTON}>
          Unpublish
        </button>
      )}

      {canDelete &&
        (confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-coral-signal/10 px-3 py-2 text-sm text-admin-ink">
            Delete this post for good?
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteBlogPostAction(postId))}
              className="h-8 rounded-lg bg-coral-signal px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="px-1 text-xs font-medium text-admin-muted">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className={`${SECONDARY_BUTTON} text-coral-signal`}>
            <AdminIcon name="trash" className="size-4" />
            Delete post
          </button>
        ))}

      {error && (
        <p role="alert" className="text-sm font-medium text-coral-signal">
          {error}
        </p>
      )}
    </div>
  );
}
