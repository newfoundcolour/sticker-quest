import type { Metadata } from "next";
import Link from "next/link";
import { StepCard } from "@/components/configurator/StepCard";
import { PRIMARY_BUTTON_CLASSES } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState, formatOrderDate } from "@/components/account/OrderBits";
import { requireVerifiedUser } from "@/lib/auth";
import { listCustomerConversations } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS, SUPPORT_CATEGORY_ICONS, SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";

export const metadata: Metadata = { title: "Support · Sticker Quest" };

const NEW_BUTTON = `${PRIMARY_BUTTON_CLASSES} inline-block w-auto px-6 py-3 text-sm text-center`;

export default async function SupportPage() {
  const user = await requireVerifiedUser("/account/support");
  const conversations = await listCustomerConversations(user.id);

  return (
    <>
      <AccountPageHeader
        title="Support"
        intro="Something not right? Message our team. We reply Monday to Friday, 8am to 5pm."
        action={
          <Link href="/account/support/new" className={NEW_BUTTON}>
            New message
          </Link>
        }
      />

      <StepCard icon="💬" title="Your conversations">
        {conversations.length === 0 ? (
          <EmptyState
            title="No messages yet"
            action={
              <Link href="/account/support/new" className={NEW_BUTTON}>
                Message our team
              </Link>
            }
          >
            Questions, print issues or delivery hiccups: we&apos;re here to help.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-grape/20">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/account/support/${c.id}`}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-white/60 sm:p-5"
                >
                  <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-grape/15 text-xl">
                    {SUPPORT_CATEGORY_ICONS[c.category]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className={`text-night ${c.unread > 0 ? "font-black" : "font-bold"}`}>
                        {SUPPORT_CATEGORY_LABELS[c.category]}
                      </span>
                      {c.order && <span className="text-xs text-quiet">· Order {orderNumber(c.order.id)}</span>}
                    </span>
                    <span className={`block truncate text-sm ${c.unread > 0 ? "font-bold text-night" : "text-quiet"}`}>
                      {c.lastMessage?.sender === "STAFF" ? "Sticker Quest: " : "You: "}
                      {c.lastMessage?.body ?? ""}
                    </span>
                    <span className="block text-xs text-quiet">{formatOrderDate(c.lastMessageAt)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        c.status === "OPEN" ? "bg-trail-teal/15 text-trail-teal" : "bg-ink-navy/10 text-ink-navy/60"
                      }`}
                    >
                      {CONVERSATION_STATUS_LABELS[c.status]}
                    </span>
                    {c.unread > 0 && (
                      <span className="flex items-center gap-1 text-xs font-black text-blaze">
                        <span aria-hidden className="size-2.5 rounded-full bg-blaze" />
                        <span>New reply</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StepCard>
    </>
  );
}
