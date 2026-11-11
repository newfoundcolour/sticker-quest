import { requireStaff } from "@/lib/auth";
import { createDiscountAction } from "@/app/actions/discounts";
import { DiscountForm, EMPTY_DISCOUNT_VALUES } from "@/components/admin/DiscountForm";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";

export default async function NewDiscountPage() {
  await requireStaff();

  return (
    <>
      <AdminPageHeader back={{ href: "/admin/discounts", label: "All discounts" }} title="New discount code" />
      <AdminCard className="max-w-3xl">
        <div className="px-5 py-5">
          <DiscountForm action={createDiscountAction} defaults={EMPTY_DISCOUNT_VALUES} submitLabel="Create code" />
        </div>
      </AdminCard>
    </>
  );
}
