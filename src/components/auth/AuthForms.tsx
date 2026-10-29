"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import {
  forgotPasswordAction,
  loginAction,
  resendConfirmationAction,
  resetPasswordAction,
  signupAction,
} from "@/app/actions/auth";
import type { AuthFormState } from "@/lib/authForms";
import { ZAP_BUTTON_CLASSES } from "@/components/buttonStyles";
import { INSTAGRAM_HELPER } from "@/components/account/SettingsForms";
import { PASSWORD_MIN_LENGTH } from "@/lib/passwordPolicy";
import { DarkFields, FormMessage, PasswordField, SubmitButton, TextField } from "./fields";

function failure(state: AuthFormState) {
  return state && !state.ok ? state : undefined;
}

// ─── Log in ────────────────────────────────────────────────────────────────

/** Log in, on the night page. */
export function LoginForm({ next, initialMessage }: { next?: string; initialMessage?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const failed = failure(state);

  return (
    <DarkFields>
      <div className="flex flex-col gap-8">
        <AuthHeading eyebrow="Your quest continues" title="Welcome back.">
          Log in to your account. Your next sticker adventure is waiting.
        </AuthHeading>

        <form action={action} className="flex flex-col gap-7" noValidate>
          <div className="flex flex-col gap-5">
            {failed?.message ? (
              <FormMessage tone="error">{failed.message}</FormMessage>
            ) : (
              initialMessage && <FormMessage tone="info">{initialMessage}</FormMessage>
            )}
            {next && <input type="hidden" name="next" value={next} />}
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              defaultValue={failed?.values?.email}
              error={failed?.fieldErrors?.email}
            />
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={failed?.fieldErrors?.password}
            />
            <Link
              href="/forgot-password"
              className={`self-end text-sm ${DARK_BOLD_LINK_CLASSES}`}
            >
              Forgot password?
            </Link>
          </div>

          <SubmitButton pendingText="Logging in…">
            Log in <span aria-hidden className="text-xl font-bold">→</span>
          </SubmitButton>

          <p className="text-center text-sm leading-normal text-haze">
            New to Sticker Quest?{" "}
            <Link href="/signup" className={DARK_BOLD_LINK_CLASSES}>
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </DarkFields>
  );
}

// ─── Sign up ───────────────────────────────────────────────────────────────

const DARK_LINK_CLASSES = "font-semibold text-zap underline underline-offset-2 hover:text-white";
const DARK_BOLD_LINK_CLASSES = "font-bold text-zap underline underline-offset-2 hover:text-white";

/** Eyebrow, big headline and intro above the log in and sign up forms. */
function AuthHeading({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  /** Optional sticker to the right of the copy. */
  aside?: ReactNode;
}) {
  const copy = (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-zap">{eyebrow}</p>
      <h1 className="font-headline text-4xl font-bold uppercase leading-[1.05] text-sand sm:text-5xl">{title}</h1>
      <p className="text-[15px] leading-normal text-haze">{children}</p>
    </div>
  );
  if (!aside) return copy;
  return (
    <div className="flex items-center gap-6">
      {copy}
      {aside}
    </div>
  );
}


/** Sign up, on the night page. Optional details go to the Profile with the names. */
export function SignupForm() {
  const [state, action] = useActionState(signupAction, undefined);
  const failed = failure(state);
  const value = (key: string) => failed?.values?.[key];

  if (state?.ok) return <CheckEmailPanel email={state.email} />;

  return (
    <DarkFields>
      <div className="flex flex-col gap-[26px]">
        <AuthHeading eyebrow="Join the quest" title="Create your account.">
          It only takes a minute. Anything marked optional can wait for another day.
        </AuthHeading>

        <form action={action} className="flex flex-col gap-[26px]" noValidate>
          {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}

          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="First name"
                name="firstName"
                autoComplete="given-name"
                placeholder="Your first name"
                required
                maxLength={50}
                defaultValue={value("firstName")}
                error={failed?.fieldErrors?.firstName}
              />
              <TextField
                label="Surname"
                name="lastName"
                autoComplete="family-name"
                placeholder="Your surname"
                required
                maxLength={50}
                defaultValue={value("lastName")}
                error={failed?.fieldErrors?.lastName}
              />
            </div>
            <TextField
              label="Business name"
              optional
              name="company"
              autoComplete="organization"
              placeholder="Your business or brand"
              maxLength={100}
              defaultValue={value("company")}
              error={failed?.fieldErrors?.company}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                defaultValue={value("email")}
                error={failed?.fieldErrors?.email}
              />
              <TextField
                label="Phone"
                optional
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="082 123 4567"
                maxLength={20}
                defaultValue={value("phone")}
                error={failed?.fieldErrors?.phone}
              />
            </div>
            <TextField
              label="Instagram handle"
              optional
              name="instagramHandle"
              placeholder="@yourbrand"
              maxLength={31}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              hint={`${INSTAGRAM_HELPER}.`}
              defaultValue={value("instagramHandle")}
              error={failed?.fieldErrors?.instagramHandle}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-white/[0.13] pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <PasswordField
                label="Password"
                name="password"
                autoComplete="new-password"
                placeholder="Make it a good one"
                error={failed?.fieldErrors?.password}
              />
              <PasswordField
                label="Confirm password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Type it once more"
                error={failed?.fieldErrors?.confirmPassword}
              />
            </div>
            <p className="flex items-center gap-2 text-[13px] leading-normal text-haze">
              <Image src="/icons/lock-keyhole.svg" alt="" width={14} height={14} className="shrink-0" />
              At least {PASSWORD_MIN_LENGTH} characters. A few random words strung together works a treat.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-3 text-sm leading-normal text-sand">
                <span className="relative grid size-[21px] shrink-0 place-items-center">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    defaultChecked={value("terms") === "on"}
                    aria-invalid={failed?.fieldErrors?.terms ? true : undefined}
                    className="peer size-[21px] cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-haze-line bg-well checked:border-zap checked:bg-zap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zap aria-[invalid=true]:border-blaze"
                  />
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute hidden size-3.5 text-night peer-checked:block"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className={DARK_LINK_CLASSES}>
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className={DARK_LINK_CLASSES}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {failed?.fieldErrors?.terms && (
                <p className="text-sm font-bold text-blaze">{failed.fieldErrors.terms}</p>
              )}
            </div>

            <SubmitButton pendingText="Creating your account…">
              Create account <span aria-hidden className="text-xl font-bold">→</span>
            </SubmitButton>

            <p className="text-center text-sm leading-normal text-haze">
              Already on the quest?{" "}
              <Link href="/login" className={DARK_BOLD_LINK_CLASSES}>
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </DarkFields>
  );
}

/** Shown after sign up: what happens next, plus a resend button. */
export function CheckEmailPanel({ email }: { email?: string }) {
  const [state, action] = useActionState(resendConfirmationAction, undefined);
  return (
    <DarkFields>
      <div className="flex flex-col gap-[26px]">
        <AuthHeading eyebrow="Almost there" title="Check your email.">
          {email ? (
            <>
              We&apos;ve sent a link to <span className="font-bold text-sand">{email}</span>.
            </>
          ) : (
            "We've sent you a link."
          )}{" "}
          Click it to switch on your account and you&apos;re in.
        </AuthHeading>
        {state?.message && <FormMessage tone={state.ok ? "success" : "error"}>{state.message}</FormMessage>}
        <form action={action} className="flex flex-col gap-3 border-t border-white/[0.13] pt-6">
          <input type="hidden" name="email" value={email ?? ""} />
          <p className="text-sm text-haze">Nothing after a few minutes? Check your spam folder, or:</p>
          <SubmitButton pendingText="Sending…">Send the link again</SubmitButton>
        </form>
      </div>
    </DarkFields>
  );
}

// ─── Forgot / reset password ───────────────────────────────────────────────

/** Forgot password, on the night page. Shared by customers and staff. */
export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  const failed = failure(state);

  return (
    <DarkFields>
      <div className="flex flex-col gap-8">
        <AuthHeading
          eyebrow={state?.ok ? "Link on its way" : "Let’s get you back on your quest"}
          title={state?.ok ? "Check your email." : "Forgot password?"}
          aside={
            // The file is trimmed to the sticker and exported at 3x this size: image
            // optimisation is off site-wide, so a big source would be shrunk (badly) by the browser.
            <div className="hidden h-[180px] w-[183px] shrink-0 items-center justify-center sm:flex">
              <Image
                src="/mascot/goblin-sticker.png"
                alt=""
                width={480}
                height={388}
                className="h-auto w-[170px] drop-shadow-[0_12px_16px_rgba(0,0,0,0.25)]"
              />
            </div>
          }
        >
          {state?.ok
            ? state.message
            : "Enter your account email and we’ll send you a link to reset your password."}
        </AuthHeading>

        {state?.ok ? (
          <p className="border-t border-white/[0.13] pt-6 text-sm leading-normal text-haze">
            Nothing after a few minutes? Check your spam folder, or{" "}
            {/* A full page load, so the form starts fresh. */}
            <a href="/forgot-password" className={DARK_BOLD_LINK_CLASSES}>
              try again
            </a>
            .
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-8" noValidate>
            {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              defaultValue={failed?.values?.email}
              error={failed?.fieldErrors?.email}
            />
            <SubmitButton pendingText="Sending…">
              Send reset link <span aria-hidden className="text-xl font-bold">→</span>
            </SubmitButton>
          </form>
        )}

        <Link href="/login" className="group flex items-center justify-center gap-2 self-center text-zap hover:text-white">
          <span aria-hidden className="text-lg">
            ←
          </span>
          <span className="text-sm font-bold underline underline-offset-2">Back to login</span>
        </Link>
      </div>
    </DarkFields>
  );
}

/** The knight standing guard beside the reset password heading (hidden on phones). */
const KNIGHT_ASIDE = (
  // Trimmed and exported at 3x this size: image optimisation is off site-wide.
  <div className="hidden h-[180px] w-[150px] shrink-0 items-center justify-center sm:flex">
    <Image
      src="/mascot/knight-helmet-sticker.png"
      alt=""
      width={360}
      height={515}
      className="h-auto w-[120px] drop-shadow-[0_12px_16px_rgba(0,0,0,0.25)]"
    />
  </div>
);

/** Reset password, on the night page. Reached from the reset email. */
export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, undefined);
  const failed = failure(state);

  return (
    <DarkFields>
      <div className="flex flex-col gap-8">
        <AuthHeading eyebrow="Back on your quest" title="New password." aside={KNIGHT_ASIDE}>
          Pick something long and memorable. A few random words works great.
        </AuthHeading>
        <form action={action} className="flex flex-col gap-6" noValidate>
          {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            showStrength
            error={failed?.fieldErrors?.password}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Type it again"
            error={failed?.fieldErrors?.confirmPassword}
          />
          <SubmitButton pendingText="Saving…">
            Save new password <span aria-hidden className="text-xl font-bold">→</span>
          </SubmitButton>
        </form>
      </div>
    </DarkFields>
  );
}

/** /reset-password without a recovery session: the link expired or was used. */
export function ResetLinkExpired() {
  return (
    <div className="flex flex-col gap-8">
      <AuthHeading eyebrow="Back on your quest" title="Link expired." aside={KNIGHT_ASIDE}>
        This reset link has expired or was already used. Links only last an hour. Ask for a fresh one and
        you&apos;ll be back in no time.
      </AuthHeading>
      <Link href="/forgot-password" className={`${ZAP_BUTTON_CLASSES} w-full`}>
        Send me a new link <span aria-hidden className="text-xl font-bold">→</span>
      </Link>
      <Link href="/login" className="group flex items-center justify-center gap-2 self-center text-zap hover:text-white">
        <span aria-hidden className="text-lg">
          ←
        </span>
        <span className="text-sm font-bold underline underline-offset-2">Back to login</span>
      </Link>
    </div>
  );
}
