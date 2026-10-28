import type { Metadata } from "next";
import { StepCard } from "@/components/configurator/StepCard";
import { FormMessage } from "@/components/auth/fields";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { EmailForm, PasswordForm, ProfileForm } from "@/components/account/SettingsForms";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings · Sticker Quest" };

const EMAIL_NOTICES: Record<string, { tone: "success" | "info"; text: string }> = {
  updated: { tone: "success", text: "All done. Your new email is the one you log in with now." },
  half: { tone: "info", text: "One down! Now click the link we sent to your other inbox to finish the switch." },
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const user = await requireVerifiedUser("/account/settings");
  const { email: emailNotice } = await searchParams;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, company: true, instagramHandle: true },
  });
  const notice = emailNotice ? EMAIL_NOTICES[emailNotice] : undefined;

  return (
    <>
      <AccountPageHeader title="Settings" intro="Your details, login email and password." />
      <div className="flex max-w-[720px] flex-col gap-6">
        {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}

        <StepCard icon="🙂" title="Profile">
          <div className="p-6 sm:p-7">
            <ProfileForm
              defaults={{
                firstName: profile?.firstName ?? "",
                lastName: profile?.lastName ?? "",
                company: profile?.company ?? "",
                instagramHandle: profile?.instagramHandle ?? "",
              }}
            />
          </div>
        </StepCard>

        <StepCard icon="✉️" title="Email">
          <div className="p-6 sm:p-7">
            <EmailForm currentEmail={user.email ?? ""} pendingEmail={user.new_email} />
          </div>
        </StepCard>

        <StepCard icon="🔒" title="Account security">
          <div className="p-6 sm:p-7">
            <PasswordForm />
          </div>
        </StepCard>
      </div>
    </>
  );
}
