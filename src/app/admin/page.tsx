export default function AdminDashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <p className="max-w-md text-zinc-600">
        Login-gated dashboard for admin and staff roles. Auth not wired up
        yet.
      </p>
    </main>
  );
}
