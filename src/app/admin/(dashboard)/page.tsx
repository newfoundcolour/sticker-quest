import { signOutAction } from "@/app/actions/auth";

export default function AdminDashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <p className="max-w-md text-zinc-600">
        Login-gated dashboard for admin and staff roles.
      </p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-lg border border-ink-navy/15 px-4 py-2 text-sm font-medium text-ink-navy hover:bg-ink-navy/5"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
