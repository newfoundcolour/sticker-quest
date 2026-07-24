"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions/auth";

export function LoginForm() {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);

    const result = await signInAction(formData);
    // A successful sign-in redirects server-side and never returns here.
    setError(result.error);
    setPending(false);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-navy/80">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-lg border border-ink-navy/15 px-3 py-2 outline-none focus:border-coral-signal"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-navy/80">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-ink-navy/15 px-3 py-2 outline-none focus:border-coral-signal"
        />
      </label>
      {error && <p className="text-sm text-coral-signal">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-coral-signal px-4 py-2 text-sm font-semibold text-paper hover:bg-coral-signal/90 disabled:opacity-60"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
