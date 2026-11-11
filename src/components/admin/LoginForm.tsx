"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions/auth";
import { INPUT_CLASSES, LABEL_CLASSES, PRIMARY_BUTTON } from "@/components/admin/ui";

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
      <label className={LABEL_CLASSES}>
        Email
        <input type="email" name="email" required autoComplete="email" className={INPUT_CLASSES} />
      </label>
      <label className={LABEL_CLASSES}>
        Password
        <input type="password" name="password" required autoComplete="current-password" className={INPUT_CLASSES} />
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-coral-signal">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON} w-full`}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
