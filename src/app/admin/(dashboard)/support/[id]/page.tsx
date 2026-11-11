import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getConversationForAdminOr404, markReadByStaff } from "@/lib/support";
import { orderNumber } from "@/lib/orderLabels";
import { SUPPORT_CATEGORY_LABELS } from "@/lib/supportLabels";
import { staffReplyAction } from "@/app/actions/support";
import { AutoRefresh } from "@/components/support/AutoRefresh";
import { Composer } from "@/components/support/Composer";
import { MessageThread } from "@/components/support/MessageThread";
import { ResolveButton } from "@/components/admin/ResolveButton";
import {
  AdminCard,
  AdminPageHeader,
  Avatar,
  ConversationStatusBadge,
  LINK_CLASSES,
  OrderStatusBadge,
  formatAdminDateTime,
} from "@/components/admin/ui";

export default async function AdminConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const conversation = await getConversationForAdminOr404(id);
  // Opening the thread marks the customer's messages as read.
  await markReadByStaff(conversation.id);

  const name = `${conversation.user.firstName} ${conversation.user.lastName}`.trim() || conversation.user.email;
  const resolved = conversation.status === "RESOLVED";

  return (
    <>
      <AutoRefresh />
      <AdminPageHeader
        back={{ href: "/admin/support", label: "Support inbox" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {SUPPORT_CATEGORY_LABELS[conversation.category]}
            <ConversationStatusBadge status={conversation.status} />
          </span>
        }
        description={
          <>
            With {name}
            {conversation.resolvedAt && ` · resolved ${formatAdminDateTime(conversation.resolvedAt)}`}
          </>
        }
        actions={<ResolveButton conversationId={conversation.id} resolved={resolved} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title="Conversation">
            <div className="px-5 py-5">
              <MessageThread
                messages={conversation.messages}
                viewer="STAFF"
                theme="admin"
                attachmentHref={(messageId) => `/admin/support/attachments/${messageId}`}
              />
            </div>
          </AdminCard>

          <AdminCard title="Reply" description="The customer sees this in their account under Support.">
            <div className="px-5 py-4">
              <Composer
                action={staffReplyAction.bind(null, conversation.id)}
                theme="admin"
                allowAttachment={false}
                placeholder={`Reply to ${name}…`}
              />
            </div>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard title="Customer">
            <div className="flex items-center gap-3 px-5 py-4">
              <Avatar name={name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-admin-ink">{name}</p>
                <a href={`mailto:${conversation.user.email}`} className={`block truncate text-sm ${LINK_CLASSES}`}>
                  {conversation.user.email}
                </a>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Linked order">
            <div className="px-5 py-4">
              {conversation.order ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/admin/orders/${conversation.order.id}`} className={`font-mono text-sm ${LINK_CLASSES}`}>
                    {orderNumber(conversation.order.id)}
                  </Link>
                  <OrderStatusBadge status={conversation.order.status} />
                </div>
              ) : (
                <p className="text-sm text-admin-muted">Not about a specific order.</p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
