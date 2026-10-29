import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { NightAuthPage } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";
import { getSessionUser, isEmailVerified } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up · Sticker Quest" };

// Only things the account actually does today.
const PERKS = [
  "Follow every order from proof to dispatch",
  "Approve your proofs online",
  "Reorder your favourites in a few clicks",
];

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user && isEmailVerified(user)) redirect("/account");

  return (
    <NightAuthPage>
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
        {/* The form comes first on phones; the welcome panel follows it. */}
        <div className="min-w-0 flex-1 lg:order-2 lg:pb-3 lg:pt-2.5">
          <SignupForm />
        </div>

        <WelcomePanel />
      </div>
    </NightAuthPage>
  );
}

function WelcomePanel() {
  return (
    <section
      aria-label="Why make an account"
      className="flex flex-col gap-[26px] rounded-[28px] bg-plum p-7 sm:p-9 lg:order-1 lg:w-[420px] lg:shrink-0 xl:w-[472px]"
    >
      <div className="flex flex-col gap-[18px]">
        <p className="font-headline text-4xl font-bold uppercase leading-[1.05] text-sand sm:text-5xl">
          Every quest
          <br />
          needs a
          <br />
          base camp.
        </p>
        <p className="text-base leading-[1.55] text-haze">
          A free account keeps all your sticker business in one spot, so your next batch is only a
          few clicks away.
        </p>
      </div>

      <div className="flex justify-center">
        <Image
          src="/mascot/wizard-sticker.png"
          alt=""
          width={296}
          height={351}
          sizes="296px"
          className="h-auto w-[220px] drop-shadow-[0_12px_16px_rgba(0,0,0,0.25)] sm:w-[296px]"
        />
      </div>

      <div className="flex flex-col gap-3.5 border-t border-white/[0.13] pt-[22px]">
        <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-zap">What you get</p>
        <ul className="flex flex-col gap-3.5">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2.5 text-sm text-sand">
              <span aria-hidden className="text-base text-zap">
                ✦
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
