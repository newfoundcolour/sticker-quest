import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getSupportCountsForStaff } from "@/lib/support";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Staff back office: a night sidebar beside a light workspace. The shop's own
 * header and footer are left out on /admin (see HideOnAdmin in the root layout).
 * Pages and actions still check requireStaff() themselves.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const [support, needsProof, blogToReview] = await Promise.all([
    getSupportCountsForStaff(),
    prisma.order.count({ where: { status: "AWAITING_PROOF" } }),
    // Only admins publish, so only they get the review count.
    staff.role === "ADMIN" ? prisma.blogPost.count({ where: { status: "SUBMITTED" } }) : 0,
  ]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-admin-canvas text-admin-ink lg:flex-row">
      <AdminSidebar
        staffName={[staff.firstName, staff.lastName].filter(Boolean).join(" ")}
        staffEmail={staff.email}
        needsProof={needsProof}
        unreadSupport={support.unreadConversations}
        blogToReview={blogToReview}
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
