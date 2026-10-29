import { redirect } from "next/navigation";

/**
 * Checkout starts from the cart's Checkout button (src/components/cart/CheckoutPanel.tsx),
 * which collects any missing delivery details and places the order.
 * TODO(payfast): this route becomes the hand-off to PayFast.
 */
export default function CheckoutPage() {
  redirect("/cart");
}
