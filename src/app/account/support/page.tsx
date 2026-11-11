import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ACCOUNT_ACTION_CLASSES,
  AccountCard,
  CARD_LIST_CLASSES,
  CARD_ROW_HOVER_CLASSES,
} from "@/components/account/AccountCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmptyState, formatOrderDate } from "@/components/account/OrderBits";
import { requireVerifiedUser } from "@/lib/auth";
import { listCustomerConversations } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS, SUPPORT_CATEGORY_ICONS, SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";

export const metadata: Metadata = { title: "Support · Sticker Quest" };

export default async function SupportPage() {
  const user = await requireVerifiedUser("/account/support");
  const conversations = await listCustomerConversations(user.id);

  return (
    <>
      <AccountPageHeader
        title="Support"
        intro="Something not right? Message our team. We reply Monday to Friday, 8am to 5pm."
        action={
          <Link href="/account/support/new" className={ACCOUNT_ACTION_CLASSES}>
            <Image src="/icons/orders/plus.svg" alt="" width={16} height={16} />
            New message
          </Link>
        }
      />

      <AccountCard title="Your conversations" description="Every message you've sent us, newest first.">
        {conversations.length === 0 ? (
          <div className="border-t border-white/[0.06]">
            <EmptyState
              dark
              title="No messages yet"
              action={
                <Link href="/account/support/new" className={ACCOUNT_ACTION_CLASSES}>
                  Message our team
                </Link>
              }
            >
              Questions, print issues or delivery hiccups: we&apos;re here to help.
            </EmptyState>
          </div>
        ) : (
          <ul className={CARD_LIST_CLASSES}>
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/account/support/${c.id}`}
                  className={`flex items-start gap-4 px-6 py-4 ${CARD_ROW_HOVER_CLASSES}`}
                >
                  <span
                    aria-hidden
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xl"
                  >
                    {SUPPORT_CATEGORY_ICONS[c.category]}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className={`text-[13px] text-sand ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>
                        {SUPPORT_CATEGORY_LABELS[c.category]}
                      </span>
                      {c.order && <span className="text-xs text-white/[0.31]">· Order {orderNumber(c.order.id)}</span>}
                    </span>
                    <span className={`truncate text-xs ${c.unread > 0 ? "font-semibold text-sand" : "text-dusk-note"}`}>
                      {c.lastMessage?.sender === "STAFF" ? "Sticker Quest: " : "You: "}
                      {c.lastMessage?.body ?? ""}
                    </span>
                    <span className="text-[11px] text-white/[0.31]">{formatOrderDate(c.lastMessageAt)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-[9px] py-[5px] text-xs font-medium ${
                        c.status === "OPEN"
                          ? "border-mint/[0.38] bg-mint/[0.13] text-mint"
                          : "border-white/[0.13] bg-white/[0.06] text-dusk-note"
                      }`}
                    >
                      {CONVERSATION_STATUS_LABELS[c.status]}
                    </span>
                    {c.unread > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-zap">
                        <span aria-hidden className="size-2 rounded-full bg-zap" />
                        <span>New reply</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AccountCard>
    </>
  );
}
