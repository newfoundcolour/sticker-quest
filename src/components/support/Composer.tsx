"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { SupportFormState } from "@/app/actions/support";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES, MESSAGE_MAX_LENGTH } from "@/lib/supportLabels";

/**
 * Reply box for a support thread (customer or staff). Clears after a
 * successful send; the submit button is disabled while sending.
 */
export function Composer({
  action,
  theme,
  allowAttachment,
  placeholder,
  submitLabel = "Send",
}: {
  action: (prev: SupportFormState, formData: FormData) => Promise<SupportFormState>;
  theme: "account" | "admin";
  allowAttachment: boolean;
  placeholder: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [body, setBody] = useState("");
  const [fileError, setFileError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a successful send (and keep it after a failed one).
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) setBody("");
    else if (state && !state.ok && state.values?.body !== undefined) setBody(state.values.body);
  }
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const account = theme === "account";
  const tooLong = body.length > MESSAGE_MAX_LENGTH;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <label htmlFor="support-body" className="sr-only">
        Message
      </label>
      <textarea
        id="support-body"
        name="body"
        required
        rows={4}
        maxLength={MESSAGE_MAX_LENGTH}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className={
          account
            ? "w-full rounded-lg border border-grape bg-white px-3 py-2.5 text-base text-night outline-none placeholder:text-quiet focus:border-blaze focus-visible:ring-2 focus-visible:ring-blaze/30"
            : "w-full rounded-lg border border-ink-navy/15 bg-white px-3 py-2 text-sm text-ink-navy outline-none focus:border-coral-signal"
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          {allowAttachment && (
            <label className={`text-xs ${account ? "text-quiet" : "text-ink-navy/60"}`}>
              <span className="mr-2 font-bold">Add one image (optional, JPG/PNG/WebP, max 5 MB)</span>
              <input
                type="file"
                name="attachment"
                accept={ATTACHMENT_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFileError(file && file.size > ATTACHMENT_MAX_BYTES ? "That image is over 5 MB." : undefined);
                }}
                className="mt-1 block text-xs file:mr-2 file:rounded-full file:border-0 file:bg-grape/15 file:px-3 file:py-1 file:font-bold"
              />
            </label>
          )}
          <span className={`text-xs ${tooLong ? "font-bold text-blaze" : account ? "text-quiet" : "text-ink-navy/50"}`}>
            {body.length.toLocaleString("en-ZA")} / {MESSAGE_MAX_LENGTH.toLocaleString("en-ZA")}
          </span>
        </div>
        <button
          type="submit"
          disabled={pending || !body.trim() || tooLong || !!fileError}
          className={
            account
              ? "rounded-full border-2 border-night bg-blaze px-7 py-3 text-sm font-black uppercase tracking-wide text-white shadow-pop-blaze transition-[translate] duration-150 motion-safe:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              : "rounded-xl bg-coral-signal px-5 py-2.5 text-sm font-medium text-paper hover:bg-coral-signal/90 disabled:cursor-not-allowed disabled:opacity-40"
          }
        >
          {pending ? "Sending…" : submitLabel}
        </button>
      </div>
      {fileError && <p className="text-sm font-bold text-blaze">{fileError}</p>}
      {state && !state.ok && (
        <p role="alert" className={`text-sm font-bold ${account ? "text-blaze" : "text-coral-signal"}`}>
          {state.error}
        </p>
      )}
    </form>
  );
}
