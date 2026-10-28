"use client";

import { useTransition } from "react";
import { setConversationStatusAction } from "@/app/actions/support";

export function ResolveButton({ conversationId, resolved }: { conversationId: string; resolved: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setConversationStatusAction(conversationId, !resolved))}
      className={
        resolved
          ? "rounded-xl border border-ink-navy/15 px-4 py-2 text-sm font-medium text-ink-navy hover:bg-ink-navy/5 disabled:opacity-50"
          : "rounded-xl bg-trail-teal px-4 py-2 text-sm font-medium text-ink-navy hover:bg-trail-teal/90 disabled:opacity-50"
      }
    >
      {pending ? "Saving…" : resolved ? "Reopen" : "Mark as resolved"}
    </button>
  );
}
