"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  resendConfirmationAction,
  resetPasswordAction,
  signupAction,
  type AuthFormState,
} from "@/app/actions/auth";
import { FormMessage, PasswordField, SubmitButton, TextField } from "./fields";
import { AUTH_LINK_CLASSES } from "./AuthShell";

function failure(state: AuthFormState) {
  return state && !state.ok ? state : undefined;
}

// ─── Log in ────────────────────────────────────────────────────────────────

export function LoginForm({ next, initialMessage }: { next?: string; initialMessage?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const failed = failure(state);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
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
        required
        defaultValue={failed?.values?.email}
        error={failed?.fieldErrors?.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        error={failed?.fieldErrors?.password}
      />
      <Link href="/forgot-password" className={`-mt-1 self-end text-sm ${AUTH_LINK_CLASSES}`}>
        Forgot your password?
      </Link>
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}

// ─── Sign up ───────────────────────────────────────────────────────────────

export function SignupForm() {
  const [state, action] = useActionState(signupAction, undefined);
  const failed = failure(state);

  if (state?.ok) return <CheckEmailPanel email={state.email} />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={50}
          defaultValue={failed?.values?.firstName}
          error={failed?.fieldErrors?.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          required
          maxLength={50}
          defaultValue={failed?.values?.lastName}
          error={failed?.fieldErrors?.lastName}
        />
      </div>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={failed?.values?.email}
        error={failed?.fieldErrors?.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        showStrength
        error={failed?.fieldErrors?.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        error={failed?.fieldErrors?.confirmPassword}
      />

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="terms"
            required
            defaultChecked={failed?.values?.terms === "on"}
            aria-invalid={failed?.fieldErrors?.terms ? true : undefined}
            className="mt-0.5 size-5 shrink-0 accent-blaze"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className={AUTH_LINK_CLASSES}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className={AUTH_LINK_CLASSES}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {failed?.fieldErrors?.terms && (
          <p className="text-sm font-bold text-blaze">{failed.fieldErrors.terms}</p>
        )}
      </div>

      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
    </form>
  );
}

/** Shown after sign up: what happens next, plus a resend button. */
export function CheckEmailPanel({ email }: { email?: string }) {
  const [state, action] = useActionState(resendConfirmationAction, undefined);
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border-[1.5px] border-grape bg-white px-5 py-4">
        <p className="text-lg font-black text-night">Check your email ✉️</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          {email ? (
            <>
              We&apos;ve sent a confirmation link to <span className="font-black">{email}</span>.
            </>
          ) : (
            "We've sent you a confirmation link."
          )}{" "}
          Click it to switch on your account, then you&apos;re in.
        </p>
      </div>
      {state?.message && <FormMessage tone={state.ok ? "success" : "error"}>{state.message}</FormMessage>}
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="email" value={email ?? ""} />
        <p className="text-sm text-quiet">Nothing after a few minutes? Check your spam folder, or:</p>
        <SubmitButton pendingText="Sending…">Send the link again</SubmitButton>
      </form>
    </div>
  );
}

// ─── Forgot / reset password ───────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  const failed = failure(state);

  if (state?.ok) return <FormMessage tone="success">{state.message}</FormMessage>;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={failed?.values?.email}
        error={failed?.fieldErrors?.email}
      />
      <SubmitButton pendingText="Sending…">Email me a reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, undefined);
  const failed = failure(state);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {failed?.message && <FormMessage tone="error">{failed.message}</FormMessage>}
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        showStrength
        error={failed?.fieldErrors?.password}
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        error={failed?.fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
