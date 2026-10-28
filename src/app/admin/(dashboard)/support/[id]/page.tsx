import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getConversationForAdminOr404, markReadByStaff } from "@/lib/support";
import { ORDER_STATUS_BADGE_CLASSES, ORDER_STATUS_LABELS, orderNumber } from "@/lib/orderLabels";
import { CONVERSATION_STATUS_LABELS, SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";
import { staffReplyAction } from "@/app/actions/support";
import { AutoRefresh } from "@/components/support/AutoRefresh";
import { Composer } from "@/components/support/Composer";
import { MessageThread } from "@/components/support/MessageThread";
import { ResolveButton } from "@/components/admin/ResolveButton";

export default async function AdminConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const conversation = await getConversationForAdminOr404(id);
  // Opening the thread marks the customer's messages as read.
  await markReadByStaff(conversation.id);

  const name = `${conversation.user.firstName} ${conversation.user.lastName}`.trim() || conversation.user.email;
  const resolved = conversation.status === "RESOLVED";

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <AutoRefresh />
      <Link href="/admin/support" className="text-sm text-ink-navy/60 hover:text-ink-navy">
        ← Support inbox
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-navy">{SUPPORT_CATEGORY_LABELS[conversation.category]}</h1>
          <p className="mt-1 text-sm text-ink-navy/60">
            {CONVERSATION_STATUS_LABELS[conversation.status]}
            {conversation.resolvedAt && ` · resolved ${conversation.resolvedAt.toLocaleString("en-ZA")}`}
          </p>
        </div>
        <ResolveButton conversationId={conversation.id} resolved={resolved} />
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
          <h2 className="text-sm font-semibold text-ink-navy/80">Customer</h2>
          <p className="mt-2 font-medium text-ink-navy">{name}</p>
          <a href={`mailto:${conversation.user.email}`} className="text-sm text-coral-signal underline underline-offset-2">
            {conversation.user.email}
          </a>
        </div>
        <div className="rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
          <h2 className="text-sm font-semibold text-ink-navy/80">Linked order</h2>
          {conversation.order ? (
            <div className="mt-2 flex items-center gap-3">
              <Link href={`/admin/orders/${conversation.order.id}`} className="font-mono text-sm text-coral-signal underline underline-offset-2">
                {orderNumber(conversation.order.id)}
              </Link>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_BADGE_CLASSES[conversation.order.status]}`}>
                {ORDER_STATUS_LABELS[conversation.order.status]}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-navy/50">Not about a specific order.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
        <MessageThread
          messages={conversation.messages}
          viewer="STAFF"
          theme="admin"
          attachmentHref={(messageId) => `/admin/support/attachments/${messageId}`}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-ink-navy/10 bg-white/70 p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-navy/80">Reply</h2>
        <Composer
          action={staffReplyAction.bind(null, conversation.id)}
          theme="admin"
          allowAttachment={false}
          placeholder={`Reply to ${name}…`}
        />
      </section>
    </main>
  );
}
