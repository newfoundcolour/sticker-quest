"use client";

import { useTransition } from "react";
import { setConversationStatusAction } from "@/app/actions/support";
import { AdminIcon, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/admin/ui";

export function ResolveButton({ conversationId, resolved }: { conversationId: string; resolved: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setConversationStatusAction(conversationId, !resolved))}
      className={resolved ? SECONDARY_BUTTON : PRIMARY_BUTTON}
    >
      {!resolved && !pending && <AdminIcon name="check" className="size-4" />}
      {pending ? "Saving…" : resolved ? "Reopen" : "Mark as resolved"}
    </button>
  );
}
