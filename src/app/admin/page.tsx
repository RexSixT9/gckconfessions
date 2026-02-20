import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import AdminList from "@/components/admin/AdminList";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/adminlogin");
  }

  try {
    const payload = await verifyAdminToken(token);
    if (!payload.sub) {
      redirect("/adminlogin");
    }
  } catch {
    redirect("/adminlogin");
  }

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--accent))]">
              Admin
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
              Confession review
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Approve, reject and publish submissions
            </p>
          </div>
          <SignOutButton />
        </div>

        <AdminList />
      </div>
    </main>
  );
}
