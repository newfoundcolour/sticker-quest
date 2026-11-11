"use client";

import Image from "next/image";
import { createContext, useContext, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { passwordStrength } from "@/lib/passwordPolicy";
import { LIFT_ON_HOVER_ANY, OPTION_TRANSITION } from "@/components/configurator/StepCard";
import { ZAP_BUTTON_CLASSES } from "@/components/buttonStyles";

/** Same input look as the configurator's custom size fields. */
export const INPUT_CLASSES =
  "w-full rounded-lg border border-grape bg-white px-3 py-2.5 text-base font-bold text-night outline-none placeholder:font-normal placeholder:text-quiet focus:border-blaze focus-visible:ring-2 focus-visible:ring-blaze/30 aria-[invalid=true]:border-blaze";

/** Inputs on the night page (sign up). 16px on phones so iOS doesn't zoom in. */
export const DARK_INPUT_CLASSES =
  "h-[50px] w-full rounded-xl border border-well-line bg-well px-4 text-base text-sand outline-none placeholder:text-haze-dim focus:border-zap focus-visible:ring-2 focus-visible:ring-zap/30 aria-[invalid=true]:border-blaze sm:text-sm";

export const PRIMARY_BUTTON_CLASSES = [
  "w-full rounded-full border-2 border-night bg-blaze px-8 py-3.5 text-base font-black uppercase tracking-wide text-white",
  OPTION_TRANSITION,
  LIFT_ON_HOVER_ANY,
  "shadow-pop-blaze disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const DARK_PRIMARY_BUTTON_CLASSES = `${ZAP_BUTTON_CLASSES} w-full`;

/**
 * Which surface the fields sit on. Forms on the light sand card (the default)
 * or on the night page, like sign up — wrap those in <DarkFields>.
 */
const FieldTone = createContext<"light" | "dark">("light");

export function DarkFields({ children }: { children: ReactNode }) {
  return <FieldTone.Provider value="dark">{children}</FieldTone.Provider>;
}

/** True inside <DarkFields>, for custom fields that sit beside TextField. */
export function useDark() {
  return useContext(FieldTone) === "dark";
}

export function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  const dark = useDark();
  return (
    <label htmlFor={htmlFor} className={dark ? "text-sm font-bold text-sand" : "text-sm font-black text-night"}>
      {label}
      {optional && <span className={dark ? "font-normal text-haze" : "font-normal text-quiet"}> (optional)</span>}
    </label>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  /** Adds "(optional)" after the label. */
  optional?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;

export function TextField({ label, name, error, hint, optional, ...input }: FieldProps) {
  const id = useId();
  const dark = useDark();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={dark ? "flex flex-col gap-2" : "flex flex-col gap-1.5"}>
      <FieldLabel htmlFor={id} label={label} optional={optional} />
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={dark ? DARK_INPUT_CLASSES : INPUT_CLASSES}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className={dark ? "text-[13px] leading-normal text-haze" : "text-xs text-quiet"}>
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
  placeholder,
}: {
  label: string;
  name: string;
  error?: string;
  showStrength?: boolean;
  autoComplete: "current-password" | "new-password";
  defaultValue?: string;
  /** Placeholder text (used on the dark sign up form). */
  placeholder?: string;
}) {
  const id = useId();
  const dark = useDark();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const strength = passwordStrength(value);
  const describedBy = [showStrength && `${id}-strength`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={dark ? "flex flex-col gap-2" : "flex flex-col gap-1.5"}>
      <FieldLabel htmlFor={id} label={label} />
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          spellCheck={false}
          autoCapitalize="none"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={dark ? `${DARK_INPUT_CLASSES} pr-12` : `${INPUT_CLASSES} pr-16`}
        />
        {dark ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-controls={id}
            aria-pressed={visible}
            aria-label="Show password"
            className={[
              "absolute inset-y-1.5 right-1.5 flex w-9 items-center justify-center rounded-lg transition-opacity hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-zap",
              visible ? "opacity-100" : "opacity-80",
            ].join(" ")}
          >
            <Image src="/icons/eye.svg" alt="" width={19} height={19} />
            {/* A slash through the eye while the password is showing. */}
            {visible && <span aria-hidden className="absolute h-0.5 w-5 rotate-45 rounded-full bg-haze" />}
          </button>
        ) : (
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
        )}
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
                    : dark
                      ? "bg-white/10"
                      : "bg-night/10",
                ].join(" ")}
              />
            ))}
          </div>
          <p className={dark ? "text-[13px] text-haze" : "text-xs text-quiet"}>
            {strength.label && <span className={dark ? "font-black text-sand" : "font-black text-night"}>{strength.label}. </span>}
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
  const dark = useDark();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={dark ? DARK_PRIMARY_BUTTON_CLASSES : PRIMARY_BUTTON_CLASSES}
    >
      {pending ? pendingText : children}
    </button>
  );
}

/** Form-level message (e.g. "Email or password is incorrect."). */
export function FormMessage({ tone, children }: { tone: "error" | "info" | "success"; children: ReactNode }) {
  const dark = useDark();
  const classes = dark
    ? {
        error: "border-blaze bg-blaze/15 text-sand",
        info: "border-grape bg-grape/20 text-sand",
        success: "border-trail-teal bg-trail-teal/15 text-sand",
      }[tone]
    : {
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
