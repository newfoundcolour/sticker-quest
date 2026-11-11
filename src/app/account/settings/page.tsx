import type { Metadata } from "next";
import { DarkFields, FormMessage } from "@/components/auth/fields";
import { AccountCard } from "@/components/account/AccountCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AddressForm, EmailForm, PasswordForm, ProfileForm } from "@/components/account/SettingsForms";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { savedDeliveryValues } from "@/lib/deliveryDefaults";

export const metadata: Metadata = { title: "Settings · Sticker Quest" };

const EMAIL_NOTICES: Record<string, { tone: "success" | "info"; text: string }> = {
  updated: { tone: "success", text: "All done. Your new email is the one you log in with now." },
  half: { tone: "info", text: "One down! Now click the link we sent to your other inbox to finish the switch." },
};

/** Card body padding, below the title row. */
const BODY = "border-t border-white/[0.06] px-6 pb-6 pt-5";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const user = await requireVerifiedUser("/account/settings");
  const { email: emailNotice } = await searchParams;

  const [profile, delivery] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, company: true, phone: true, instagramHandle: true },
    }),
    // Saved address, or the last order's if none is saved yet.
    savedDeliveryValues(user.id),
  ]);
  const notice = emailNotice ? EMAIL_NOTICES[emailNotice] : undefined;

  return (
    <>
      <AccountPageHeader title="Settings" intro="Your details, delivery address, login email and password." />
      <DarkFields>
        <div className="flex max-w-[720px] flex-col gap-6">
          {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}

          <AccountCard title="Profile" description="Who we're making stickers for.">
            <div className={BODY}>
              <ProfileForm
                defaults={{
                  firstName: profile?.firstName ?? "",
                  lastName: profile?.lastName ?? "",
                  company: profile?.company ?? "",
                  phone: profile?.phone ?? "",
                  instagramHandle: profile?.instagramHandle ?? "",
                }}
              />
            </div>
          </AccountCard>

          <AccountCard title="Delivery address" description="Where your orders get shipped.">
            <div className={BODY}>
              <AddressForm
                defaults={{
                  addressLine1: delivery.addressLine1,
                  addressLine2: delivery.addressLine2,
                  city: delivery.city,
                  province: delivery.province,
                  postalCode: delivery.postalCode,
                }}
              />
            </div>
          </AccountCard>

          <AccountCard title="Email" description="The address you log in with.">
            <div className={BODY}>
              <EmailForm currentEmail={user.email ?? ""} pendingEmail={user.new_email} />
            </div>
          </AccountCard>

          <AccountCard title="Account security" description="Change your password.">
            <div className={BODY}>
              <PasswordForm />
            </div>
          </AccountCard>
        </div>
      </DarkFields>
    </>
  );
}
