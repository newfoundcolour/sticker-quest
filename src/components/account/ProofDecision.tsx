"use client";

import { useActionState, useState } from "react";
import { approveProofAction, rejectProofAction, type ProofActionState } from "@/app/actions/proofs";
import { FormMessage, SubmitButton } from "@/components/auth/fields";

const COMMENT_MIN = 3;
const COMMENT_MAX = 2000;

/**
 * Approve / request changes for one proof version. Each decision is final
 * for that version; the buttons disable while a decision is being saved and
 * the server refuses a second one regardless.
 */
export function ProofDecision({ proofId }: { proofId: string }) {
  const [approveState, approve] = useActionState<ProofActionState>(approveProofAction.bind(null, proofId), undefined);
  const [rejectState, reject] = useActionState<ProofActionState, FormData>(rejectProofAction.bind(null, proofId), undefined);
  const [mode, setMode] = useState<"choose" | "confirm-approve" | "reject">("choose");
  const [comment, setComment] = useState("");

  const done = approveState?.ok ? approveState : rejectState?.ok ? rejectState : undefined;
  if (done) return <FormMessage tone="success">{done.message}</FormMessage>;

  const error = (approveState && !approveState.ok && approveState.message) || (rejectState && !rejectState.ok && rejectState.message);

  return (
    <div className="flex flex-col gap-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}

      {mode === "choose" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode("confirm-approve")}
            className="flex-1 rounded-full border-2 border-night bg-trail-teal px-6 py-3.5 text-base font-black uppercase tracking-wide text-night shadow-pop-night transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5"
          >
            Approve proof
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="flex-1 rounded-full border-2 border-night bg-white px-6 py-3.5 text-base font-black uppercase tracking-wide text-night transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5"
          >
            Request changes
          </button>
        </div>
      )}

      {mode === "confirm-approve" && (
        <form action={approve} className="flex flex-col gap-3 rounded-xl border-[1.5px] border-trail-teal bg-trail-teal/10 p-4">
          <p className="text-sm text-night">
            <span className="font-black">Ready to print?</span> Once you approve, we print exactly
            this proof and it can&apos;t be changed. Double-check spelling, colours and size.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton pendingText="Approving…">Yes, approve and print</SubmitButton>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="rounded-full px-6 py-3 text-sm font-black text-night hover:bg-night/5"
            >
              Go back
            </button>
          </div>
        </form>
      )}

      {mode === "reject" && (
        <form action={reject} className="flex flex-col gap-3">
          <label htmlFor="proof-comment" className="text-sm font-black text-night">
            What should we change?
          </label>
          <textarea
            id="proof-comment"
            name="comment"
            required
            minLength={COMMENT_MIN}
            maxLength={COMMENT_MAX}
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Please make the logo a bit bigger and use the darker blue."
            className="w-full rounded-lg border border-grape bg-white px-3 py-2.5 text-base text-night outline-none placeholder:text-quiet focus:border-blaze focus-visible:ring-2 focus-visible:ring-blaze/30"
          />
          <p className="text-xs text-quiet">
            {comment.trim().length < COMMENT_MIN
              ? `At least ${COMMENT_MIN} characters, please.`
              : `${comment.length.toLocaleString("en-ZA")} / ${COMMENT_MAX.toLocaleString("en-ZA")}`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton pendingText="Sending…">Send my changes</SubmitButton>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="rounded-full px-6 py-3 text-sm font-black text-night hover:bg-night/5"
            >
              Go back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
