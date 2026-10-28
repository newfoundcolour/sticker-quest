"use client";

import { useActionState, useState } from "react";
import { startConversationAction } from "@/app/actions/support";
import { FormMessage, SubmitButton } from "@/components/auth/fields";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  MESSAGE_MAX_LENGTH,
  SUPPORT_CATEGORIES,
  SUPPORT_CATEGORY_ICONS,
  SUPPORT_CATEGORY_LABELS,
} from "@/lib/supportLabels";

export type OrderOption = { id: string; label: string };

export function NewConversationForm({ orders, defaultOrderId }: { orders: OrderOption[]; defaultOrderId?: string }) {
  const [state, action] = useActionState(startConversationAction, undefined);
  const failed = state && !state.ok ? state : undefined;
  const [body, setBody] = useState("");
  const [fileError, setFileError] = useState<string>();

  // After a failed send, put back what was typed.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (failed?.values?.body !== undefined) setBody(failed.values.body);
  }

  const chosenCategory = failed?.values?.category;
  const chosenOrder = failed?.values?.orderId ?? defaultOrderId ?? "";

  return (
    <form action={action} className="flex flex-col gap-6">
      {failed && <FormMessage tone="error">{failed.error}</FormMessage>}

      <fieldset>
        <legend className="mb-2 text-sm font-black text-night">What&apos;s it about?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {SUPPORT_CATEGORIES.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={c}
                required
                defaultChecked={chosenCategory === c}
                className="peer sr-only"
              />
              <span className="flex h-full items-center gap-2 rounded-xl border-[1.5px] border-grape/40 bg-white px-3 py-2.5 text-sm font-bold text-night transition-colors peer-checked:border-blaze peer-checked:bg-blaze/10 peer-focus-visible:ring-2 peer-focus-visible:ring-blaze/40 hover:border-grape">
                <span aria-hidden>{SUPPORT_CATEGORY_ICONS[c]}</span>
                {SUPPORT_CATEGORY_LABELS[c]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="support-order" className="text-sm font-black text-night">
          Which order? (optional)
        </label>
        <select
          id="support-order"
          name="orderId"
          defaultValue={chosenOrder}
          className="w-full rounded-lg border border-grape bg-white px-3 py-2.5 text-base font-bold text-night outline-none focus:border-blaze sm:max-w-sm"
        >
          <option value="">Not about a specific order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="support-new-body" className="text-sm font-black text-night">
          Your message
        </label>
        <textarea
          id="support-new-body"
          name="body"
          required
          rows={6}
          maxLength={MESSAGE_MAX_LENGTH}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell us what happened. The more detail, the faster we can sort it out."
          className="w-full rounded-lg border border-grape bg-white px-3 py-2.5 text-base text-night outline-none placeholder:text-quiet focus:border-blaze focus-visible:ring-2 focus-visible:ring-blaze/30"
        />
        <span className="text-xs text-quiet">
          {body.length.toLocaleString("en-ZA")} / {MESSAGE_MAX_LENGTH.toLocaleString("en-ZA")}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="support-attachment" className="text-sm font-black text-night">
          Add a photo (optional)
        </label>
        <input
          id="support-attachment"
          type="file"
          name="attachment"
          accept={ATTACHMENT_ACCEPT}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileError(file && file.size > ATTACHMENT_MAX_BYTES ? "That image is over 5 MB." : undefined);
          }}
          className="text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-grape/15 file:px-4 file:py-1.5 file:font-bold file:text-night"
        />
        <span className="text-xs text-quiet">One JPG, PNG or WebP image, up to 5 MB. Great for showing us a print issue.</span>
        {fileError && <span className="text-sm font-bold text-blaze">{fileError}</span>}
      </div>

      <div className="sm:max-w-[260px]">
        <SubmitButton pendingText="Sending…">Send message</SubmitButton>
      </div>
    </form>
  );
}
