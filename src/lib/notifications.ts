import "server-only";

/**
 * Extension point for transactional email (and later WhatsApp). Every event
 * a customer or staff member might want to hear about is raised through
 * notify(); today it only logs. To send real emails, plug a provider
 * (e.g. Resend or Postmark) into the switch below — callers don't change.
 */
export type NotificationEvent =
  | { type: "proof_ready"; orderId: string; proofId: string; customerEmail: string }
  | { type: "proof_approved"; orderId: string; proofId: string; source: "CUSTOMER" | "STAFF_ON_BEHALF" }
  | { type: "proof_rejected"; orderId: string; proofId: string }
  | { type: "support_message_from_customer"; conversationId: string }
  | { type: "support_reply_from_staff"; conversationId: string; customerEmail: string };

export async function notify(event: NotificationEvent): Promise<void> {
  try {
    // TODO(email): send the matching template for each event type.
    if (process.env.NODE_ENV !== "production") console.info("[notify]", event.type);
  } catch (error) {
    // A failed notification must never break the action that raised it.
    console.error("Notification failed:", error);
  }
}
