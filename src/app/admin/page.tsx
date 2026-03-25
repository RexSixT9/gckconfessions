import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import AdminList from "@/components/admin/AdminList";
import AdminStatsBar from "@/components/admin/AdminStatsBar";
import SignOutButton from "@/components/admin/SignOutButton";
import { PageReveal, ScrollReveal } from "@/components/Reveal";
import { connectToDatabase } from "@/lib/mongodb";
import Confession from "@/models/Confession";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageScaffold";

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
    <PageShell containerClassName="max-w-6xl">
      <PageReveal y={10} duration={0.4}>

        {/*  Page header  */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-sm px-3 py-1 text-[0.62rem] uppercase tracking-[0.14em]">
              Admin Panel
            </Badge>
            <h1 className="text-[clamp(1.9rem,5.6vw,2.8rem)] font-semibold tracking-[0.04em] text-foreground text-balance">
              Review Queue
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review incoming confessions, approve or reject them, and manage what gets published.
            </p>
          </div>
          <SignOutButton />
        </div>

        <ScrollReveal delay={0.02} y={10}>
          <AdminStatsBar initialStats={stats} />
        </ScrollReveal>

        {/*  Main list  */}
        <ScrollReveal delay={0.06} y={12}>
          <Card className="border-border/70 bg-card shadow-none">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <AdminList />
            </CardContent>
          </Card>
        </ScrollReveal>

      </PageReveal>
    </PageShell>
  );
}

