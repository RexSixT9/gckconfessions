import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import AdminList from "@/components/admin/AdminList";
import Footer from "@/components/Footer";
import { LogOut } from "lucide-react";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gck_admin_token")?.value;

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
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <main className="flex-1">
        {/* Header Section */}
        <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                  Manage Community Confessions
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                  Review, approve, and curate authentic submissions from your community.
                </p>
              </div>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <AdminList />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
