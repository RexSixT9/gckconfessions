import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import AdminList from "@/components/admin/AdminList";
import SignOutButton from "@/components/admin/SignOutButton";
import { connectToDatabase } from "@/lib/mongodb";
import Confession from "@/models/Confession";

async function getStats() {
  try {
    await connectToDatabase();
    const [pending, approved, rejected] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
    ]);
    return { pending, approved, rejected, total: pending + approved + rejected };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/adminlogin");

  try {
    const payload = await verifyAdminToken(token);
    if (!payload.sub) redirect("/adminlogin");
  } catch {
    redirect("/adminlogin");
  }

  const stats = await getStats();

  return (
    <main className="flex-1 bg-[hsl(var(--background))]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">

        {/*  Page header  */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="badge badge-accent mb-3 inline-flex uppercase tracking-wider">
              Admin Panel
            </span>
            <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              Confession Review
            </h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Review, approve, reject, and manage submissions.
            </p>
          </div>
          <SignOutButton />
        </div>

        {/*  Stats bar  */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total", value: stats.total, cls: "text-[hsl(var(--foreground))]", dot: "bg-[hsl(var(--muted-foreground))]" },
              { label: "Pending", value: stats.pending, cls: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
              { label: "Approved", value: stats.approved, cls: "text-[hsl(var(--action-accept))]", dot: "bg-[hsl(var(--action-accept))]" },
              { label: "Rejected", value: stats.rejected, cls: "text-[hsl(var(--muted-foreground))]", dot: "bg-[hsl(var(--muted-foreground))]/40" },
            ].map(({ label, value, cls, dot }) => (
              <div
                key={label}
                className="card flex flex-col gap-2 px-6 py-5"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label}</span>
                </div>
                <span className={`text-3xl font-black tabular-nums ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/*  Main list  */}
        <div className="card p-6 sm:p-8">
          <AdminList />
        </div>

      </div>
    </main>
  );
}
