import type { MessageSender } from "@/generated/prisma/client";

type ThreadMessage = {
  id: string;
  sender: MessageSender;
  body: string;
  attachmentPath: string | null;
  attachmentName: string | null;
  createdAt: Date;
};

function formatWhen(date: Date): string {
  return date.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * A support thread as chat bubbles. Message bodies are plain text, rendered
 * as React text (escaped) with line breaks kept by CSS — never as HTML.
 * Attachments load through our own route, which checks access first.
 */
export function MessageThread({
  messages,
  viewer,
  attachmentHref,
  theme,
}: {
  messages: ThreadMessage[];
  /** Whose view this is: their own messages sit on the right. */
  viewer: MessageSender;
  attachmentHref: (messageId: string) => string;
  theme: "account" | "admin";
}) {
  return (
    <ol className="flex flex-col gap-4" aria-label="Messages">
      {messages.map((m) => {
        const mine = m.sender === viewer;
        const who = m.sender === "STAFF" ? "Sticker Quest team" : viewer === "CUSTOMER" ? "You" : "Customer";
        const bubble =
          theme === "account"
            ? mine
              ? "bg-grape text-white"
              : "bg-white text-ink border-[1.5px] border-grape/30"
            : mine
              ? "bg-grape text-white"
              : "bg-admin-canvas text-admin-ink border border-admin-line";
        return (
          <li key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
            <span className={`text-xs ${theme === "account" ? "text-quiet" : "text-admin-muted"}`}>
              {mine ? "You" : who} · {formatWhen(m.createdAt)}
            </span>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${bubble}`}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              {m.attachmentPath && (
                <a
                  href={attachmentHref(m.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block"
                  title={m.attachmentName ?? "Attachment"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- private image via our access-checked route */}
                  <img
                    src={attachmentHref(m.id)}
                    alt={m.attachmentName ? `Attachment: ${m.attachmentName}` : "Attached image"}
                    loading="lazy"
                    className="max-h-64 rounded-xl border border-black/10 bg-white object-contain"
                  />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
