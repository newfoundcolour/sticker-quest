"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { approveOnBehalfAction, uploadProofAction, type ProofActionState } from "@/app/actions/proofs";
import { AdminIcon, PRIMARY_BUTTON, SMALL_SECONDARY_BUTTON } from "@/components/admin/ui";

const MAX_BYTES = 20 * 1024 * 1024;

function Message({ state }: { state: ProofActionState }) {
  if (!state) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`text-sm font-medium ${state.ok ? "text-trail-teal" : "text-coral-signal"}`}>
      {state.message}
    </p>
  );
}

/** Upload a new proof version. The server re-checks size and file type from the bytes. */
export function ProofUploadForm({ orderId, accept }: { orderId: string; accept: string }) {
  const [state, action, pending] = useActionState<ProofActionState, FormData>(
    uploadProofAction.bind(null, orderId),
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [tooBig, setTooBig] = useState(false);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-2 rounded-xl border border-dashed border-admin-line bg-admin-canvas/50 px-4 py-4 text-sm text-admin-muted transition-colors hover:border-grape/40">
        <span className="flex items-center gap-2 font-medium text-admin-ink">
          <AdminIcon name="upload" className="size-4 text-grape" />
          New proof
          <span className="font-normal text-admin-muted">PNG, JPG, WebP or PDF, up to 20 MB</span>
        </span>
        <input
          type="file"
          name="file"
          accept={accept}
          required
          onChange={(e) => setTooBig((e.target.files?.[0]?.size ?? 0) > MAX_BYTES)}
          className="text-sm text-admin-ink file:mr-3 file:h-8 file:cursor-pointer file:rounded-lg file:border file:border-solid file:border-admin-line file:bg-white file:px-3 file:text-xs file:font-semibold file:text-admin-ink hover:file:bg-admin-canvas"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || tooBig} className={PRIMARY_BUTTON}>
          {pending ? "Uploading…" : "Upload & send to customer"}
        </button>
        {tooBig && (
          <p role="alert" className="text-sm font-medium text-coral-signal">
            That file is over 20 MB.
          </p>
        )}
        <Message state={state} />
      </div>
    </form>
  );
}

/** Records an approval the customer gave outside the site (WhatsApp, email). */
export function ApproveOnBehalfButton({ proofId }: { proofId: string }) {
  const [state, action, pending] = useActionState<ProofActionState>(approveOnBehalfAction.bind(null, proofId), undefined);
  const [confirming, setConfirming] = useState(false);

  if (state?.ok) return <Message state={state} />;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className={SMALL_SECONDARY_BUTTON}>
          <AdminIcon name="check" className="size-3.5" />
          Approve on customer&apos;s behalf
        </button>
      ) : (
        <form action={action} className="flex flex-wrap items-center gap-2 rounded-lg bg-admin-canvas px-3 py-2">
          <span className="text-sm text-admin-ink">Customer approved elsewhere (e.g. WhatsApp)?</span>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-8 items-center rounded-lg bg-trail-teal px-3 text-xs font-semibold text-admin-ink disabled:opacity-50"
          >
            {pending ? "Saving…" : "Yes, record approval"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-2 text-xs font-medium text-admin-muted hover:text-admin-ink"
          >
            Cancel
          </button>
        </form>
      )}
      <Message state={state} />
    </div>
  );
}
