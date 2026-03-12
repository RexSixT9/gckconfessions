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
    <main className="flex-1 bg-background">
      <PageReveal className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10" y={10} duration={0.4}>

        {/*  Page header  */}
        <div className="mb-8 flex animate-slide-down flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 uppercase tracking-wider">
              Admin Panel
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Confession Review
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review, approve, reject, and manage submissions.
            </p>
          </div>
          <SignOutButton />
        </div>

        <ScrollReveal delay={0.02} y={10}>
          <AdminStatsBar initialStats={stats} />
        </ScrollReveal>

        {/*  Main list  */}
        <ScrollReveal delay={0.06} y={12}>
          <Card className="animate-blur-in border-border/70 animation-delay-400">
            <CardContent className="p-6 sm:p-8">
              <AdminList />
            </CardContent>
          </Card>
        </ScrollReveal>

      </PageReveal>
    </main>
  );
}

