import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth";
import { isAdmin } from "@/lib/blog";
import { saveBlogPostAction } from "@/app/actions/blog";
import { BlogEditor, EMPTY_BLOG_VALUES } from "@/components/admin/BlogEditor";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";

export default async function NewBlogPostPage() {
  const staff = await requireStaff();
  const host = (await headers()).get("host") ?? "stickerquest";

  return (
    <>
      <AdminPageHeader back={{ href: "/admin/blog", label: "All posts" }} title="New post" />
      <AdminCard className="max-w-4xl">
        <div className="px-5 pt-5">
          <BlogEditor
            action={saveBlogPostAction.bind(null, null)}
            defaults={EMPTY_BLOG_VALUES}
            siteUrl={host}
            buttons={
              isAdmin(staff)
                ? [
                    { intent: "save", label: "Save draft" },
                    { intent: "publish", label: "Publish", primary: true },
                  ]
                : [
                    { intent: "save", label: "Save draft" },
                    { intent: "submit", label: "Submit for review", primary: true },
                  ]
            }
          />
        </div>
      </AdminCard>
    </>
  );
}
