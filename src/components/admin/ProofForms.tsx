"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { approveOnBehalfAction, uploadProofAction, type ProofActionState } from "@/app/actions/proofs";

const MAX_BYTES = 20 * 1024 * 1024;

function Message({ state }: { state: ProofActionState }) {
  if (!state) return null;
  return <p className={`text-sm ${state.ok ? "text-trail-teal" : "text-coral-signal"}`}>{state.message}</p>;
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
    <form ref={formRef} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5 text-sm text-ink-navy/70">
        New proof (PNG, JPG, WebP or PDF, max 20 MB)
        <input
          type="file"
          name="file"
          accept={accept}
          required
          onChange={(e) => setTooBig((e.target.files?.[0]?.size ?? 0) > MAX_BYTES)}
          className="rounded-lg border border-ink-navy/15 bg-white px-3 py-2 text-sm text-ink-navy file:mr-3 file:rounded-md file:border-0 file:bg-ink-navy/5 file:px-3 file:py-1 file:text-sm"
        />
      </label>
      <div className="flex flex-col items-start gap-2">
        <button
          type="submit"
          disabled={pending || tooBig}
          className="rounded-xl bg-coral-signal px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-coral-signal/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Uploading…" : "Upload & send to customer"}
        </button>
        {tooBig && <p className="text-sm text-coral-signal">That file is over 20 MB.</p>}
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
    <div className="flex flex-col items-start gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-ink-navy/15 px-3 py-1.5 text-sm font-medium text-ink-navy hover:bg-ink-navy/5"
        >
          Approve on customer&apos;s behalf
        </button>
      ) : (
        <form action={action} className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-navy/70">Customer approved elsewhere (e.g. WhatsApp)?</span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-trail-teal px-3 py-1.5 text-sm font-medium text-ink-navy disabled:opacity-50"
          >
            {pending ? "Saving…" : "Yes, record approval"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="px-2 text-sm text-ink-navy/60 hover:text-ink-navy">
            Cancel
          </button>
        </form>
      )}
      <Message state={state} />
    </div>
  );
}
