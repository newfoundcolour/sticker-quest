"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { passwordStrength } from "@/lib/passwordPolicy";
import { LIFT_ON_HOVER_ANY, OPTION_TRANSITION } from "@/components/configurator/StepCard";

/** Same input look as the configurator's custom size fields. */
export const INPUT_CLASSES =
  "w-full rounded-lg border border-grape bg-white px-3 py-2.5 text-base font-bold text-night outline-none placeholder:font-normal placeholder:text-quiet focus:border-blaze focus-visible:ring-2 focus-visible:ring-blaze/30 aria-[invalid=true]:border-blaze";

export const PRIMARY_BUTTON_CLASSES = [
  "w-full rounded-full border-2 border-night bg-blaze px-8 py-3.5 text-base font-black uppercase tracking-wide text-white",
  OPTION_TRANSITION,
  LIFT_ON_HOVER_ANY,
  "shadow-pop-blaze disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;

export function TextField({ label, name, error, hint, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-black text-night">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={INPUT_CLASSES}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-quiet">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-bold text-blaze">
      {children}
    </p>
  );
}

const STRENGTH_BAR_CLASSES = ["bg-blaze", "bg-waypoint-gold", "bg-grape", "bg-trail-teal"];

/**
 * Password input with a show/hide toggle. Pasting is always allowed (password
 * managers rely on it). With `showStrength`, a live, length-led hint shows
 * underneath — guidance only; the server enforces the actual rules.
 */
export function PasswordField({
  label,
  name,
  error,
  showStrength = false,
  autoComplete,
  defaultValue,
}: {
  label: string;
  name: string;
  error?: string;
  showStrength?: boolean;
  autoComplete: "current-password" | "new-password";
  defaultValue?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const strength = passwordStrength(value);
  const describedBy = [showStrength && `${id}-strength`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-black text-night">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          spellCheck={false}
          autoCapitalize="none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${INPUT_CLASSES} pr-16`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={id}
          aria-pressed={visible}
          className="absolute inset-y-1 right-1 rounded-md px-2.5 text-xs font-black uppercase text-grape hover:bg-grape/10 focus-visible:outline-2 focus-visible:outline-blaze"
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>

      {showStrength && (
        <div id={`${id}-strength`} aria-live="polite" className="flex flex-col gap-1">
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={[
                  "h-1.5 flex-1 rounded-full transition-colors",
                  value && i < Math.max(strength.score, 1)
                    ? STRENGTH_BAR_CLASSES[strength.score]
                    : "bg-night/10",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-xs text-quiet">
            {strength.label && <span className="font-black text-night">{strength.label}. </span>}
            {strength.hint}
          </p>
        </div>
      )}

      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

/** Submit button that disables itself while the form's action is running (blocks double submits). */
export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={PRIMARY_BUTTON_CLASSES}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Form-level message (e.g. "Email or password is incorrect."). */
export function FormMessage({ tone, children }: { tone: "error" | "info" | "success"; children: ReactNode }) {
  const classes = {
    error: "border-blaze bg-blaze/10 text-night",
    info: "border-grape bg-grape/10 text-night",
    success: "border-trail-teal bg-trail-teal/15 text-night",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border-[1.5px] px-4 py-3 text-sm font-bold ${classes}`}>
      {children}
    </p>
  );
}
